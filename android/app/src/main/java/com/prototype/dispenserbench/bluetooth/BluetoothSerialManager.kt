package com.prototype.dispenserbench.bluetooth

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import android.content.Context
import android.os.Build
import com.prototype.dispenserbench.model.DeviceResponse
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeoutOrNull
import java.io.BufferedReader
import java.io.IOException
import java.io.InputStreamReader
import java.io.OutputStream
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

/**
 * Robust Bluetooth Classic RFCOMM / SPP serial manager for HC-05 communication.
 *
 * Implements:
 * - Standard SPP UUID: 00001101-0000-1000-8000-00805F9B34FB
 * - Off-main-thread connection and I/O (Dispatchers.IO)
 * - Single dedicated reader loop with bounded line buffer (max 2048 chars)
 * - Clean socket teardown, duplicate connection prevention, and graceful reconnect
 * - Request ID matching with timeouts
 */
class BluetoothSerialManager(private val context: Context) {

    companion object {
        val SPP_UUID: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
        private const val MAX_LINE_LENGTH = 2048
        private const val DEFAULT_TIMEOUT_MS = 6000L
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private val _connectionState = MutableStateFlow<BluetoothConnectionState>(BluetoothConnectionState.Disconnected())
    val connectionState: StateFlow<BluetoothConnectionState> = _connectionState.asStateFlow()

    // Stream of incoming parsed responses
    private val _incomingResponses = MutableSharedFlow<DeviceResponse>(extraBufferCapacity = 64)
    val incomingResponses: SharedFlow<DeviceResponse> = _incomingResponses.asSharedFlow()

    // Stream of raw log events (for bench test diagnostics)
    private val _rawTrafficLogs = MutableSharedFlow<Pair<Boolean, String>>(extraBufferCapacity = 128)
    val rawTrafficLogs: SharedFlow<Pair<Boolean, String>> = _rawTrafficLogs.asSharedFlow() // true = sent, false = received

    @Volatile
    private var activeSocket: BluetoothSocket? = null
    @Volatile
    private var outputStream: OutputStream? = null

    private var readerJob: Job? = null
    private var connectJob: Job? = null

    // Pending requests awaiting response matching by ID
    private val pendingRequests = ConcurrentHashMap<String, CompletableDeferred<DeviceResponse>>()

    private val bluetoothAdapter: BluetoothAdapter? by lazy {
        BluetoothAdapter.getDefaultAdapter()
    }

    val isBluetoothSupported: Boolean
        get() = bluetoothAdapter != null

    val isBluetoothEnabled: Boolean
        get() = bluetoothAdapter?.isEnabled == true

    /**
     * Lists paired Bluetooth devices from the phone's system settings.
     */
    @SuppressLint("MissingPermission")
    fun getBondedDevices(): List<BluetoothDevice> {
        val adapter = bluetoothAdapter ?: return emptyList()
        return try {
            adapter.bondedDevices?.toList() ?: emptyList()
        } catch (_: SecurityException) {
            emptyList()
        }
    }

    /**
     * Connects to a selected paired device. Prevents duplicate connections and cleans up existing sockets.
     */
    @SuppressLint("MissingPermission")
    fun connect(device: BluetoothDevice) {
        if (_connectionState.value.isConnecting) {
            return
        }

        // Cancel previous connect attempt if any
        connectJob?.cancel()

        connectJob = scope.launch {
            cleanUpCurrentConnection("Reconnecting")

            val deviceName = try {
                device.name ?: "Unknown Device"
            } catch (_: SecurityException) {
                "Unknown Device"
            }
            val deviceAddress = device.address

            _connectionState.value = BluetoothConnectionState.Connecting(deviceName, deviceAddress)
            logTraffic(true, "[LOCAL] Initiating RFCOMM connection to $deviceName ($deviceAddress)...")

            try {
                // Connect via RFCOMM SPP socket
                val socket = device.createRfcommSocketToServiceRecord(SPP_UUID)
                socket.connect()

                activeSocket = socket
                outputStream = socket.outputStream

                _connectionState.value = BluetoothConnectionState.Connected(deviceName, deviceAddress)
                logTraffic(false, "[LOCAL] Connected to $deviceName over SPP. Ready for JSON Lines protocol.")

                startReaderLoop(socket)
            } catch (se: SecurityException) {
                _connectionState.value = BluetoothConnectionState.Error(
                    BluetoothErrorType.PERMISSION_DENIED,
                    "Bluetooth permission denied. Grant BLUETOOTH_CONNECT in app settings."
                )
                logTraffic(false, "[LOCAL ERROR] Security exception: ${se.localizedMessage}")
                cleanUpCurrentConnection()
            } catch (e: IOException) {
                _connectionState.value = BluetoothConnectionState.Error(
                    BluetoothErrorType.CONNECTION_TIMEOUT,
                    "Failed to connect to $deviceName. Verify HC-05 is powered and paired."
                )
                logTraffic(false, "[LOCAL ERROR] Connection failed: ${e.localizedMessage}")
                cleanUpCurrentConnection()
            }
        }
    }

    /**
     * Dedicated line-reader loop reading from socket off the main thread.
     */
    private fun startReaderLoop(socket: BluetoothSocket) {
        readerJob?.cancel()
        readerJob = scope.launch {
            var reader: BufferedReader? = null
            try {
                val inputStream = socket.inputStream
                reader = BufferedReader(InputStreamReader(inputStream, Charsets.UTF_8))
                val lineBuffer = StringBuilder()

                while (isActive && socket.isConnected) {
                    val line = reader.readLine() ?: break // EOF reached -> remote disconnected

                    if (line.length > MAX_LINE_LENGTH) {
                        logTraffic(false, "[IGNORED OVERSIZED LINE (${line.length} chars)]")
                        continue
                    }

                    val trimmed = line.trim()
                    if (trimmed.isEmpty()) continue

                    logTraffic(false, trimmed)

                    val parsedResponse = DeviceResponse.parse(trimmed)
                    if (parsedResponse != null) {
                        _incomingResponses.emit(parsedResponse)

                        // Check if an in-flight request was waiting for this specific ID
                        val reqId = parsedResponse.id
                        if (!reqId.isNullOrEmpty()) {
                            val deferred = pendingRequests.remove(reqId)
                            deferred?.complete(parsedResponse)
                        }
                    } else {
                        logTraffic(false, "[NON-JSON OR MALFORMED LINE]: $trimmed")
                    }
                }

                // If reader loop finishes normally without explicit cancellation, connection was lost
                if (isActive) {
                    _connectionState.value = BluetoothConnectionState.Error(
                        BluetoothErrorType.CONNECTION_LOST,
                        "Connection closed by remote device (ESP8266/HC-05)."
                    )
                    logTraffic(false, "[LOCAL] Remote device disconnected.")
                }
            } catch (_: CancellationException) {
                // Normal cancellation on disconnect
            } catch (ioe: IOException) {
                if (isActive) {
                    _connectionState.value = BluetoothConnectionState.Error(
                        BluetoothErrorType.CONNECTION_LOST,
                        "Lost connection to device: ${ioe.localizedMessage ?: "I/O error"}"
                    )
                    logTraffic(false, "[LOCAL ERROR] I/O Error: ${ioe.localizedMessage}")
                }
            } finally {
                try {
                    reader?.close()
                } catch (_: Exception) {}
                cleanUpCurrentConnection("Reader terminated")
            }
        }
    }

    /**
     * Sends a JSON line and suspends until a matching response arrives or timeout occurs.
     */
    suspend fun sendRequestWithAck(
        jsonLine: String,
        requestId: String,
        timeoutMs: Long = DEFAULT_TIMEOUT_MS
    ): Result<DeviceResponse> = withContext(Dispatchers.IO) {
        val currentSocket = activeSocket
        val currentOut = outputStream

        if (currentSocket == null || !currentSocket.isConnected || currentOut == null) {
            return@withContext Result.failure(IllegalStateException("Not connected to HC-05 device."))
        }

        val deferred = CompletableDeferred<DeviceResponse>()
        pendingRequests[requestId] = deferred

        try {
            val bytes = jsonLine.toByteArray(Charsets.UTF_8)
            currentOut.write(bytes)
            currentOut.flush()
            logTraffic(true, jsonLine.trim())

            // Await matching response with timeout
            val response = withTimeoutOrNull(timeoutMs) {
                deferred.await()
            }

            if (response != null) {
                Result.success(response)
            } else {
                pendingRequests.remove(requestId)
                Result.failure(java.util.concurrent.TimeoutException("Device did not respond to request '$requestId' within ${timeoutMs / 1000}s."))
            }
        } catch (e: Exception) {
            pendingRequests.remove(requestId)
            Result.failure(e)
        }
    }

    /**
     * Sends a raw line without waiting for acknowledgement (used for broadcast or ping).
     */
    suspend fun sendRawLine(line: String): Result<Unit> = withContext(Dispatchers.IO) {
        val currentOut = outputStream
        if (currentOut == null) {
            return@withContext Result.failure(IllegalStateException("Not connected."))
        }
        try {
            val bytes = (line.trimEnd() + "\n").toByteArray(Charsets.UTF_8)
            currentOut.write(bytes)
            currentOut.flush()
            logTraffic(true, line.trimEnd())
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Gracefully disconnects and resets all I/O streams.
     */
    fun disconnect() {
        scope.launch {
            cleanUpCurrentConnection("User requested disconnect")
            _connectionState.value = BluetoothConnectionState.Disconnected("Disconnected")
            logTraffic(true, "[LOCAL] Bluetooth disconnected cleanly.")
        }
    }

    private fun cleanUpCurrentConnection(reason: String = "") {
        // Complete all pending requests exceptionally
        for ((_, deferred) in pendingRequests) {
            if (!deferred.isCompleted) {
                deferred.completeExceptionally(IOException("Connection closed: $reason"))
            }
        }
        pendingRequests.clear()

        readerJob?.cancel()
        readerJob = null

        try {
            outputStream?.close()
        } catch (_: Exception) {}
        outputStream = null

        try {
            activeSocket?.close()
        } catch (_: Exception) {}
        activeSocket = null
    }

    private fun logTraffic(sent: Boolean, line: String) {
        _rawTrafficLogs.tryEmit(Pair(sent, line))
    }
}

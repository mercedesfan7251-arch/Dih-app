package com.prototype.dispenserbench.viewmodel

import android.annotation.SuppressLint
import android.app.Application
import android.bluetooth.BluetoothDevice
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.prototype.dispenserbench.bluetooth.BluetoothConnectionState
import com.prototype.dispenserbench.bluetooth.BluetoothErrorType
import com.prototype.dispenserbench.bluetooth.BluetoothSerialManager
import com.prototype.dispenserbench.model.DeviceResponse
import com.prototype.dispenserbench.model.GetStateRequest
import com.prototype.dispenserbench.model.SetScheduleRequest
import com.prototype.dispenserbench.model.SlotId
import com.prototype.dispenserbench.model.SlotTimeEntry
import com.prototype.dispenserbench.model.TestServoRequest
import com.prototype.dispenserbench.model.generateRequestId
import com.prototype.dispenserbench.model.isValid24HourTime
import com.prototype.dispenserbench.storage.ScheduleStorage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

sealed class ScheduleSendStatus {
    data object Idle : ScheduleSendStatus()
    data class WaitingForConfirmation(val requestId: String) : ScheduleSendStatus()
    data class Accepted(val requestId: String, val revision: Int, val timestamp: String) : ScheduleSendStatus()
    data class Rejected(val requestId: String, val errorReason: String) : ScheduleSendStatus()
    data class Timeout(val requestId: String) : ScheduleSendStatus()
    data class ValidationError(val error: String) : ScheduleSendStatus()
}

sealed class ServoTestStatus {
    data object Idle : ServoTestStatus()
    data class Testing(val slotId: SlotId, val requestId: String) : ServoTestStatus()
    data class Succeeded(val slotId: SlotId, val requestId: String, val timestamp: String) : ServoTestStatus()
    data class Failed(val slotId: SlotId, val requestId: String, val reason: String) : ServoTestStatus()
    data class Timeout(val slotId: SlotId, val requestId: String) : ServoTestStatus()
}

data class TrafficLogItem(
    val timestamp: String,
    val isSent: Boolean,
    val text: String
)

data class DeviceSyncComparison(
    val lastCheckedTimestamp: String,
    val deviceRevision: Int?,
    val isSynced: Boolean,
    val mismatches: List<String>
)

class BenchTestViewModel(application: Application) : AndroidViewModel(application) {

    private val bluetoothManager = BluetoothSerialManager(application)
    private val storage = ScheduleStorage(application)
    private val timeFormat = SimpleDateFormat("HH:mm:ss", Locale.US)

    // Bluetooth Connection
    val connectionState: StateFlow<BluetoothConnectionState> = bluetoothManager.connectionState
    val isBluetoothSupported: Boolean get() = bluetoothManager.isBluetoothSupported
    val isBluetoothEnabled: Boolean get() = bluetoothManager.isBluetoothEnabled

    private val _pairedDevices = MutableStateFlow<List<BluetoothDevice>>(emptyList())
    val pairedDevices: StateFlow<List<BluetoothDevice>> = _pairedDevices.asStateFlow()

    private val _selectedDevice = MutableStateFlow<BluetoothDevice?>(null)
    val selectedDevice: StateFlow<BluetoothDevice?> = _selectedDevice.asStateFlow()

    // 9 Generic Slot times (HH:mm)
    private val _scheduleSlots = MutableStateFlow<Map<SlotId, String>>(storage.loadSchedule())
    val scheduleSlots: StateFlow<Map<SlotId, String>> = _scheduleSlots.asStateFlow()

    // Schedule status & last acknowledgement
    private val _scheduleSendStatus = MutableStateFlow<ScheduleSendStatus>(ScheduleSendStatus.Idle)
    val scheduleSendStatus: StateFlow<ScheduleSendStatus> = _scheduleSendStatus.asStateFlow()

    private val _lastDeviceAcknowledgement = MutableStateFlow<Pair<DeviceResponse, String>?>(null)
    val lastDeviceAcknowledgement: StateFlow<Pair<DeviceResponse, String>?> = _lastDeviceAcknowledgement.asStateFlow()

    private val _localSaveNotice = MutableStateFlow<String?>(null)
    val localSaveNotice: StateFlow<String?> = _localSaveNotice.asStateFlow()

    // Servo Bench Test
    private val _selectedTestSlot = MutableStateFlow<SlotId>(SlotId.D1_MORNING)
    val selectedTestSlot: StateFlow<SlotId> = _selectedTestSlot.asStateFlow()

    private val _servoTestStatus = MutableStateFlow<ServoTestStatus>(ServoTestStatus.Idle)
    val servoTestStatus: StateFlow<ServoTestStatus> = _servoTestStatus.asStateFlow()

    // Device state read-back comparison
    private val _syncComparison = MutableStateFlow<DeviceSyncComparison?>(null)
    val syncComparison: StateFlow<DeviceSyncComparison?> = _syncComparison.asStateFlow()

    // Raw traffic log
    private val _trafficLogs = MutableStateFlow<List<TrafficLogItem>>(emptyList())
    val trafficLogs: StateFlow<List<TrafficLogItem>> = _trafficLogs.asStateFlow()

    init {
        // Collect incoming traffic logs
        viewModelScope.launch {
            bluetoothManager.rawTrafficLogs.collect { (isSent, text) ->
                val now = timeFormat.format(Date())
                val item = TrafficLogItem(now, isSent, text)
                _trafficLogs.value = (_trafficLogs.value + item).takeLast(150)
            }
        }

        // Collect incoming parsed responses to track general device acknowledgements
        viewModelScope.launch {
            bluetoothManager.incomingResponses.collect { resp ->
                val now = timeFormat.format(Date())
                _lastDeviceAcknowledgement.value = Pair(resp, now)
            }
        }

        refreshPairedDevices()
    }

    @SuppressLint("MissingPermission")
    fun refreshPairedDevices() {
        if (!bluetoothManager.isBluetoothSupported) {
            return
        }
        val bonded = bluetoothManager.getBondedDevices()
        _pairedDevices.value = bonded

        // Try restoring last connected MAC
        val lastMac = storage.getLastDeviceMac()
        if (_selectedDevice.value == null && lastMac != null) {
            _selectedDevice.value = bonded.firstOrNull { it.address.equals(lastMac, ignoreCase = true) }
        }
        if (_selectedDevice.value == null && bonded.isNotEmpty()) {
            _selectedDevice.value = bonded.first()
        }
    }

    fun selectDevice(device: BluetoothDevice) {
        _selectedDevice.value = device
        storage.saveLastDeviceMac(device.address)
    }

    fun connect() {
        val device = _selectedDevice.value
        if (device == null) {
            return
        }
        if (!bluetoothManager.isBluetoothEnabled) {
            // Handled via BluetoothDisabled state
            return
        }
        bluetoothManager.connect(device)
    }

    fun disconnect() {
        bluetoothManager.disconnect()
        _scheduleSendStatus.value = ScheduleSendStatus.Idle
        _servoTestStatus.value = ServoTestStatus.Idle
    }

    fun updateSlotTime(slot: SlotId, timeString: String) {
        val updated = _scheduleSlots.value.toMutableMap()
        updated[slot] = timeString.trim()
        _scheduleSlots.value = updated
        _localSaveNotice.value = null
    }

    fun saveScheduleLocally() {
        storage.saveSchedule(_scheduleSlots.value)
        val now = timeFormat.format(Date())
        _localSaveNotice.value = "Saved on phone at $now. (Not yet sent to hardware)."
    }

    /**
     * Validates and transmits the 9-slot schedule to the ESP8266 over Bluetooth Classic.
     * Requires and waits for matching acknowledgement before declaring acceptance.
     */
    fun sendScheduleToDevice() {
        val currentSlots = _scheduleSlots.value

        // 1. Validate all 9 slots are present and strictly HH:mm
        for (slot in SlotId.entries) {
            val time = currentSlots[slot] ?: ""
            if (!isValid24HourTime(time)) {
                _scheduleSendStatus.value = ScheduleSendStatus.ValidationError(
                    "Invalid time for ${slot.displayTitle}: '$time'. Must be HH:mm (24-hour)."
                )
                return
            }
        }

        val entries = SlotId.entries.map { slot ->
            SlotTimeEntry(slot = slot.canonicalId, time = currentSlots[slot]!!)
        }

        val reqId = generateRequestId()
        val request = SetScheduleRequest(id = reqId, slots = entries)

        _scheduleSendStatus.value = ScheduleSendStatus.WaitingForConfirmation(reqId)

        viewModelScope.launch {
            val result = bluetoothManager.sendRequestWithAck(
                jsonLine = request.toJsonLine(),
                requestId = reqId,
                timeoutMs = 7000L
            )

            result.fold(
                onSuccess = { response ->
                    val now = timeFormat.format(Date())
                    if (response.ok) {
                        val rev = response.revision ?: (storage.getLastKnownRevision() + 1)
                        storage.saveLastKnownRevision(rev)
                        storage.saveSchedule(currentSlots) // Ensure phone also saves accepted schedule
                        _scheduleSendStatus.value = ScheduleSendStatus.Accepted(reqId, rev, now)
                    } else {
                        val errorReason = response.error ?: "ESP8266 rejected schedule"
                        _scheduleSendStatus.value = ScheduleSendStatus.Rejected(reqId, errorReason)
                    }
                },
                onFailure = { error ->
                    if (error is java.util.concurrent.TimeoutException) {
                        _scheduleSendStatus.value = ScheduleSendStatus.Timeout(reqId)
                    } else {
                        _scheduleSendStatus.value = ScheduleSendStatus.Rejected(reqId, error.localizedMessage ?: "Transmission failed")
                    }
                }
            )
        }
    }

    /**
     * Sends get_state request and compares the device's stored 9 slots with the local phone slots.
     */
    fun readBackDeviceState() {
        val reqId = generateRequestId()
        viewModelScope.launch {
            val request = GetStateRequest(id = reqId)
            val result = bluetoothManager.sendRequestWithAck(
                jsonLine = request.toJsonLine(),
                requestId = reqId,
                timeoutMs = 6000L
            )

            val now = timeFormat.format(Date())
            result.fold(
                onSuccess = { response ->
                    val deviceSlots = response.slots ?: emptyList()
                    val mismatches = mutableListOf<String>()

                    val localSchedule = _scheduleSlots.value
                    for (slot in SlotId.entries) {
                        val localTime = localSchedule[slot] ?: ""
                        val remoteTime = deviceSlots.firstOrNull { it.slot.equals(slot.canonicalId, ignoreCase = true) }?.time
                        if (remoteTime == null) {
                            mismatches.add("${slot.canonicalId}: missing on device")
                        } else if (remoteTime != localTime) {
                            mismatches.add("${slot.canonicalId}: Phone has '$localTime' but device has '$remoteTime'")
                        }
                    }

                    _syncComparison.value = DeviceSyncComparison(
                        lastCheckedTimestamp = now,
                        deviceRevision = response.revision,
                        isSynced = mismatches.isEmpty() && deviceSlots.size == 9,
                        mismatches = mismatches
                    )
                },
                onFailure = { error ->
                    _syncComparison.value = DeviceSyncComparison(
                        lastCheckedTimestamp = now,
                        deviceRevision = null,
                        isSynced = false,
                        mismatches = listOf("Read-back failed: ${error.localizedMessage ?: "Timeout"}")
                    )
                }
            )
        }
    }

    fun selectTestSlot(slot: SlotId) {
        _selectedTestSlot.value = slot
        _servoTestStatus.value = ServoTestStatus.Idle
    }

    /**
     * Executes a deliberate bench-test cycle for a single servo/slot.
     * Note: This is an inert bench-test action, NEVER a dose or medication delivery.
     */
    fun executeServoBenchTest() {
        val slot = _selectedTestSlot.value
        val reqId = generateRequestId()
        _servoTestStatus.value = ServoTestStatus.Testing(slot, reqId)

        viewModelScope.launch {
            val request = TestServoRequest(id = reqId, slot = slot.canonicalId)
            val result = bluetoothManager.sendRequestWithAck(
                jsonLine = request.toJsonLine(),
                requestId = reqId,
                timeoutMs = 8000L
            )

            val now = timeFormat.format(Date())
            result.fold(
                onSuccess = { response ->
                    if (response.ok) {
                        _servoTestStatus.value = ServoTestStatus.Succeeded(slot, reqId, now)
                    } else {
                        _servoTestStatus.value = ServoTestStatus.Failed(slot, reqId, response.error ?: "Device rejected test")
                    }
                },
                onFailure = { error ->
                    if (error is java.util.concurrent.TimeoutException) {
                        _servoTestStatus.value = ServoTestStatus.Timeout(slot, reqId)
                    } else {
                        _servoTestStatus.value = ServoTestStatus.Failed(slot, reqId, error.localizedMessage ?: "Failed")
                    }
                }
            )
        }
    }

    fun clearLogs() {
        _trafficLogs.value = emptyList()
    }
}

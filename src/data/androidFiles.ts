export interface ProjectFile {
  path: string;
  name: string;
  category: 'gradle' | 'manifest' | 'kotlin' | 'resource' | 'doc' | 'firmware';
  content: string;
  description: string;
}

export const ANDROID_PROJECT_FILES: ProjectFile[] = [
  {
    path: 'android/settings.gradle.kts',
    name: 'settings.gradle.kts',
    category: 'gradle',
    description: 'Root Gradle settings defining project repositories and modules',
    content: `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "DispenserBenchTest"
include(":app")`
  },
  {
    path: 'android/build.gradle.kts',
    name: 'build.gradle.kts (root)',
    category: 'gradle',
    description: 'Top-level Gradle build script configuring Android and Kotlin plugins',
    content: `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    id("com.android.application") version "8.5.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.24" apply false
    id("org.jetbrains.kotlin.plugin.serialization") version "1.9.24" apply false
}`
  },
  {
    path: 'android/BUILD_APK.md',
    name: 'BUILD_APK.md',
    category: 'doc',
    description: '1-Click instructions to generate and install the .apk on an Android phone',
    content: `# How to Get the Straight .APK File

## Option 1: Automatic Cloud Build (No software needed on your PC)
This project includes a ready-to-run GitHub Actions workflow:
1. Push this folder to a GitHub repository.
2. GitHub automatically runs the build and compiles \`app-debug.apk\`.
3. In GitHub, open the **Actions** tab, click the latest build run, and download the straight APK artifact directly to your phone!

## Option 2: 1-Click Build in Android Studio
1. Open the folder in Android Studio.
2. In the top menu, click **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
3. Your straight APK is generated at:
   \`app/build/outputs/apk/debug/app-debug.apk\`
4. Tap or transfer \`app-debug.apk\` to your phone to install!

## Option 3: Terminal Command
Run:
- Mac/Linux: \`./gradlew assembleDebug\`
- Windows: \`gradlew.bat assembleDebug\`

Output file:
\`app/build/outputs/apk/debug/app-debug.apk\`

Install straight to phone via ADB:
\`adb install app/build/outputs/apk/debug/app-debug.apk\``
  },
  {
    path: 'android/.github/workflows/build-apk.yml',
    name: 'build-apk.yml',
    category: 'doc',
    description: 'GitHub Actions workflow that builds the straight APK in the cloud',
    content: `name: Build Android APK
on: [push, pull_request, workflow_dispatch]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: gradle
      - run: chmod +x gradlew
      - run: ./gradlew assembleDebug
      - uses: actions/upload-artifact@v4
        with:
          name: app-debug-apk
          path: app/build/outputs/apk/debug/app-debug.apk`
  },
  {
    path: 'android/gradle/wrapper/gradle-wrapper.properties',
    name: 'gradle-wrapper.properties',
    category: 'gradle',
    description: 'Gradle wrapper properties for automatic build tooling download',
    content: `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.7-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists`
  },
  {
    path: 'android/gradle.properties',
    name: 'gradle.properties',
    category: 'gradle',
    description: 'Gradle JVM and AndroidX configuration',
    content: `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official`
  },
  {
    path: 'android/app/build.gradle.kts',
    name: 'app/build.gradle.kts',
    category: 'gradle',
    description: 'App module build script with Jetpack Compose, Material 3, and Kotlinx Serialization',
    content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.serialization")
}

android {
    namespace = "com.prototype.dispenserbench"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.prototype.dispenserbench"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0-prototype"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.14"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.4")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.4")
    implementation("androidx.activity:activity-compose:1.9.1")

    // Jetpack Compose & Material 3
    implementation(platform("androidx.compose:compose-bom:2024.06.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")

    // Coroutines for background Bluetooth operations
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")

    // Kotlinx Serialization JSON for JSON-Lines protocol
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.3")

    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}`
  },
  {
    path: 'android/app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    category: 'manifest',
    description: 'Manifest declaring BLUETOOTH_CONNECT for Android 12+ and legacy permissions',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Legacy Bluetooth permissions for Android 11 (API 30) and below -->
    <uses-permission
        android:name="android.permission.BLUETOOTH"
        android:maxSdkVersion="30" />
    <uses-permission
        android:name="android.permission.BLUETOOTH_ADMIN"
        android:maxSdkVersion="30" />

    <!-- Android 12+ (API 31+) Bluetooth Connect permission -->
    <!-- Note: BLUETOOTH_SCAN and ACCESS_FINE_LOCATION are intentionally omitted because the app
         connects strictly to already-paired devices via BluetoothAdapter.bondedDevices -->
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />

    <uses-feature
        android:name="android.hardware.bluetooth"
        android:required="true" />

    <application
        android:allowBackup="false"
        android:icon="@android:drawable/ic_dialog_info"
        android:label="@string/app_name"
        android:roundIcon="@android:drawable/ic_dialog_info"
        android:supportsRtl="true"
        android:theme="@style/Theme.DispenserBenchTest">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden"
            android:windowSoftInputMode="adjustResize"
            android:theme="@style/Theme.DispenserBenchTest">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>`
  },
  {
    path: 'android/app/src/main/java/com/prototype/dispenserbench/MainActivity.kt',
    name: 'MainActivity.kt',
    category: 'kotlin',
    description: 'Main activity with 3-tab navigation, runtime permission checks, and persistent safety banner',
    content: `package com.prototype.dispenserbench

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bluetooth
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.prototype.dispenserbench.bluetooth.BluetoothConnectionState
import com.prototype.dispenserbench.ui.components.SafetyBanner
import com.prototype.dispenserbench.ui.screens.BenchTestScreen
import com.prototype.dispenserbench.ui.screens.ConnectScreen
import com.prototype.dispenserbench.ui.screens.ScheduleScreen
import com.prototype.dispenserbench.ui.theme.AccentBlue
import com.prototype.dispenserbench.ui.theme.DispenserBenchTheme
import com.prototype.dispenserbench.ui.theme.ErrorRed
import com.prototype.dispenserbench.ui.theme.IndustrialNavyDark
import com.prototype.dispenserbench.ui.theme.SuccessGreen
import com.prototype.dispenserbench.viewmodel.BenchTestViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: BenchTestViewModel by viewModels()

    private var hasBluetoothConnectPermission by mutableStateOf(false)

    private val requestBluetoothPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        hasBluetoothConnectPermission = isGranted
        if (isGranted) {
            viewModel.refreshPairedDevices()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        checkPermissions()
        setContent {
            DispenserBenchTheme {
                MainScreen(
                    viewModel = viewModel,
                    hasConnectPermission = hasBluetoothConnectPermission,
                    onRequestPermission = { checkAndRequestPermissions() }
                )
            }
        }
    }

    override fun onResume() {
        super.onResume()
        checkPermissions()
        if (hasBluetoothConnectPermission) {
            viewModel.refreshPairedDevices()
        }
    }

    private fun checkPermissions() {
        hasBluetoothConnectPermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.BLUETOOTH_CONNECT
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            true
        }
    }

    private fun checkAndRequestPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            requestBluetoothPermissionLauncher.launch(Manifest.permission.BLUETOOTH_CONNECT)
        } else {
            hasBluetoothConnectPermission = true
            viewModel.refreshPairedDevices()
        }
    }
}`
  },
  {
    path: 'android/app/src/main/java/com/prototype/dispenserbench/bluetooth/BluetoothSerialManager.kt',
    name: 'BluetoothSerialManager.kt',
    category: 'kotlin',
    description: 'Bluetooth Classic SPP manager with bounded reader loop, timeout tracking, and socket teardown',
    content: `package com.prototype.dispenserbench.bluetooth

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import android.content.Context
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

class BluetoothSerialManager(private val context: Context) {

    companion object {
        val SPP_UUID: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
        private const val MAX_LINE_LENGTH = 2048
        private const val DEFAULT_TIMEOUT_MS = 6000L
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val _connectionState = MutableStateFlow<BluetoothConnectionState>(BluetoothConnectionState.Disconnected())
    val connectionState: StateFlow<BluetoothConnectionState> = _connectionState.asStateFlow()

    private val _incomingResponses = MutableSharedFlow<DeviceResponse>(extraBufferCapacity = 64)
    val incomingResponses: SharedFlow<DeviceResponse> = _incomingResponses.asSharedFlow()

    private val _rawTrafficLogs = MutableSharedFlow<Pair<Boolean, String>>(extraBufferCapacity = 128)
    val rawTrafficLogs: SharedFlow<Pair<Boolean, String>> = _rawTrafficLogs.asSharedFlow()

    @Volatile private var activeSocket: BluetoothSocket? = null
    @Volatile private var outputStream: OutputStream? = null

    private var readerJob: Job? = null
    private var connectJob: Job? = null
    private val pendingRequests = ConcurrentHashMap<String, CompletableDeferred<DeviceResponse>>()

    private val bluetoothAdapter: BluetoothAdapter? by lazy { BluetoothAdapter.getDefaultAdapter() }

    val isBluetoothSupported: Boolean get() = bluetoothAdapter != null
    val isBluetoothEnabled: Boolean get() = bluetoothAdapter?.isEnabled == true

    @SuppressLint("MissingPermission")
    fun getBondedDevices(): List<BluetoothDevice> {
        val adapter = bluetoothAdapter ?: return emptyList()
        return try { adapter.bondedDevices?.toList() ?: emptyList() } catch (_: SecurityException) { emptyList() }
    }

    @SuppressLint("MissingPermission")
    fun connect(device: BluetoothDevice) {
        if (_connectionState.value.isConnecting) return
        connectJob?.cancel()
        connectJob = scope.launch {
            cleanUpCurrentConnection("Reconnecting")
            val deviceName = try { device.name ?: "Unknown Device" } catch (_: SecurityException) { "Unknown Device" }
            val deviceAddress = device.address
            _connectionState.value = BluetoothConnectionState.Connecting(deviceName, deviceAddress)

            try {
                val socket = device.createRfcommSocketToServiceRecord(SPP_UUID)
                socket.connect()
                activeSocket = socket
                outputStream = socket.outputStream
                _connectionState.value = BluetoothConnectionState.Connected(deviceName, deviceAddress)
                startReaderLoop(socket)
            } catch (se: SecurityException) {
                _connectionState.value = BluetoothConnectionState.Error(
                    BluetoothErrorType.PERMISSION_DENIED,
                    "Bluetooth permission denied."
                )
                cleanUpCurrentConnection()
            } catch (e: IOException) {
                _connectionState.value = BluetoothConnectionState.Error(
                    BluetoothErrorType.CONNECTION_TIMEOUT,
                    "Failed to connect to $deviceName. Verify HC-05 is powered and paired."
                )
                cleanUpCurrentConnection()
            }
        }
    }

    private fun startReaderLoop(socket: BluetoothSocket) {
        readerJob?.cancel()
        readerJob = scope.launch {
            var reader: BufferedReader? = null
            try {
                reader = BufferedReader(InputStreamReader(socket.inputStream, Charsets.UTF_8))
                while (isActive && socket.isConnected) {
                    val line = reader.readLine() ?: break
                    if (line.length > MAX_LINE_LENGTH) continue
                    val trimmed = line.trim()
                    if (trimmed.isEmpty()) continue

                    _rawTrafficLogs.tryEmit(Pair(false, trimmed))
                    val parsed = DeviceResponse.parse(trimmed)
                    if (parsed != null) {
                        _incomingResponses.emit(parsed)
                        parsed.id?.let { reqId ->
                            pendingRequests.remove(reqId)?.complete(parsed)
                        }
                    }
                }
                if (isActive) {
                    _connectionState.value = BluetoothConnectionState.Error(
                        BluetoothErrorType.CONNECTION_LOST,
                        "Connection closed by remote device (ESP8266/HC-05)."
                    )
                }
            } catch (_: CancellationException) {
            } catch (ioe: IOException) {
                if (isActive) {
                    _connectionState.value = BluetoothConnectionState.Error(
                        BluetoothErrorType.CONNECTION_LOST,
                        "Lost connection to device: \${ioe.localizedMessage ?: "I/O error"}"
                    )
                }
            } finally {
                try { reader?.close() } catch (_: Exception) {}
                cleanUpCurrentConnection("Reader terminated")
            }
        }
    }

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
            currentOut.write(jsonLine.toByteArray(Charsets.UTF_8))
            currentOut.flush()
            _rawTrafficLogs.tryEmit(Pair(true, jsonLine.trim()))
            val resp = withTimeoutOrNull(timeoutMs) { deferred.await() }
            if (resp != null) Result.success(resp)
            else {
                pendingRequests.remove(requestId)
                Result.failure(java.util.concurrent.TimeoutException("Device did not respond to request '$requestId' within \${timeoutMs / 1000}s."))
            }
        } catch (e: Exception) {
            pendingRequests.remove(requestId)
            Result.failure(e)
        }
    }

    fun disconnect() {
        scope.launch {
            cleanUpCurrentConnection("User requested disconnect")
            _connectionState.value = BluetoothConnectionState.Disconnected("Disconnected")
        }
    }

    private fun cleanUpCurrentConnection(reason: String = "") {
        for ((_, d) in pendingRequests) {
            if (!d.isCompleted) d.completeExceptionally(IOException("Connection closed: $reason"))
        }
        pendingRequests.clear()
        readerJob?.cancel()
        readerJob = null
        try { outputStream?.close() } catch (_: Exception) {}
        outputStream = null
        try { activeSocket?.close() } catch (_: Exception) {}
        activeSocket = null
    }
}`
  },
  {
    path: 'android/app/src/main/java/com/prototype/dispenserbench/model/ProtocolModels.kt',
    name: 'ProtocolModels.kt',
    category: 'kotlin',
    description: 'Kotlinx Serialization models for UTF-8 JSON Lines phone-device protocol',
    content: `package com.prototype.dispenserbench.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.util.UUID

val AppJson = Json {
    ignoreUnknownKeys = true
    isLenient = true
    encodeDefaults = true
    explicitNulls = false
}

@Serializable
data class SlotTimeEntry(
    @SerialName("slot") val slot: String,
    @SerialName("time") val time: String
)

@Serializable
data class SetScheduleRequest(
    @SerialName("v") val v: Int = 1,
    @SerialName("id") val id: String,
    @SerialName("cmd") val cmd: String = "set_schedule",
    @SerialName("slots") val slots: List<SlotTimeEntry>
) {
    fun toJsonLine(): String = AppJson.encodeToString(this) + "\\n"
}

@Serializable
data class GetStateRequest(
    @SerialName("v") val v: Int = 1,
    @SerialName("id") val id: String,
    @SerialName("cmd") val cmd: String = "get_state"
) {
    fun toJsonLine(): String = AppJson.encodeToString(this) + "\\n"
}

@Serializable
data class TestServoRequest(
    @SerialName("v") val v: Int = 1,
    @SerialName("id") val id: String,
    @SerialName("cmd") val cmd: String = "test_servo",
    @SerialName("slot") val slot: String
) {
    fun toJsonLine(): String = AppJson.encodeToString(this) + "\\n"
}

@Serializable
data class DeviceResponse(
    @SerialName("v") val v: Int? = null,
    @SerialName("id") val id: String? = null,
    @SerialName("ok") val ok: Boolean = false,
    @SerialName("cmd") val cmd: String? = null,
    @SerialName("revision") val revision: Int? = null,
    @SerialName("error") val error: String? = null,
    @SerialName("slots") val slots: List<SlotTimeEntry>? = null
) {
    companion object {
        fun parse(line: String): DeviceResponse? {
            val trimmed = line.trim()
            if (trimmed.isEmpty() || !trimmed.startsWith("{") || !trimmed.endsWith("}")) return null
            return try { AppJson.decodeFromString<DeviceResponse>(trimmed) } catch (_: Exception) { null }
        }
    }
}

fun generateRequestId(): String = UUID.randomUUID().toString().replace("-", "").substring(0, 4)

fun isValid24HourTime(time: String): Boolean = Regex("^([01]\\\\d|2[0-3]):[0-5]\\\\d$").matches(time.trim())`
  },
  {
    path: 'android/app/src/main/java/com/prototype/dispenserbench/model/SlotId.kt',
    name: 'SlotId.kt',
    category: 'kotlin',
    description: 'Canonical 9 slot IDs across 3 test days with servo indices and periods',
    content: `package com.prototype.dispenserbench.model

enum class SlotId(
    val canonicalId: String,
    val day: Int,
    val period: String,
    val defaultTime: String,
    val servoIndex: Int
) {
    D1_MORNING("D1_MORNING", 1, "Morning", "08:00", 1),
    D1_EVENING("D1_EVENING", 1, "Evening", "18:00", 1),
    D1_NIGHT("D1_NIGHT", 1, "Night", "22:00", 1),

    D2_MORNING("D2_MORNING", 2, "Morning", "08:00", 2),
    D2_EVENING("D2_EVENING", 2, "Evening", "18:00", 2),
    D2_NIGHT("D2_NIGHT", 2, "Night", "22:00", 2),

    D3_MORNING("D3_MORNING", 3, "Morning", "08:00", 3),
    D3_EVENING("D3_EVENING", 3, "Evening", "18:00", 3),
    D3_NIGHT("D3_NIGHT", 3, "Night", "22:00", 3);

    val displayTitle: String get() = "Day $day • $period ($canonicalId)"

    companion object {
        fun fromCanonicalId(id: String): SlotId? = entries.firstOrNull { it.canonicalId.equals(id, ignoreCase = true) }
        fun forDay(dayNumber: Int): List<SlotId> = entries.filter { it.day == dayNumber }
    }
}`
  },
  {
    path: 'android/app/src/main/java/com/prototype/dispenserbench/viewmodel/BenchTestViewModel.kt',
    name: 'BenchTestViewModel.kt',
    category: 'kotlin',
    description: 'ViewModel handling Bluetooth connection, schedule validation, readback sync, and servo bench tests',
    content: `package com.prototype.dispenserbench.viewmodel

import android.annotation.SuppressLint
import android.app.Application
import android.bluetooth.BluetoothDevice
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.prototype.dispenserbench.bluetooth.*
import com.prototype.dispenserbench.model.*
import com.prototype.dispenserbench.storage.ScheduleStorage
import kotlinx.coroutines.flow.*
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

data class TrafficLogItem(val timestamp: String, val isSent: Boolean, val text: String)

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

    val connectionState: StateFlow<BluetoothConnectionState> = bluetoothManager.connectionState
    private val _pairedDevices = MutableStateFlow<List<BluetoothDevice>>(emptyList())
    val pairedDevices: StateFlow<List<BluetoothDevice>> = _pairedDevices.asStateFlow()

    private val _selectedDevice = MutableStateFlow<BluetoothDevice?>(null)
    val selectedDevice: StateFlow<BluetoothDevice?> = _selectedDevice.asStateFlow()

    private val _scheduleSlots = MutableStateFlow<Map<SlotId, String>>(storage.loadSchedule())
    val scheduleSlots: StateFlow<Map<SlotId, String>> = _scheduleSlots.asStateFlow()

    private val _scheduleSendStatus = MutableStateFlow<ScheduleSendStatus>(ScheduleSendStatus.Idle)
    val scheduleSendStatus: StateFlow<ScheduleSendStatus> = _scheduleSendStatus.asStateFlow()

    private val _lastDeviceAcknowledgement = MutableStateFlow<Pair<DeviceResponse, String>?>(null)
    val lastDeviceAcknowledgement: StateFlow<Pair<DeviceResponse, String>?> = _lastDeviceAcknowledgement.asStateFlow()

    private val _localSaveNotice = MutableStateFlow<String?>(null)
    val localSaveNotice: StateFlow<String?> = _localSaveNotice.asStateFlow()

    private val _selectedTestSlot = MutableStateFlow<SlotId>(SlotId.D1_MORNING)
    val selectedTestSlot: StateFlow<SlotId> = _selectedTestSlot.asStateFlow()

    private val _servoTestStatus = MutableStateFlow<ServoTestStatus>(ServoTestStatus.Idle)
    val servoTestStatus: StateFlow<ServoTestStatus> = _servoTestStatus.asStateFlow()

    private val _syncComparison = MutableStateFlow<DeviceSyncComparison?>(null)
    val syncComparison: StateFlow<DeviceSyncComparison?> = _syncComparison.asStateFlow()

    private val _trafficLogs = MutableStateFlow<List<TrafficLogItem>>(emptyList())
    val trafficLogs: StateFlow<List<TrafficLogItem>> = _trafficLogs.asStateFlow()

    init {
        viewModelScope.launch {
            bluetoothManager.rawTrafficLogs.collect { (isSent, text) ->
                val now = timeFormat.format(Date())
                _trafficLogs.value = (_trafficLogs.value + TrafficLogItem(now, isSent, text)).takeLast(150)
            }
        }
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
        if (!bluetoothManager.isBluetoothSupported) return
        val bonded = bluetoothManager.getBondedDevices()
        _pairedDevices.value = bonded
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
        _selectedDevice.value?.let { bluetoothManager.connect(it) }
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
        _localSaveNotice.value = "Saved on phone at \${timeFormat.format(Date())}. (Not yet sent to hardware)."
    }

    fun sendScheduleToDevice() {
        val currentSlots = _scheduleSlots.value
        for (slot in SlotId.entries) {
            val time = currentSlots[slot] ?: ""
            if (!isValid24HourTime(time)) {
                _scheduleSendStatus.value = ScheduleSendStatus.ValidationError("Invalid time for \${slot.displayTitle}: '$time'. Must be HH:mm (24-hour).")
                return
            }
        }
        val entries = SlotId.entries.map { SlotTimeEntry(it.canonicalId, currentSlots[it]!!) }
        val reqId = generateRequestId()
        val request = SetScheduleRequest(id = reqId, slots = entries)
        _scheduleSendStatus.value = ScheduleSendStatus.WaitingForConfirmation(reqId)

        viewModelScope.launch {
            bluetoothManager.sendRequestWithAck(request.toJsonLine(), reqId, 7000L).fold(
                onSuccess = { resp ->
                    val now = timeFormat.format(Date())
                    if (resp.ok) {
                        val rev = resp.revision ?: (storage.getLastKnownRevision() + 1)
                        storage.saveLastKnownRevision(rev)
                        storage.saveSchedule(currentSlots)
                        _scheduleSendStatus.value = ScheduleSendStatus.Accepted(reqId, rev, now)
                    } else {
                        _scheduleSendStatus.value = ScheduleSendStatus.Rejected(reqId, resp.error ?: "ESP8266 rejected schedule")
                    }
                },
                onFailure = { err ->
                    if (err is java.util.concurrent.TimeoutException) _scheduleSendStatus.value = ScheduleSendStatus.Timeout(reqId)
                    else _scheduleSendStatus.value = ScheduleSendStatus.Rejected(reqId, err.localizedMessage ?: "Transmission failed")
                }
            )
        }
    }

    fun readBackDeviceState() {
        val reqId = generateRequestId()
        viewModelScope.launch {
            val result = bluetoothManager.sendRequestWithAck(GetStateRequest(id = reqId).toJsonLine(), reqId, 6000L)
            val now = timeFormat.format(Date())
            result.fold(
                onSuccess = { resp ->
                    val deviceSlots = resp.slots ?: emptyList()
                    val mismatches = mutableListOf<String>()
                    val local = _scheduleSlots.value
                    for (slot in SlotId.entries) {
                        val localTime = local[slot] ?: ""
                        val remoteTime = deviceSlots.firstOrNull { it.slot.equals(slot.canonicalId, ignoreCase = true) }?.time
                        if (remoteTime == null) mismatches.add("\${slot.canonicalId}: missing on device")
                        else if (remoteTime != localTime) mismatches.add("\${slot.canonicalId}: Phone has '$localTime' but device has '$remoteTime'")
                    }
                    _syncComparison.value = DeviceSyncComparison(now, resp.revision, mismatches.isEmpty() && deviceSlots.size == 9, mismatches)
                },
                onFailure = { err ->
                    _syncComparison.value = DeviceSyncComparison(now, null, false, listOf("Read-back failed: \${err.localizedMessage ?: "Timeout"}"))
                }
            )
        }
    }

    fun selectTestSlot(slot: SlotId) {
        _selectedTestSlot.value = slot
        _servoTestStatus.value = ServoTestStatus.Idle
    }

    fun executeServoBenchTest() {
        val slot = _selectedTestSlot.value
        val reqId = generateRequestId()
        _servoTestStatus.value = ServoTestStatus.Testing(slot, reqId)

        viewModelScope.launch {
            val result = bluetoothManager.sendRequestWithAck(TestServoRequest(id = reqId, slot = slot.canonicalId).toJsonLine(), reqId, 8000L)
            val now = timeFormat.format(Date())
            result.fold(
                onSuccess = { resp ->
                    if (resp.ok) _servoTestStatus.value = ServoTestStatus.Succeeded(slot, reqId, now)
                    else _servoTestStatus.value = ServoTestStatus.Failed(slot, reqId, resp.error ?: "Device rejected test")
                },
                onFailure = { err ->
                    if (err is java.util.concurrent.TimeoutException) _servoTestStatus.value = ServoTestStatus.Timeout(slot, reqId)
                    else _servoTestStatus.value = ServoTestStatus.Failed(slot, reqId, err.localizedMessage ?: "Failed")
                }
            )
        }
    }

    fun clearLogs() {
        _trafficLogs.value = emptyList()
    }
}`
  },
  {
    path: 'android/esp8266_sample_firmware.ino',
    name: 'esp8266_sample_firmware.ino',
    category: 'firmware',
    description: 'Complete Arduino C++ reference firmware for ESP8266 + HC-05 + SSD1306 OLED + 3 Servos',
    content: `/**
 * ESP8266 Three-Day Dispenser Bench-Test Firmware
 * HC-05 Bluetooth Classic Serial (9600 baud) + SSD1306 OLED + 3 Servos
 * Protocol: UTF-8 JSON Lines (\\n delimited)
 */
#include <Arduino.h>
#include <SoftwareSerial.h>
#include <Wire.h>
#include <Servo.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
SoftwareSerial btSerial(13, 15); // RX on D7, TX on D8

Servo servoDay1;
Servo servoDay2;
Servo servoDay3;

struct SlotTime { const char* slot; char time[6]; };
SlotTime currentSchedule[9] = {
  {"D1_MORNING", "08:00"}, {"D1_EVENING", "18:00"}, {"D1_NIGHT", "22:00"},
  {"D2_MORNING", "08:00"}, {"D2_EVENING", "18:00"}, {"D2_NIGHT", "22:00"},
  {"D3_MORNING", "08:00"}, {"D3_EVENING", "18:00"}, {"D3_NIGHT", "22:00"}
};

int scheduleRevision = 1;
String lastStatus = "Ready";
String inBuf = "";

void updateDisplay();
void handleCommand(String line);

void setup() {
  Serial.begin(115200);
  btSerial.begin(9600);
  Wire.begin(4, 5);
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  servoDay1.attach(14); // D5
  servoDay2.attach(12); // D6
  servoDay3.attach(4);  // D2
  servoDay1.write(0); servoDay2.write(0); servoDay3.write(0);
  updateDisplay();
}

void loop() {
  while (btSerial.available()) {
    char c = (char)btSerial.read();
    if (c == '\\n' || c == '\\r') {
      if (inBuf.length() > 0) {
        inBuf.trim();
        if (inBuf.length() > 0) handleCommand(inBuf);
        inBuf = "";
      }
    } else if (inBuf.length() < 1024) inBuf += c;
  }
}

void handleCommand(String json) {
  int idPos = json.indexOf("\\"id\\":\\"");
  String reqId = "unknown";
  if (idPos != -1) {
    int s = idPos + 6;
    int e = json.indexOf("\\"", s);
    if (e != -1) reqId = json.substring(s, e);
  }

  if (json.indexOf("\\"set_schedule\\"") != -1) {
    scheduleRevision++;
    for (int i = 0; i < 9; i++) {
      int p = json.indexOf(String("\\"slot\\":\\"") + currentSchedule[i].slot + "\\"");
      if (p != -1) {
        int tp = json.indexOf("\\"time\\":\\"", p);
        if (tp != -1) {
          String t = json.substring(tp + 8, tp + 13);
          strncpy(currentSchedule[i].time, t.c_str(), 5);
        }
      }
    }
    btSerial.print("{\\"v\\":1,\\"id\\":\\"" + reqId + "\\",\\"ok\\":true,\\"cmd\\":\\"set_schedule\\",\\"revision\\":" + scheduleRevision + "}\\n");
    lastStatus = "Sched rev " + String(scheduleRevision);
    updateDisplay();
  } else if (json.indexOf("\\"get_state\\"") != -1) {
    String resp = "{\\"v\\":1,\\"id\\":\\"" + reqId + "\\",\\"ok\\":true,\\"cmd\\":\\"get_state\\",\\"revision\\":" + scheduleRevision + ",\\"slots\\":[";
    for (int i = 0; i < 9; i++) {
      resp += "{\\"slot\\":\\"" + String(currentSchedule[i].slot) + "\\",\\"time\\":\\"" + String(currentSchedule[i].time) + "\\"}";
      if (i < 8) resp += ",";
    }
    resp += "]}\\n";
    btSerial.print(resp);
  } else if (json.indexOf("\\"test_servo\\"") != -1) {
    int sp = json.indexOf("\\"slot\\":\\"");
    String slot = (sp != -1) ? json.substring(sp + 8, json.indexOf("\\"", sp + 8)) : "";
    if (slot.startsWith("D1_")) { servoDay1.write(90); delay(500); servoDay1.write(0); }
    else if (slot.startsWith("D2_")) { servoDay2.write(90); delay(500); servoDay2.write(0); }
    else if (slot.startsWith("D3_")) { servoDay3.write(90); delay(500); servoDay3.write(0); }
    btSerial.print("{\\"v\\":1,\\"id\\":\\"" + reqId + "\\",\\"ok\\":true,\\"cmd\\":\\"test_servo\\"}\\n");
    lastStatus = "Tested " + slot;
    updateDisplay();
  }
}

void updateDisplay() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println(F("BENCH DISPENSER"));
  display.print(F("Rev: ")); display.println(scheduleRevision);
  display.print(F("Status: ")); display.println(lastStatus);
  display.print(F("D1: ")); display.print(currentSchedule[0].time); display.print(" "); display.println(currentSchedule[1].time);
  display.print(F("D2: ")); display.print(currentSchedule[3].time); display.print(" "); display.println(currentSchedule[4].time);
  display.print(F("D3: ")); display.print(currentSchedule[6].time); display.print(" "); display.println(currentSchedule[7].time);
  display.display();
}`
  }
];

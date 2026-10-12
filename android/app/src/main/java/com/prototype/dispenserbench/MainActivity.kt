package com.prototype.dispenserbench

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
            true // Prior to Android 12, permissions are normal install-time
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
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    viewModel: BenchTestViewModel,
    hasConnectPermission: Boolean,
    onRequestPermission: () -> Unit
) {
    var selectedTab by remember { mutableIntStateOf(0) }
    val connectionState by viewModel.connectionState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Dispenser Bench Test",
                                fontWeight = FontWeight.Bold,
                                fontSize = 18.sp,
                                color = Color.White
                            )
                            Text(
                                text = "ESP8266 HC-05 Hardware Controller",
                                fontSize = 11.sp,
                                color = Color(0xFF94A3B8)
                            )
                        }

                        // Connection status indicator pill
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .clip(CircleShape)
                                .background(Color(0xFF1E293B))
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(
                                        when (connectionState) {
                                            is BluetoothConnectionState.Connected -> SuccessGreen
                                            is BluetoothConnectionState.Connecting -> AccentBlue
                                            is BluetoothConnectionState.Error -> ErrorRed
                                            is BluetoothConnectionState.Disconnected -> Color.Gray
                                        }
                                    )
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = when (connectionState) {
                                    is BluetoothConnectionState.Connected -> "HC-05 ONLINE"
                                    is BluetoothConnectionState.Connecting -> "CONNECTING"
                                    is BluetoothConnectionState.Error -> "ERR"
                                    is BluetoothConnectionState.Disconnected -> "OFFLINE"
                                },
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = IndustrialNavyDark,
                    titleContentColor = Color.White
                )
            )
        },
        bottomBar = {
            NavigationBar(containerColor = Color.White) {
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { Icon(Icons.Default.Bluetooth, contentDescription = "Connect") },
                    label = { Text("Connect", fontSize = 12.sp) }
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    icon = { Icon(Icons.Default.CalendarMonth, contentDescription = "Schedule") },
                    label = { Text("Schedule", fontSize = 12.sp) }
                )
                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    icon = { Icon(Icons.Default.Build, contentDescription = "Bench Test") },
                    label = { Text("Bench Test", fontSize = 12.sp) }
                )
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // Persistent safety banner across all tabs
            SafetyBanner(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp))

            when (selectedTab) {
                0 -> ConnectScreen(
                    viewModel = viewModel,
                    hasConnectPermission = hasConnectPermission,
                    onRequestPermission = onRequestPermission
                )
                1 -> ScheduleScreen(viewModel = viewModel)
                2 -> BenchTestScreen(viewModel = viewModel)
            }
        }
    }
}

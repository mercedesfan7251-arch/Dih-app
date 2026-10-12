package com.prototype.dispenserbench.ui.screens

import android.annotation.SuppressLint
import android.bluetooth.BluetoothDevice
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bluetooth
import androidx.compose.material.icons.filled.BluetoothConnected
import androidx.compose.material.icons.filled.BluetoothDisabled
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.prototype.dispenserbench.bluetooth.BluetoothConnectionState
import com.prototype.dispenserbench.bluetooth.BluetoothErrorType
import com.prototype.dispenserbench.ui.theme.AccentBlue
import com.prototype.dispenserbench.ui.theme.ErrorRed
import com.prototype.dispenserbench.ui.theme.ErrorRedContainer
import com.prototype.dispenserbench.ui.theme.ErrorRedText
import com.prototype.dispenserbench.ui.theme.IndustrialNavyDark
import com.prototype.dispenserbench.ui.theme.SlateBorder
import com.prototype.dispenserbench.ui.theme.SuccessGreen
import com.prototype.dispenserbench.ui.theme.SuccessGreenContainer
import com.prototype.dispenserbench.ui.theme.SuccessGreenText
import com.prototype.dispenserbench.viewmodel.BenchTestViewModel

@SuppressLint("MissingPermission")
@Composable
fun ConnectScreen(
    viewModel: BenchTestViewModel,
    hasConnectPermission: Boolean,
    onRequestPermission: () -> Unit
) {
    val connectionState by viewModel.connectionState.collectAsState()
    val pairedDevices by viewModel.pairedDevices.collectAsState()
    val selectedDevice by viewModel.selectedDevice.collectAsState()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Check if device lacks Bluetooth hardware
        if (!viewModel.isBluetoothSupported) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = ErrorRedContainer),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.BluetoothDisabled, contentDescription = null, tint = ErrorRed)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Device Lacks Bluetooth Hardware",
                                color = ErrorRedText,
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "This device does not have Bluetooth hardware. Bluetooth is required to communicate with the HC-05 dispenser module.",
                            color = ErrorRedText,
                            fontSize = 13.sp
                        )
                    }
                }
            }
        } else if (!viewModel.isBluetoothEnabled) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF3C7)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.BluetoothDisabled, contentDescription = null, tint = Color(0xFFD97706))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Bluetooth is Turned Off",
                                color = Color(0xFF92400E),
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Please turn on Bluetooth in your device settings to communicate with the HC-05 module.",
                            color = Color(0xFF92400E),
                            fontSize = 13.sp
                        )
                    }
                }
            }
        }

        // Permission Status Banner (if missing)
        if (!hasConnectPermission && viewModel.isBluetoothSupported) {
            item {
                PermissionRequiredCard(onRequestPermission)
            }
        }

        // Connection State Overview Card
        item {
            ConnectionStateOverviewCard(
                state = connectionState,
                onDisconnect = { viewModel.disconnect() }
            )
        }

        // Paired Bluetooth Devices Section
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(12.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "Paired Bluetooth Devices",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                            Text(
                                text = "Select your HC-05 serial adapter",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        IconButton(onClick = { viewModel.refreshPairedDevices() }) {
                            Icon(Icons.Default.Refresh, contentDescription = "Refresh paired list")
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    if (pairedDevices.isEmpty()) {
                        NoPairedDevicesPlaceholder()
                    } else {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            pairedDevices.forEach { device ->
                                val isSelected = device.address == selectedDevice?.address
                                val deviceName = try { device.name ?: "Unknown" } catch (_: SecurityException) { "Unknown" }
                                val isHC05 = deviceName.contains("HC-05", ignoreCase = true) || deviceName.contains("BT", ignoreCase = true)

                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(8.dp))
                                        .border(
                                            width = if (isSelected) 2.dp else 1.dp,
                                            color = if (isSelected) AccentBlue else SlateBorder.copy(alpha = 0.4f),
                                            shape = RoundedCornerShape(8.dp)
                                        )
                                        .background(if (isSelected) AccentBlue.copy(alpha = 0.06f) else Color.Transparent)
                                        .clickable { viewModel.selectDevice(device) }
                                        .padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    RadioButton(
                                        selected = isSelected,
                                        onClick = { viewModel.selectDevice(device) }
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text(
                                                text = deviceName,
                                                fontWeight = FontWeight.SemiBold,
                                                fontSize = 15.sp
                                            )
                                            if (isHC05) {
                                                Spacer(modifier = Modifier.width(6.dp))
                                                Box(
                                                    modifier = Modifier
                                                        .background(SuccessGreenContainer, RoundedCornerShape(4.dp))
                                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                                ) {
                                                    Text(
                                                        text = "HC-05 DETECTED",
                                                        color = SuccessGreenText,
                                                        fontSize = 10.sp,
                                                        fontWeight = FontWeight.Bold
                                                    )
                                                }
                                            }
                                        }
                                        Text(
                                            text = device.address,
                                            fontFamily = FontFamily.Monospace,
                                            fontSize = 12.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Connect / Disconnect Buttons
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Button(
                            onClick = { viewModel.connect() },
                            enabled = selectedDevice != null && !connectionState.isConnected && !connectionState.isConnecting,
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            if (connectionState.isConnecting) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(16.dp),
                                    color = Color.White,
                                    strokeWidth = 2.dp
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Connecting...")
                            } else {
                                Icon(Icons.Default.Bluetooth, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Connect to HC-05")
                            }
                        }

                        if (connectionState.isConnected || connectionState.isConnecting) {
                            OutlinedButton(
                                onClick = { viewModel.disconnect() },
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = ErrorRed),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("Disconnect")
                            }
                        }
                    }
                }
            }
        }

        // Hardware Pairing Instructions
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFF1F5F9)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Info, contentDescription = null, tint = IndustrialNavyDark, modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "HC-05 Bluetooth Pairing Guide",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "1. Power your ESP8266 & HC-05 module (ensure red LED blinks rapidly).\n" +
                                "2. Open Android Phone Settings -> Bluetooth.\n" +
                                "3. Tap 'Pair new device' and locate 'HC-05'.\n" +
                                "4. Enter PIN '1234' or '0000'.\n" +
                                "5. Return to this app and tap the refresh button above.\n" +
                                "6. Note: HC-05 UART baud rate (e.g. 9600) must match ESP8266 serial code.",
                        fontSize = 12.sp,
                        color = Color(0xFF475569),
                        lineHeight = 18.sp
                    )
                }
            }
        }
    }
}

@Composable
private fun ConnectionStateOverviewCard(
    state: BluetoothConnectionState,
    onDisconnect: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = when (state) {
                is BluetoothConnectionState.Connected -> SuccessGreenContainer
                is BluetoothConnectionState.Error -> ErrorRedContainer
                else -> Color.White
            }
        ),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(12.dp)
                            .clip(CircleShape)
                            .background(
                                when (state) {
                                    is BluetoothConnectionState.Connected -> SuccessGreen
                                    is BluetoothConnectionState.Connecting -> AccentBlue
                                    is BluetoothConnectionState.Error -> ErrorRed
                                    is BluetoothConnectionState.Disconnected -> Color.Gray
                                }
                            )
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = when (state) {
                            is BluetoothConnectionState.Connected -> "CONNECTED"
                            is BluetoothConnectionState.Connecting -> "CONNECTING..."
                            is BluetoothConnectionState.Error -> "CONNECTION ERROR"
                            is BluetoothConnectionState.Disconnected -> "DISCONNECTED"
                        },
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = when (state) {
                            is BluetoothConnectionState.Connected -> SuccessGreenText
                            is BluetoothConnectionState.Error -> ErrorRedText
                            else -> IndustrialNavyDark
                        }
                    )
                }

                if (state is BluetoothConnectionState.Connected) {
                    Icon(
                        imageVector = Icons.Default.BluetoothConnected,
                        contentDescription = "Connected",
                        tint = SuccessGreen
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            when (state) {
                is BluetoothConnectionState.Connected -> {
                    Text(
                        text = "Device: ${state.deviceName} (${state.deviceAddress})",
                        fontSize = 13.sp,
                        color = SuccessGreenText
                    )
                    Text(
                        text = "Protocol: SPP / RFCOMM (UUID 00001101-0000-1000-8000-00805F9B34FB)",
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace,
                        color = SuccessGreenText.copy(alpha = 0.8f)
                    )
                }
                is BluetoothConnectionState.Connecting -> {
                    Text(
                        text = "Establishing RFCOMM socket with ${state.deviceName}...",
                        fontSize = 13.sp,
                        color = IndustrialNavyDark
                    )
                }
                is BluetoothConnectionState.Error -> {
                    Text(
                        text = state.userFriendlyMessage,
                        fontSize = 13.sp,
                        color = ErrorRedText
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Check that HC-05 is powered, in range, and not connected to another phone.",
                        fontSize = 11.sp,
                        color = ErrorRedText.copy(alpha = 0.8f)
                    )
                }
                is BluetoothConnectionState.Disconnected -> {
                    Text(
                        text = state.message ?: "Select paired HC-05 below and tap Connect.",
                        fontSize = 13.sp,
                        color = Color.Gray
                    )
                }
            }
        }
    }
}

@Composable
private fun PermissionRequiredCard(onRequestPermission: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = ErrorRedContainer),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.BluetoothDisabled, contentDescription = null, tint = ErrorRed)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Bluetooth Permission Required",
                    color = ErrorRedText,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Android 12+ requires the 'Nearby devices / Bluetooth Connect' permission to communicate with your HC-05 module.",
                color = ErrorRedText,
                fontSize = 13.sp
            )
            Spacer(modifier = Modifier.height(12.dp))
            Button(
                onClick = onRequestPermission,
                colors = ButtonDefaults.buttonColors(containerColor = ErrorRed),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Grant Bluetooth Permission")
            }
        }
    }
}

@Composable
private fun NoPairedDevicesPlaceholder() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFFF8FAFC), RoundedCornerShape(8.dp))
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(Icons.Default.Bluetooth, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(32.dp))
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "No paired Bluetooth devices found",
            fontWeight = FontWeight.SemiBold,
            fontSize = 14.sp
        )
        Text(
            text = "Pair your HC-05 in Android Settings first, then tap refresh.",
            fontSize = 12.sp,
            color = Color.Gray
        )
    }
}

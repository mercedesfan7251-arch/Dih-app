package com.prototype.dispenserbench.ui.screens

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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.DeleteSweep
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Terminal
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.prototype.dispenserbench.model.SlotId
import com.prototype.dispenserbench.ui.theme.AccentBlue
import com.prototype.dispenserbench.ui.theme.ErrorRed
import com.prototype.dispenserbench.ui.theme.ErrorRedContainer
import com.prototype.dispenserbench.ui.theme.ErrorRedText
import com.prototype.dispenserbench.ui.theme.IndustrialNavyDark
import com.prototype.dispenserbench.ui.theme.SafetyAmber
import com.prototype.dispenserbench.ui.theme.SafetyAmberContainer
import com.prototype.dispenserbench.ui.theme.SafetyAmberText
import com.prototype.dispenserbench.ui.theme.SlateBorder
import com.prototype.dispenserbench.ui.theme.SuccessGreen
import com.prototype.dispenserbench.ui.theme.SuccessGreenContainer
import com.prototype.dispenserbench.ui.theme.SuccessGreenText
import com.prototype.dispenserbench.viewmodel.BenchTestViewModel
import com.prototype.dispenserbench.viewmodel.ServoTestStatus

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BenchTestScreen(viewModel: BenchTestViewModel) {
    val connectionState by viewModel.connectionState.collectAsState()
    val lastAck by viewModel.lastDeviceAcknowledgement.collectAsState()
    val selectedSlot by viewModel.selectedTestSlot.collectAsState()
    val testStatus by viewModel.servoTestStatus.collectAsState()
    val trafficLogs by viewModel.trafficLogs.collectAsState()

    var showConfirmationDialog by remember { mutableStateOf(false) }
    var slotDropdownExpanded by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Last Device Acknowledgement Summary Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(12.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Last Device Acknowledgement",
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp,
                        color = IndustrialNavyDark
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    if (lastAck == null) {
                        Text(
                            text = "No messages received from ESP8266 yet in this session.",
                            fontSize = 12.sp,
                            color = Color.Gray
                        )
                    } else {
                        val (resp, timestamp) = lastAck!!
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color(0xFFF8FAFC), RoundedCornerShape(8.dp))
                                .padding(10.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = if (resp.ok) "✓ ACK (ok: true)" else "✗ REJECT (ok: false)",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp,
                                    color = if (resp.ok) SuccessGreenText else ErrorRedText
                                )
                                Text(
                                    text = timestamp,
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 11.sp,
                                    color = Color.Gray
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "cmd: ${resp.cmd ?: "N/A"} • id: ${resp.id ?: "N/A"}" +
                                        if (resp.revision != null) " • revision: ${resp.revision}" else "" +
                                        if (resp.error != null) " • error: ${resp.error}" else "",
                                fontFamily = FontFamily.Monospace,
                                fontSize = 12.sp,
                                color = IndustrialNavyDark
                            )
                        }
                    }
                }
            }
        }

        // Servo Bench Test Action Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(12.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Build, contentDescription = null, tint = AccentBlue)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Servo Mechanical Bench Test",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Trigger a deliberate hardware rotation of one generic servo slot to test mechanical clearance with inert test load.",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // Direct Servo Selector
                    Text(
                        text = "Select Servo to Test:",
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 13.sp,
                        color = IndustrialNavyDark
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        for (servoNum in 1..3) {
                            val candidateSlot = if (servoNum == 1) SlotId.D1_MORNING else if (servoNum == 2) SlotId.D2_MORNING else SlotId.D3_MORNING
                            val isSelected = selectedSlot.servoIndex == servoNum

                            Card(
                                modifier = Modifier
                                    .weight(1f)
                                    .clickable { viewModel.selectTestSlot(candidateSlot) },
                                colors = CardDefaults.cardColors(
                                    containerColor = if (isSelected) AccentBlue.copy(alpha = 0.1f) else Color(0xFFF8FAFC)
                                ),
                                border = androidx.compose.foundation.BorderStroke(
                                    width = if (isSelected) 2.dp else 1.dp,
                                    color = if (isSelected) AccentBlue else SlateBorder.copy(alpha = 0.2f)
                                ),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Column(
                                    modifier = Modifier.padding(10.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Text(
                                        text = "Servo $servoNum",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp,
                                        color = if (isSelected) AccentBlue else IndustrialNavyDark
                                    )
                                    Text(
                                        text = "Day $servoNum",
                                        fontSize = 11.sp,
                                        color = Color.Gray
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Deliberate Test Action Button
                    Button(
                        onClick = { showConfirmationDialog = true },
                        enabled = connectionState.isConnected && testStatus !is ServoTestStatus.Testing,
                        colors = ButtonDefaults.buttonColors(containerColor = AccentBlue),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        if (testStatus is ServoTestStatus.Testing) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(16.dp),
                                color = Color.White,
                                strokeWidth = 2.dp
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Testing Servo (Waiting ACK)...")
                        } else {
                            Icon(Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Test Selected Servo ${selectedSlot.servoIndex} (${selectedSlot.canonicalId})")
                        }
                    }

                    if (!connectionState.isConnected) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Connect to HC-05 on the Connect tab first.",
                            fontSize = 12.sp,
                            color = Color.Gray
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Servo Test Status Banner
                    ServoTestFeedbackBox(status = testStatus)
                }
            }
        }
    }

    // Safety Confirmation Dialog for Servo Test
    if (showConfirmationDialog) {
        ServoSafetyConfirmationDialog(
            slot = selectedSlot,
            onDismiss = { showConfirmationDialog = false },
            onConfirm = {
                showConfirmationDialog = false
                viewModel.executeServoBenchTest()
            }
        )
    }
}

@Composable
private fun ServoTestFeedbackBox(status: ServoTestStatus) {
    when (status) {
        is ServoTestStatus.Idle -> {}
        is ServoTestStatus.Testing -> {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFFEFF6FF), RoundedCornerShape(6.dp))
                    .padding(10.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    CircularProgressIndicator(modifier = Modifier.size(16.dp), color = AccentBlue, strokeWidth = 2.dp)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Actuation request sent (${status.requestId}). Awaiting ESP8266 test_servo acknowledgement...",
                        color = Color(0xFF1E40AF),
                        fontSize = 12.sp
                    )
                }
            }
        }
        is ServoTestStatus.Succeeded -> {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(SuccessGreenContainer, RoundedCornerShape(6.dp))
                    .padding(10.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = SuccessGreen, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "✓ Hardware acknowledged servo bench test for ${status.slotId.canonicalId} (ACK ID: ${status.requestId} at ${status.timestamp})",
                        color = SuccessGreenText,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }
        is ServoTestStatus.Failed -> {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(ErrorRedContainer, RoundedCornerShape(6.dp))
                    .padding(10.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Error, contentDescription = null, tint = ErrorRed, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Servo test rejected: ${status.reason} (Req ID: ${status.requestId})",
                        color = ErrorRedText,
                        fontSize = 12.sp
                    )
                }
            }
        }
        is ServoTestStatus.Timeout -> {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(SafetyAmberContainer, RoundedCornerShape(6.dp))
                    .padding(10.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Warning, contentDescription = null, tint = SafetyAmber, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Servo test response timed out for ${status.slotId.canonicalId} (ID: ${status.requestId}). Check serial link.",
                        color = SafetyAmberText,
                        fontSize = 12.sp
                    )
                }
            }
        }
    }
}

@Composable
private fun ServoSafetyConfirmationDialog(
    slot: SlotId,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    var acknowledgedSafety by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Warning, contentDescription = null, tint = SafetyAmber)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Confirm Servo Bench Test",
                    fontWeight = FontWeight.Bold,
                    fontSize = 17.sp
                )
            }
        },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "You are about to actuate Servo ${slot.servoIndex} (${slot.displayTitle}).",
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 14.sp
                )
                Spacer(modifier = Modifier.height(10.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(SafetyAmberContainer, RoundedCornerShape(8.dp))
                        .padding(10.dp)
                ) {
                    Text(
                        text = "SAFETY RULES FOR BENCH TESTING:\n" +
                                "1. Use ONLY inert test items (e.g. plastic beads, dry beans).\n" +
                                "2. NEVER load real medications or ingestible chemicals.\n" +
                                "3. Keep fingers and wires clear of servo horns and gears.\n" +
                                "4. This is a prototype test, NOT a delivery of any dose.",
                        color = SafetyAmberText,
                        fontSize = 12.sp,
                        lineHeight = 17.sp
                    )
                }
                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { acknowledgedSafety = !acknowledgedSafety },
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Checkbox(
                        checked = acknowledgedSafety,
                        onCheckedChange = { acknowledgedSafety = it }
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "I confirm hands are clear and load is strictly inert",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                enabled = acknowledgedSafety,
                colors = ButtonDefaults.buttonColors(containerColor = AccentBlue)
            ) {
                Text("Confirm & Test Servo")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Save
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
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
import com.prototype.dispenserbench.ui.components.TimePickerDialog
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
import com.prototype.dispenserbench.viewmodel.ScheduleSendStatus

@Composable
fun ScheduleScreen(viewModel: BenchTestViewModel) {
    val scheduleSlots by viewModel.scheduleSlots.collectAsState()
    val scheduleSendStatus by viewModel.scheduleSendStatus.collectAsState()
    val connectionState by viewModel.connectionState.collectAsState()
    val localSaveNotice by viewModel.localSaveNotice.collectAsState()
    val syncComparison by viewModel.syncComparison.collectAsState()

    var editingSlot by remember { mutableStateOf<SlotId?>(null) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Status & Acknowledgement Feedback Card
        item {
            ScheduleStatusFeedbackCard(
                status = scheduleSendStatus,
                onRetry = { viewModel.sendScheduleToDevice() }
            )
        }

        // Local Save Confirmation (if any)
        if (localSaveNotice != null) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFF1F5F9)),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Save, contentDescription = null, tint = AccentBlue, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = localSaveNotice ?: "",
                            fontSize = 12.sp,
                            color = IndustrialNavyDark
                        )
                    }
                }
            }
        }

        // 3-Day Cycle Notice
        item {
            ThreeDayCycleNoticeCard()
        }

        // Day Cards (Day 1, Day 2, Day 3)
        for (day in 1..3) {
            item {
                DayScheduleCard(
                    dayNumber = day,
                    slots = SlotId.forDay(day),
                    currentTimes = scheduleSlots,
                    onEditSlot = { editingSlot = it }
                )
            }
        }

        // Schedule Actions (Save on Phone & Send to Device)
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(12.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Schedule Dispatch Actions",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        OutlinedButton(
                            onClick = { viewModel.saveScheduleLocally() },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(Icons.Default.Save, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Save on Phone")
                        }

                        Button(
                            onClick = { viewModel.sendScheduleToDevice() },
                            enabled = connectionState.isConnected && scheduleSendStatus !is ScheduleSendStatus.WaitingForConfirmation,
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            if (scheduleSendStatus is ScheduleSendStatus.WaitingForConfirmation) {
                                CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Sending...")
                            } else {
                                Icon(Icons.Default.Send, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Send to Device")
                            }
                        }
                    }

                    if (!connectionState.isConnected) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Note: Connect to HC-05 first to send schedule to ESP8266.",
                            fontSize = 12.sp,
                            color = Color.Gray
                        )
                    }
                }
            }
        }

        // Read-Back Verification Section
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
                                text = "Device Read-Back Verification",
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp
                            )
                            Text(
                                text = "Queries ESP8266 memory via get_state command",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        IconButton(
                            onClick = { viewModel.readBackDeviceState() },
                            enabled = connectionState.isConnected
                        ) {
                            Icon(Icons.Default.Sync, contentDescription = "Query device state")
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    if (syncComparison == null) {
                        Text(
                            text = "Tap sync icon to read back and verify what the hardware has stored.",
                            fontSize = 12.sp,
                            color = Color.Gray
                        )
                    } else {
                        val comp = syncComparison!!
                        if (comp.isSynced) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(SuccessGreenContainer, RoundedCornerShape(6.dp))
                                    .padding(10.dp)
                            ) {
                                Column {
                                    Text(
                                        text = "✓ Perfect Match with ESP8266 (Revision ${comp.deviceRevision ?: "?"})",
                                        color = SuccessGreenText,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp
                                    )
                                    Text(
                                        text = "Verified at ${comp.lastCheckedTimestamp}. All 9 slot times match phone.",
                                        color = SuccessGreenText,
                                        fontSize = 11.sp
                                    )
                                }
                            }
                        } else {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(SafetyAmberContainer, RoundedCornerShape(6.dp))
                                    .padding(10.dp)
                            ) {
                                Column {
                                    Text(
                                        text = "⚠ Schedule Discrepancy Detected",
                                        color = SafetyAmberText,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp
                                    )
                                    comp.mismatches.forEach { mismatch ->
                                        Text(text = "• $mismatch", color = SafetyAmberText, fontSize = 11.sp)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Time Edit Dialog
    editingSlot?.let { slot ->
        TimePickerDialog(
            title = slot.displayTitle,
            initialTime = scheduleSlots[slot] ?: slot.defaultTime,
            onDismiss = { editingSlot = null },
            onConfirm = { newTime ->
                viewModel.updateSlotTime(slot, newTime)
                editingSlot = null
            }
        )
    }
}

@Composable
private fun DayScheduleCard(
    dayNumber: Int,
    slots: List<SlotId>,
    currentTimes: Map<SlotId, String>,
    onEditSlot: (SlotId) -> Unit
) {
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
                Text(
                    text = "Day $dayNumber",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = IndustrialNavyDark
                )
                Box(
                    modifier = Modifier
                        .background(AccentBlue.copy(alpha = 0.1f), RoundedCornerShape(4.dp))
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = "Actuates Servo $dayNumber",
                        color = AccentBlue,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 11.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                slots.forEach { slot ->
                    val time = currentTimes[slot] ?: slot.defaultTime
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color(0xFFF8FAFC))
                            .border(1.dp, SlateBorder.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
                            .clickable { onEditSlot(slot) }
                            .padding(horizontal = 12.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(
                                text = slot.period,
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 14.sp
                            )
                            Text(
                                text = slot.canonicalId,
                                fontSize = 11.sp,
                                fontFamily = FontFamily.Monospace,
                                color = Color.Gray
                            )
                        }

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .background(IndustrialNavyDark, RoundedCornerShape(6.dp))
                                    .padding(horizontal = 10.dp, vertical = 4.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        Icons.Default.AccessTime,
                                        contentDescription = null,
                                        tint = Color.White,
                                        modifier = Modifier.size(13.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = time,
                                        color = Color.White,
                                        fontFamily = FontFamily.Monospace,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Icon(
                                Icons.Default.Edit,
                                contentDescription = "Edit time",
                                tint = AccentBlue,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ScheduleStatusFeedbackCard(
    status: ScheduleSendStatus,
    onRetry: () -> Unit
) {
    when (status) {
        is ScheduleSendStatus.Idle -> {
            // Keep clean, no noisy box
        }
        is ScheduleSendStatus.WaitingForConfirmation -> {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFEFF6FF)),
                shape = RoundedCornerShape(10.dp)
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        strokeWidth = 2.dp,
                        color = AccentBlue
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = "Waiting for device confirmation...",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = AccentBlue
                        )
                        Text(
                            text = "Request ID: ${status.requestId} • Awaiting ESP8266 ACK",
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace,
                            color = Color(0xFF1E40AF)
                        )
                    }
                }
            }
        }
        is ScheduleSendStatus.Accepted -> {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = SuccessGreenContainer),
                shape = RoundedCornerShape(10.dp)
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = SuccessGreen)
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = "✓ Schedule Accepted by Hardware!",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = SuccessGreenText
                        )
                        Text(
                            text = "ACK ID: ${status.requestId} • Revision: ${status.revision} at ${status.timestamp}",
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace,
                            color = SuccessGreenText
                        )
                    }
                }
            }
        }
        is ScheduleSendStatus.Rejected -> {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = ErrorRedContainer),
                shape = RoundedCornerShape(10.dp)
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Error, contentDescription = null, tint = ErrorRed)
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Schedule Rejected by Hardware",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = ErrorRedText
                        )
                        Text(
                            text = "Reason: ${status.errorReason} (Request ID: ${status.requestId})",
                            fontSize = 11.sp,
                            color = ErrorRedText
                        )
                    }
                    OutlinedButton(onClick = onRetry) {
                        Text("Retry", fontSize = 11.sp)
                    }
                }
            }
        }
        is ScheduleSendStatus.Timeout -> {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = SafetyAmberContainer),
                shape = RoundedCornerShape(10.dp)
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Warning, contentDescription = null, tint = SafetyAmber)
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Response Timed Out",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = SafetyAmberText
                        )
                        Text(
                            text = "No acknowledgement received for ID: ${status.requestId}. Check ESP8266 serial connection.",
                            fontSize = 11.sp,
                            color = SafetyAmberText
                        )
                    }
                    OutlinedButton(onClick = onRetry) {
                        Text("Retry", fontSize = 11.sp)
                    }
                }
            }
        }
        is ScheduleSendStatus.ValidationError -> {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = ErrorRedContainer),
                shape = RoundedCornerShape(10.dp)
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Error, contentDescription = null, tint = ErrorRed)
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = status.error,
                        color = ErrorRedText,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }
    }
}

@Composable
private fun ThreeDayCycleNoticeCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC)),
        shape = RoundedCornerShape(10.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, SlateBorder.copy(alpha = 0.2f))
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Info, contentDescription = null, tint = IndustrialNavyDark, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "Three-Day Test Cycle Architecture",
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp
                )
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "• This schedule defines 9 generic slots for a 3-day test cycle.\n" +
                        "• Do not assume it automatically repeats beyond Day 3.\n" +
                        "• The ESP8266 keeps time and executes actions locally. Phone disconnection will not stop local execution.\n" +
                        "• Real-world power loss recovery and RTC battery backup must be tested separately on hardware.",
                fontSize = 11.sp,
                color = Color(0xFF475569),
                lineHeight = 16.sp
            )
        }
    }
}

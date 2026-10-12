package com.prototype.dispenserbench.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.prototype.dispenserbench.model.isValid24HourTime

/**
 * 24-hour time editor dialog (HH:mm format).
 */
@Composable
fun TimePickerDialog(
    title: String,
    initialTime: String,
    onDismiss: () -> Unit,
    onConfirm: (String) -> Unit
) {
    val initialParts = initialTime.split(":")
    var hourString by remember { mutableStateOf(initialParts.getOrNull(0) ?: "08") }
    var minuteString by remember { mutableStateOf(initialParts.getOrNull(1) ?: "00") }
    var errorText by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "Edit Time ($title)",
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp
            )
        },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "Specify 24-hour time (00:00 to 23:59):",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(16.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = hourString,
                        onValueChange = { input ->
                            if (input.length <= 2 && input.all { it.isDigit() }) {
                                hourString = input
                                errorText = null
                            }
                        },
                        label = { Text("Hour (00-23)") },
                        modifier = Modifier.width(110.dp),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                    )

                    Text(
                        text = ":",
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp)
                    )

                    OutlinedTextField(
                        value = minuteString,
                        onValueChange = { input ->
                            if (input.length <= 2 && input.all { it.isDigit() }) {
                                minuteString = input
                                errorText = null
                            }
                        },
                        label = { Text("Min (00-59)") },
                        modifier = Modifier.width(110.dp),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                    )
                }

                if (errorText != null) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = errorText ?: "",
                        color = MaterialTheme.colorScheme.error,
                        fontSize = 12.sp,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))
                // Quick preset buttons for convenience
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    PresetButton("08:00") { hourString = "08"; minuteString = "00"; errorText = null }
                    PresetButton("12:00") { hourString = "12"; minuteString = "00"; errorText = null }
                    PresetButton("18:00") { hourString = "18"; minuteString = "00"; errorText = null }
                    PresetButton("22:00") { hourString = "22"; minuteString = "00"; errorText = null }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val formattedH = hourString.padStart(2, '0')
                    val formattedM = minuteString.padStart(2, '0')
                    val candidate = "$formattedH:$formattedM"
                    if (isValid24HourTime(candidate)) {
                        onConfirm(candidate)
                    } else {
                        errorText = "Must be valid 24h time (00:00 - 23:59)"
                    }
                }
            ) {
                Text("Set Time")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
private fun PresetButton(label: String, onClick: () -> Unit) {
    TextButton(onClick = onClick) {
        Text(label, fontSize = 12.sp)
    }
}

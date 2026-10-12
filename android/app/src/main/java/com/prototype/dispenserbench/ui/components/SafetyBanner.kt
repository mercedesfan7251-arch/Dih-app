package com.prototype.dispenserbench.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.prototype.dispenserbench.ui.theme.SafetyAmber
import com.prototype.dispenserbench.ui.theme.SafetyAmberContainer
import com.prototype.dispenserbench.ui.theme.SafetyAmberText

/**
 * Mandatory prominent safety banner for prototype bench testing.
 */
@Composable
fun SafetyBanner(modifier: Modifier = Modifier) {
    var expanded by remember { mutableStateOf(false) }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(SafetyAmberContainer)
            .clickable { expanded = !expanded }
            .padding(horizontal = 12.dp, vertical = 10.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth()
        ) {
            Icon(
                imageVector = Icons.Default.Warning,
                contentDescription = "Safety Warning",
                tint = SafetyAmber,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "HARDWARE PROTOTYPE ONLY • BENCH TEST WITH INERT ITEMS ONLY",
                color = SafetyAmberText,
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp,
                modifier = Modifier.weight(1f)
            )
            Icon(
                imageVector = Icons.Default.Info,
                contentDescription = "Expand info",
                tint = SafetyAmberText,
                modifier = Modifier.size(16.dp)
            )
        }

        AnimatedVisibility(visible = expanded) {
            Column(modifier = Modifier.padding(top = 8.dp, start = 4.dp)) {
                Text(
                    text = "• Test only with inert objects (e.g. dry beans, plastic beads).\n" +
                            "• NEVER load with real medications or ingestible items.\n" +
                            "• Servos present pinch hazards—keep hands clear during bench tests.\n" +
                            "• Prototype only: not safety-certified, no medical compliance, no failsafes.\n" +
                            "• Tap to collapse this warning.",
                    color = SafetyAmberText,
                    fontSize = 11.sp,
                    lineHeight = 16.sp
                )
            }
        }
    }
}

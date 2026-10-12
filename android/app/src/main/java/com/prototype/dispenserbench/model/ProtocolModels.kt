package com.prototype.dispenserbench.model

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

/**
 * Individual slot time assignment (HH:mm format).
 */
@Serializable
data class SlotTimeEntry(
    @SerialName("slot") val slot: String,
    @SerialName("time") val time: String
)

/**
 * Request payload for configuring the 9-slot schedule.
 */
@Serializable
data class SetScheduleRequest(
    @SerialName("v") val v: Int = 1,
    @SerialName("id") val id: String,
    @SerialName("cmd") val cmd: String = "set_schedule",
    @SerialName("slots") val slots: List<SlotTimeEntry>
) {
    fun toJsonLine(): String = AppJson.encodeToString(this) + "\n"
}

/**
 * Request payload for querying the current device schedule & revision.
 */
@Serializable
data class GetStateRequest(
    @SerialName("v") val v: Int = 1,
    @SerialName("id") val id: String,
    @SerialName("cmd") val cmd: String = "get_state"
) {
    fun toJsonLine(): String = AppJson.encodeToString(this) + "\n"
}

/**
 * Request payload for triggering a deliberate servo bench test for one generic slot.
 */
@Serializable
data class TestServoRequest(
    @SerialName("v") val v: Int = 1,
    @SerialName("id") val id: String,
    @SerialName("cmd") val cmd: String = "test_servo",
    @SerialName("slot") val slot: String
) {
    fun toJsonLine(): String = AppJson.encodeToString(this) + "\n"
}

/**
 * Generic response payload received from the ESP8266 over Bluetooth Classic serial.
 */
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
            if (trimmed.isEmpty() || !trimmed.startsWith("{") || !trimmed.endsWith("}")) {
                return null
            }
            return try {
                AppJson.decodeFromString<DeviceResponse>(trimmed)
            } catch (_: Exception) {
                null
            }
        }
    }
}

/**
 * Generates a short 4-to-6 character alphanumeric request ID.
 */
fun generateRequestId(): String {
    return UUID.randomUUID().toString().replace("-", "").substring(0, 4)
}

/**
 * Validates whether a time string strictly matches HH:mm in 24-hour notation (00:00 to 23:59).
 */
fun isValid24HourTime(time: String): Boolean {
    val regex = Regex("^([01]\\d|2[0-3]):[0-5]\\d$")
    return regex.matches(time.trim())
}

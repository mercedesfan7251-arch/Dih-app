package com.prototype.dispenserbench.model

/**
 * Canonical 9 slots for the 3-day dispenser bench-test prototype.
 *
 * Slots are strictly generic time markers (3 days x morning/evening/night).
 * This hardware prototype must only be tested with inert items (e.g. beads, dry beans).
 */
enum class SlotId(
    val canonicalId: String,
    val day: Int,
    val period: String,
    val defaultTime: String,
    val servoIndex: Int // Servo 1, 2, or 3 corresponding to Day 1, 2, 3
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

    val displayTitle: String
        get() = "Day $day • $period ($canonicalId)"

    companion object {
        fun fromCanonicalId(id: String): SlotId? {
            return entries.firstOrNull { it.canonicalId.equals(id, ignoreCase = true) }
        }

        fun forDay(dayNumber: Int): List<SlotId> {
            return entries.filter { it.day == dayNumber }
        }
    }
}

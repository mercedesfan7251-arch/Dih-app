package com.prototype.dispenserbench.storage

import android.content.Context
import android.content.SharedPreferences
import com.prototype.dispenserbench.model.SlotId

/**
 * Local on-phone storage for persisting the generic 9-slot schedule
 * and simple bench display preferences.
 *
 * Uses Android SharedPreferences. No cloud storage, database, or analytics.
 */
class ScheduleStorage(context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences("dispenser_bench_prefs", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_SLOT_PREFIX = "slot_time_"
        private const val KEY_LAST_DEVICE_MAC = "last_device_mac"
        private const val KEY_LAST_KNOWN_REVISION = "last_known_revision"
    }

    /**
     * Loads the 9 generic slot times from local preferences,
     * falling back to default times (08:00, 18:00, 22:00) if not yet stored.
     */
    fun loadSchedule(): Map<SlotId, String> {
        val scheduleMap = mutableMapOf<SlotId, String>()
        for (slot in SlotId.entries) {
            val savedTime = prefs.getString(KEY_SLOT_PREFIX + slot.canonicalId, slot.defaultTime) ?: slot.defaultTime
            scheduleMap[slot] = savedTime
        }
        return scheduleMap
    }

    /**
     * Saves the 9 generic slot times locally on the phone.
     */
    fun saveSchedule(schedule: Map<SlotId, String>) {
        val editor = prefs.edit()
        for ((slot, time) in schedule) {
            editor.putString(KEY_SLOT_PREFIX + slot.canonicalId, time)
        }
        editor.apply()
    }

    fun getLastDeviceMac(): String? {
        return prefs.getString(KEY_LAST_DEVICE_MAC, null)
    }

    fun saveLastDeviceMac(mac: String) {
        prefs.edit().putString(KEY_LAST_DEVICE_MAC, mac).apply()
    }

    fun getLastKnownRevision(): Int {
        return prefs.getInt(KEY_LAST_KNOWN_REVISION, 0)
    }

    fun saveLastKnownRevision(rev: Int) {
        prefs.edit().putInt(KEY_LAST_KNOWN_REVISION, rev).apply()
    }
}

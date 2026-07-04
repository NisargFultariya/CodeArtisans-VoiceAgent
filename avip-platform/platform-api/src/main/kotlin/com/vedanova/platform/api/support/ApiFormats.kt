package com.vedanova.platform.api.support

import java.time.Instant
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import kotlin.math.roundToInt

object ApiFormats {
    private val callUpdatedAtFormatter =
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'").withZone(ZoneOffset.UTC)

    fun callUpdatedAt(instant: Instant): String = callUpdatedAtFormatter.format(instant)

    fun rfc3339(instant: Instant): String = instant.toString()

    fun recoveryRate(totalCalls: Long, completedCalls: Long): String {
        if (totalCalls == 0L) return "0%"
        val pct = completedCalls.toDouble() / totalCalls.toDouble() * 100.0
        return "${pct.roundToInt()}%"
    }

    const val DEFAULT_SYSTEM_PROMPT =
        "You are an RTO recovery agent. Speak clearly, ask why delivery failed, and confirm the reason briefly."
}

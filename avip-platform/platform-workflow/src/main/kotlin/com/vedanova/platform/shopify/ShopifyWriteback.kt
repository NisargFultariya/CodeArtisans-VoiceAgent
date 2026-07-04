package com.vedanova.platform.shopify

import com.vedanova.platform.contracts.RTOAttempt
import java.time.Instant

object ShopifyWriteback {
    fun buildRtoAttempt(
        language: String,
        agentId: String,
        duration: Int,
        reason: String,
        status: String,
    ): RTOAttempt {
        val resolvedStatus = status.ifBlank { "completed" }
        return RTOAttempt(
            timestamp = Instant.now().toString(),
            language = language,
            agentId = agentId,
            callDurationSeconds = duration,
            reason = reason,
            status = resolvedStatus,
        )
    }

    fun buildShopifyNote(
        orderName: String,
        reason: String,
        language: String,
        duration: Int,
        utterances: List<String>,
    ): String {
        val transcript =
            if (utterances.isEmpty()) {
                ""
            } else {
                val start = if (utterances.size > 4) utterances.takeLast(4) else utterances
                start.mapIndexed { index, line -> "${index + 1}. $line" }.joinToString(" | ")
            }
        val parts =
            mutableListOf(
                "AVIP RTO Call ($orderName)",
                "Reason: $reason",
                "Language: $language",
                "Duration: ${duration}s",
            )
        if (transcript.isNotEmpty()) {
            parts.add("Customer transcript: $transcript")
        } else {
            parts.add("Customer transcript: Not captured")
        }
        return parts.joinToString("\n")
    }

    fun normalizeOrderId(orderId: String): String = orderId.substringAfterLast('/')
}

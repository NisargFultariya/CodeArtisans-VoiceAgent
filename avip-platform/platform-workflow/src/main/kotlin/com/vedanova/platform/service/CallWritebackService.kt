package com.vedanova.platform.service

import com.vedanova.platform.contracts.CallCompletedPayload
import com.vedanova.platform.contracts.RTOAttempt
import com.vedanova.platform.contracts.ShopifyOrderContext
import com.vedanova.platform.shopify.ShopifyWriteback
import com.vedanova.platform.shopify.ShopifyRegistry
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class CallWritebackService(
    private val shopifyRegistry: ShopifyRegistry,
) {
    fun writebackCompleted(
        shopId: String,
        orderContext: ShopifyOrderContext,
        payload: CallCompletedPayload,
    ) {
        val client = shopifyRegistry.clientForShop(shopId)
        val fields = resolveCompletionFields(orderContext, payload)
        client.recordRtoAttempt(orderContext.orderId, fields.attempt)
        try {
            client.addOrderNote(orderContext.orderId, fields.note)
        } catch (_: Exception) {
            // Non-fatal — matches legacy Go behavior.
        }
    }

    private fun resolveCompletionFields(
        order: ShopifyOrderContext,
        payload: CallCompletedPayload,
    ): CompletionFields {
        var reason = payload.reason.ifBlank { payload.outcome }
        if (reason.isBlank()) reason = "Customer reason not clearly captured"
        var language = payload.language.ifBlank { order.language }
        var agentId = payload.agentId.ifBlank { "avip-agent" }
        val attempt =
            ShopifyWriteback.buildRtoAttempt(
                language,
                agentId,
                payload.callDurationSeconds,
                reason,
                payload.status,
            )
        val note =
            ShopifyWriteback.buildShopifyNote(
                order.orderName,
                reason,
                language,
                payload.callDurationSeconds,
                payload.userUtterances,
            )
        return CompletionFields(reason, language, agentId, attempt, note)
    }

    private data class CompletionFields(
        val reason: String,
        val language: String,
        val agentId: String,
        val attempt: RTOAttempt,
        val note: String,
    )
}

package com.vedanova.platform.api.service

import com.vedanova.platform.api.dto.TriggerCallRequest
import com.vedanova.platform.api.dto.TriggerCallResponse
import com.vedanova.platform.contracts.CallLifecycleInput
import com.vedanova.platform.contracts.CallOverrides
import com.vedanova.platform.temporal.TemporalWorkflowService
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException

@Service
class CallTriggerService(
    private val shopInternalService: ShopInternalService,
    private val temporalWorkflowService: TemporalWorkflowService,
) {
    fun trigger(body: TriggerCallRequest): TriggerCallResponse {
        val shopDomain = body.shopDomain.trim()
        val orderId = normalizeOrderId(body.orderId.trim())
        if (shopDomain.isEmpty() || orderId.isEmpty()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "shopDomain and orderId required")
        }
        val shop = shopInternalService.requireShop(shopDomain)
        var simulation = body.simulation ?: false
        var forceNew = body.forceNew ?: false
        if (body.source == "custom-recovery") {
            forceNew = true
        }
        val payload = buildMap<String, Any?> {
            if (body.source.isNotBlank()) put("source", body.source)
            if (body.objective.isNotBlank()) put("objective", body.objective)
        }
        val idempotencyKey = buildIdempotencyKey(shop.id, orderId, forceNew)
        val input =
            CallLifecycleInput(
                shopId = shop.id,
                workflowTemplateId = "fulfillment-error-v1",
                orderId = orderId,
                idempotencyKey = idempotencyKey,
                triggerPayload = payload,
                simulationMode = simulation,
                overrides = parseOverrides(body),
            )
        val workflowId =
            try {
                temporalWorkflowService.startCallLifecycle(input)
            } catch (ex: Exception) {
                throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "start workflow failed", ex)
            }
        return TriggerCallResponse(
            workflowId = workflowId,
            orderId = orderId,
            simulation = simulation,
            shopId = shop.id,
        )
    }

    private fun buildIdempotencyKey(
        shopId: String,
        orderId: String,
        forceNew: Boolean,
    ): String {
        var key = "$shopId-$orderId"
        if (forceNew) {
            key += "-${System.nanoTime()}"
        }
        return key
    }

    private fun parseOverrides(body: TriggerCallRequest): CallOverrides =
        CallOverrides(
            objective = body.objective.trim(),
            language = body.language.trim(),
            systemPrompt = body.systemPrompt.trim(),
            customerPhone = body.customerPhone.trim(),
        )

    companion object {
        fun normalizeOrderId(orderId: String): String = orderId.substringAfterLast('/')
    }
}

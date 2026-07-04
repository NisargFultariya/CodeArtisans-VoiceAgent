package com.vedanova.platform.contracts

data class CallLifecycleInput(
    val shopId: String,
    val workflowTemplateId: String = "",
    val orderId: String,
    val idempotencyKey: String = "",
    val triggerPayload: Map<String, Any?> = emptyMap(),
    val simulationMode: Boolean = false,
    val overrides: CallOverrides = CallOverrides(),
)

data class CallOverrides(
    val objective: String = "",
    val language: String = "",
    val systemPrompt: String = "",
    val customerPhone: String = "",
)

data class CallCompletedPayload(
    val outcome: String = "",
    val reason: String = "",
    val language: String = "",
    val callDurationSeconds: Int = 0,
    val userUtterances: List<String> = emptyList(),
    val agentId: String = "",
    val status: String = "",
)

data class ShopConfig(
    val shopId: String,
    val shopDomain: String,
    val systemPrompt: String,
    val defaultLanguage: String = "hi-IN",
)

data class UpdateCallStatusActivityInput(
    val shopId: String,
    val orderId: String,
    val status: String,
    val outcome: String = "",
    val durationSeconds: Int? = null,
)

data class DispatchCallResult(
    val dispatchId: String,
    val roomName: String,
    val customerPhone: String,
    val orderId: String,
)

data class ShopifyOrderContext(
    val orderId: String,
    val orderName: String = "",
    val customerId: String = "",
    val customerName: String = "",
    val customerPhone: String = "",
    val customerEmail: String = "",
    val address: OrderAddress = OrderAddress(),
    val language: String = "",
    val previousAttempts: List<RTOAttempt> = emptyList(),
    val attemptNumber: Int = 1,
    val failureReason: String = "",
    val createdAt: String = "",
    val updatedAt: String = "",
)

data class OrderAddress(
    val line1: String = "",
    val line2: String = "",
    val city: String = "",
    val state: String = "",
    val postalCode: String = "",
)

data class RTOAttempt(
    val timestamp: String = "",
    val reason: String = "",
    val language: String = "",
    val agentId: String = "",
    val callDurationSeconds: Int = 0,
    val status: String = "",
)

data class DispatchParams(
    val orderContext: ShopifyOrderContext,
    val workflowId: String,
    val shopId: String,
    val systemPrompt: String,
    val simulationMode: Boolean = false,
    val objective: String = "",
    val language: String = "",
)

data class EscalationParams(
    val shopId: String,
    val orderId: String,
    val reason: String = "",
)

data class WritebackParams(
    val shopId: String,
    val orderContext: ShopifyOrderContext,
    val payload: CallCompletedPayload,
)

enum class CallStatus(val value: String) {
    PENDING("pending"),
    DISPATCHING("dispatching"),
    IN_CALL("in_call"),
    COMPLETED("completed"),
    ESCALATED("escalated"),
    CANCELLED("cancelled"),
}

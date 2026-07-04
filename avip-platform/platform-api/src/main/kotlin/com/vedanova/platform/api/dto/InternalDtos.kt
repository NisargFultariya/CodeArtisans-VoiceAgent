package com.vedanova.platform.api.dto

import com.fasterxml.jackson.annotation.JsonInclude

@JsonInclude(JsonInclude.Include.NON_NULL)
data class CallItemDto(
    val orderId: String,
    val status: String,
    val updatedAt: String,
    val outcome: String? = null,
    val workflowId: String? = null,
    val durationSeconds: Int? = null,
)

@JsonInclude(JsonInclude.Include.NON_NULL)
data class EscalationItemDto(
    val id: String,
    val orderId: String,
    val reason: String? = null,
    val status: String,
    val assignee: String? = null,
    val createdAt: String,
    val updatedAt: String,
)

data class UpsertShopRequest(
    val shopDomain: String = "",
    val accessToken: String = "",
    val scopes: String = "",
)

data class UpsertShopResponse(
    val ok: Boolean = true,
    val id: String,
    val shopDomain: String,
)

data class ListCallsResponse(
    val ok: Boolean = true,
    val calls: List<CallItemDto> = emptyList(),
)

data class TriggerCallRequest(
    val shopDomain: String = "",
    val orderId: String = "",
    val simulation: Boolean? = null,
    val source: String = "",
    val objective: String = "",
    val language: String = "",
    val systemPrompt: String = "",
    val customerPhone: String = "",
    val forceNew: Boolean? = null,
)

data class TriggerCallResponse(
    val ok: Boolean = true,
    val workflowId: String,
    val orderId: String,
    val simulation: Boolean,
    val shopId: String,
)

data class PreferencesBody(
    val defaultLanguage: String = "hi-IN",
    val autoWebhook: Boolean = true,
    val escalationEmailEnabled: Boolean = true,
)

data class GetPreferencesResponse(
    val ok: Boolean = true,
    val preferences: PreferencesBody,
    val updatedAt: String? = null,
)

data class PutPreferencesResponse(
    val ok: Boolean = true,
    val preferences: PreferencesBody,
    val updatedAt: String,
)

data class PromptBody(
    val systemPrompt: String = "",
)

data class GetPromptResponse(
    val ok: Boolean = true,
    val prompt: PromptBody,
    val updatedAt: String? = null,
)

data class PutPromptResponse(
    val ok: Boolean = true,
    val prompt: PromptBody,
    val updatedAt: String,
)

data class AnalyticsResponse(
    val ok: Boolean = true,
    val callsThisMonth: Long = 0,
    val totalCalls: Long = 0,
    val completedCalls: Long = 0,
    val avgDurationSeconds: Double = 0.0,
    val openEscalations: Long = 0,
    val recoveryRate: String = "0%",
)

data class ListEscalationsResponse(
    val ok: Boolean = true,
    val escalations: List<EscalationItemDto> = emptyList(),
)

data class ResolveEscalationRequest(
    val assignee: String = "",
)

data class OkResponse(
    val ok: Boolean = true,
)

data class RecordConsentRequest(
    val shopDomain: String = "",
    val orderId: String = "",
    val customerPhone: String = "",
    val source: String = "checkout",
)

data class ConsentStatusResponse(
    val ok: Boolean = true,
    val granted: Boolean = false,
    val grantedAt: String? = null,
    val source: String? = null,
)

data class SimulateRtoResponse(
    val ok: Boolean = true,
    val workflowId: String,
    val simulation: Boolean,
)

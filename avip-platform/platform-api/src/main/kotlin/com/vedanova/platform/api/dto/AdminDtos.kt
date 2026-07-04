package com.vedanova.platform.api.dto

data class AdminLoginRequest(
    val username: String = "",
    val password: String = "",
)

data class AdminLoginResponse(
    val token: String,
    val expiresAt: String,
    val username: String,
)

data class AdminMeResponse(
    val username: String,
)

data class AdminDashboardResponse(
    val totalShops: Long,
    val totalCalls: Long,
    val callsThisMonth: Long,
    val completedCalls: Long,
    val recoveryRate: String,
    val avgDurationSeconds: Double,
    val openEscalations: Long,
    val recentCalls: List<AdminCallItemDto>,
    val recentEscalations: List<AdminEscalationItemDto>,
)

data class AdminShopItemDto(
    val id: String,
    val shopDomain: String,
    val installedAt: String?,
    val callCount: Long,
)

data class AdminListShopsResponse(
    val shops: List<AdminShopItemDto> = emptyList(),
)

data class AdminCallItemDto(
    val shopId: String,
    val shopDomain: String,
    val orderId: String,
    val status: String,
    val outcome: String? = null,
    val workflowId: String? = null,
    val durationSeconds: Int? = null,
    val updatedAt: String,
)

data class AdminListCallsResponse(
    val calls: List<AdminCallItemDto> = emptyList(),
)

data class AdminEscalationItemDto(
    val id: String,
    val shopId: String,
    val shopDomain: String,
    val orderId: String,
    val reason: String? = null,
    val status: String,
    val assignee: String? = null,
    val createdAt: String,
    val updatedAt: String,
)

data class AdminListEscalationsResponse(
    val escalations: List<AdminEscalationItemDto> = emptyList(),
)

data class AdminDemoInviteRequest(
    val email: String,
)

data class AdminDemoInviteResponse(
    val message: String,
    val email: String,
)

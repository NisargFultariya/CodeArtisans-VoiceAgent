package com.vedanova.platform.api.dto

data class PortalLoginRequest(
    val email: String,
    val fullName: String? = null,
    val accountName: String? = null,
)

data class PortalLoginResponse(
    val message: String,
    val email: String,
)

data class PortalMeResponse(
    val email: String,
    val fullName: String? = null,
    val accountId: String,
    val accountName: String,
    val role: String,
)

data class PortalShopItemDto(
    val id: String,
    val shopDomain: String,
)

data class PortalListShopsResponse(
    val shops: List<PortalShopItemDto>,
)

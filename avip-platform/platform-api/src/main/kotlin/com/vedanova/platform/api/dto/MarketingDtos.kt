package com.vedanova.platform.api.dto

data class DemoAccessRequestBody(
    val email: String,
)

data class DemoAccessResponse(
    val message: String,
)

data class CreateDemoRequestBody(
    val email: String,
    val source: String = "book-demo",
    val fullName: String? = null,
    val company: String? = null,
    val shopDomain: String? = null,
    val monthlyVolume: String? = null,
    val message: String? = null,
)

data class CreateDemoRequestResponse(
    val requestId: String,
    val demoShopDomain: String?,
    val message: String,
)

data class AdminDemoRequestItemDto(
    val id: String,
    val email: String,
    val fullName: String?,
    val company: String?,
    val shopDomain: String?,
    val monthlyVolume: String?,
    val message: String?,
    val source: String,
    val status: String,
    val demoShopId: String?,
    val createdAt: String,
)

data class AdminListDemoRequestsResponse(
    val requests: List<AdminDemoRequestItemDto>,
    val newCount: Long,
)

package com.vedanova.platform.persistence

import java.time.Instant

data class Shop(
    val id: String,
    val shopDomain: String,
    val accountId: String? = null,
    val accessTokenEncrypted: String? = null,
    val scopes: String? = null,
)

data class CallRow(
    val orderId: String,
    val status: String,
    val outcome: String? = null,
    val workflowId: String? = null,
    val durationSeconds: Int? = null,
    val updatedAt: Instant,
)

data class ShopPreferences(
    val shopId: String,
    val defaultLanguage: String = "hi-IN",
    val autoWebhook: Boolean = true,
    val escalationEmailEnabled: Boolean = true,
    val updatedAt: Instant = Instant.now(),
)

data class PromptProfile(
    val id: String = "",
    val name: String = "default",
    val systemPrompt: String,
    val updatedAt: Instant = Instant.now(),
)

data class ShopAnalytics(
    val callsThisMonth: Long = 0,
    val totalCalls: Long = 0,
    val completedCalls: Long = 0,
    val avgDurationSeconds: Double = 0.0,
    val openEscalations: Long = 0,
)

data class EscalationRow(
    val id: String,
    val orderId: String,
    val reason: String? = null,
    val status: String,
    val assignee: String? = null,
    val createdAt: Instant,
    val updatedAt: Instant,
)

data class ShopSummary(
    val id: String,
    val shopDomain: String,
    val accountId: String? = null,
    val installedAt: Instant? = null,
    val callCount: Long = 0,
)

data class AdminCallRow(
    val shopId: String,
    val shopDomain: String,
    val orderId: String,
    val status: String,
    val outcome: String? = null,
    val workflowId: String? = null,
    val durationSeconds: Int? = null,
    val updatedAt: Instant,
)

data class AdminEscalationRow(
    val id: String,
    val shopId: String,
    val shopDomain: String,
    val orderId: String,
    val reason: String? = null,
    val status: String,
    val assignee: String? = null,
    val createdAt: Instant,
    val updatedAt: Instant,
)

data class PlatformAnalytics(
    val totalShops: Long = 0,
    val totalCalls: Long = 0,
    val callsThisMonth: Long = 0,
    val completedCalls: Long = 0,
    val avgDurationSeconds: Double = 0.0,
    val openEscalations: Long = 0,
)

data class DemoRequestRow(
    val id: String,
    val email: String,
    val fullName: String? = null,
    val company: String? = null,
    val shopDomain: String? = null,
    val monthlyVolume: String? = null,
    val message: String? = null,
    val source: String,
    val status: String,
    val demoShopId: String? = null,
    val createdAt: Instant,
    val updatedAt: Instant,
)

data class DemoTranscriptLogRow(
    val id: String,
    val roomName: String,
    val participantEmail: String? = null,
    val language: String? = null,
    val scenario: String? = null,
    val voice: String? = null,
    val inputMode: String? = null,
    val status: String,
    val transcript: String,
    val lineCount: Int,
    val createdAt: Instant,
    val updatedAt: Instant,
)

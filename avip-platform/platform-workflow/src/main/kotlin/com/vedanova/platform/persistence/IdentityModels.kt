package com.vedanova.platform.persistence

import java.time.Instant

data class Account(
    val id: String,
    val name: String,
    val billingEmail: String? = null,
    val stripeCustomerId: String? = null,
    val planTier: String = "trial",
    val status: String = "trial",
    val createdAt: Instant,
    val updatedAt: Instant,
)

data class User(
    val id: String,
    val email: String,
    val fullName: String? = null,
    val emailVerifiedAt: Instant? = null,
    val authProvider: String = "magic",
    val createdAt: Instant,
    val updatedAt: Instant,
)

data class AccountMembership(
    val accountId: String,
    val userId: String,
    val role: String,
    val invitedAt: Instant? = null,
    val acceptedAt: Instant? = null,
    val createdAt: Instant,
    val updatedAt: Instant,
)

data class OperatorUser(
    val id: String,
    val email: String,
    val fullName: String? = null,
    val role: String,
    val disabledAt: Instant? = null,
    val createdAt: Instant,
    val updatedAt: Instant,
)

data class LoginToken(
    val id: String,
    val userId: String,
    val purpose: String,
    val expiresAt: Instant,
    val consumedAt: Instant? = null,
    val createdAt: Instant,
)

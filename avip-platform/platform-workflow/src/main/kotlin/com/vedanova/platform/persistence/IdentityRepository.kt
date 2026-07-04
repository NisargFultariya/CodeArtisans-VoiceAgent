package com.vedanova.platform.persistence

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate
import org.springframework.stereotype.Repository
import java.sql.ResultSet
import java.time.Instant
import java.util.UUID

@Repository
class IdentityRepository(
    private val jdbc: NamedParameterJdbcTemplate,
) {
    fun createAccount(
        name: String,
        billingEmail: String? = null,
        planTier: String = "trial",
        status: String = "trial",
    ): Account {
        val id = newId()
        val params =
            MapSqlParameterSource()
                .addValue("id", id)
                .addValue("name", name)
                .addValue("billingEmail", billingEmail)
                .addValue("planTier", planTier)
                .addValue("status", status)
        return jdbc.queryForObject(
            """
            INSERT INTO identity.accounts (id, name, billing_email, plan_tier, status, created_at, updated_at)
            VALUES (:id, :name, :billingEmail, :planTier, :status, NOW(), NOW())
            RETURNING
              id, name, billing_email, stripe_customer_id, plan_tier, status, created_at, updated_at
            """.trimIndent(),
            params,
        ) { rs, _ -> mapAccount(rs) }!!
    }

    fun findAccountById(id: String): Account? =
        jdbc.query(
            """
            SELECT id, name, billing_email, stripe_customer_id, plan_tier, status, created_at, updated_at
            FROM identity.accounts
            WHERE id = :id
            """.trimIndent(),
            MapSqlParameterSource("id", id),
        ) { rs, _ -> mapAccount(rs) }
            .firstOrNull()

    fun createUser(
        email: String,
        fullName: String? = null,
        authProvider: String = "magic",
        emailVerifiedAt: Instant? = null,
    ): User {
        val id = newId()
        val normalized = normalizeEmail(email)
        val params =
            MapSqlParameterSource()
                .addValue("id", id)
                .addValue("email", email.trim())
                .addValue("emailNormalized", normalized)
                .addValue("fullName", fullName?.trim()?.takeIf { it.isNotBlank() })
                .addValue("authProvider", authProvider)
                .addValue("emailVerifiedAt", emailVerifiedAt?.let { java.sql.Timestamp.from(it) })
        return jdbc.queryForObject(
            """
            INSERT INTO identity.users (
              id, email, email_normalized, full_name, auth_provider, email_verified_at, created_at, updated_at
            )
            VALUES (
              :id, :email, :emailNormalized, :fullName, :authProvider, :emailVerifiedAt, NOW(), NOW()
            )
            RETURNING
              id, email, full_name, email_verified_at, auth_provider, created_at, updated_at
            """.trimIndent(),
            params,
        ) { rs, _ -> mapUser(rs) }!!
    }

    fun findUserByEmail(email: String): User? {
        val normalized = normalizeEmail(email)
        return jdbc.query(
            """
            SELECT id, email, full_name, email_verified_at, auth_provider, created_at, updated_at
            FROM identity.users
            WHERE email_normalized = :emailNormalized
            """.trimIndent(),
            MapSqlParameterSource("emailNormalized", normalized),
        ) { rs, _ -> mapUser(rs) }
            .firstOrNull()
    }

    fun findUserById(id: String): User? =
        jdbc.query(
            """
            SELECT id, email, full_name, email_verified_at, auth_provider, created_at, updated_at
            FROM identity.users
            WHERE id = :id
            """.trimIndent(),
            MapSqlParameterSource("id", id),
        ) { rs, _ -> mapUser(rs) }
            .firstOrNull()

    fun addMembership(
        accountId: String,
        userId: String,
        role: String,
        invitedAt: Instant? = null,
        acceptedAt: Instant? = null,
    ): AccountMembership {
        val params =
            MapSqlParameterSource()
                .addValue("accountId", accountId)
                .addValue("userId", userId)
                .addValue("role", role)
                .addValue("invitedAt", invitedAt?.let { java.sql.Timestamp.from(it) })
                .addValue("acceptedAt", acceptedAt?.let { java.sql.Timestamp.from(it) })
        return jdbc.queryForObject(
            """
            INSERT INTO identity.account_memberships (
              account_id, user_id, role, invited_at, accepted_at, created_at, updated_at
            )
            VALUES (:accountId, :userId, :role, :invitedAt, :acceptedAt, NOW(), NOW())
            RETURNING
              account_id, user_id, role, invited_at, accepted_at, created_at, updated_at
            """.trimIndent(),
            params,
        ) { rs, _ -> mapMembership(rs) }!!
    }

    fun findMembership(
        accountId: String,
        userId: String,
    ): AccountMembership? =
        jdbc.query(
            """
            SELECT account_id, user_id, role, invited_at, accepted_at, created_at, updated_at
            FROM identity.account_memberships
            WHERE account_id = :accountId AND user_id = :userId
            """.trimIndent(),
            MapSqlParameterSource()
                .addValue("accountId", accountId)
                .addValue("userId", userId),
        ) { rs, _ -> mapMembership(rs) }
            .firstOrNull()

    fun listMembershipsForUser(userId: String): List<AccountMembership> =
        jdbc.query(
            """
            SELECT account_id, user_id, role, invited_at, accepted_at, created_at, updated_at
            FROM identity.account_memberships
            WHERE user_id = :userId
            ORDER BY created_at ASC
            """.trimIndent(),
            MapSqlParameterSource("userId", userId),
        ) { rs, _ -> mapMembership(rs) }

    fun listMembershipsForAccount(accountId: String): List<AccountMembership> =
        jdbc.query(
            """
            SELECT account_id, user_id, role, invited_at, accepted_at, created_at, updated_at
            FROM identity.account_memberships
            WHERE account_id = :accountId
            ORDER BY created_at ASC
            """.trimIndent(),
            MapSqlParameterSource("accountId", accountId),
        ) { rs, _ -> mapMembership(rs) }

    fun insertLoginToken(
        userId: String,
        tokenHash: String,
        purpose: String,
        expiresAt: Instant,
        metadata: String? = null,
    ): LoginToken {
        val id = newId()
        val params =
            MapSqlParameterSource()
                .addValue("id", id)
                .addValue("userId", userId)
                .addValue("tokenHash", tokenHash)
                .addValue("purpose", purpose)
                .addValue("expiresAt", java.sql.Timestamp.from(expiresAt))
                .addValue("metadata", metadata)
        return jdbc.queryForObject(
            """
            INSERT INTO identity.login_tokens (
              id, user_id, token_hash, purpose, expires_at, metadata, created_at
            )
            VALUES (:id, :userId, :tokenHash, :purpose, :expiresAt, :metadata, NOW())
            RETURNING id, user_id, purpose, expires_at, consumed_at, created_at
            """.trimIndent(),
            params,
        ) { rs, _ -> mapLoginToken(rs) }!!
    }

    fun findActiveLoginToken(tokenHash: String): LoginToken? =
        jdbc.query(
            """
            SELECT id, user_id, purpose, expires_at, consumed_at, created_at
            FROM identity.login_tokens
            WHERE token_hash = :tokenHash
              AND consumed_at IS NULL
              AND expires_at > NOW()
            """.trimIndent(),
            MapSqlParameterSource("tokenHash", tokenHash),
        ) { rs, _ -> mapLoginToken(rs) }
            .firstOrNull()

    fun consumeLoginToken(id: String): Boolean =
        jdbc.update(
            """
            UPDATE identity.login_tokens
            SET consumed_at = NOW()
            WHERE id = :id AND consumed_at IS NULL
            """.trimIndent(),
            MapSqlParameterSource("id", id),
        ) > 0

    fun markEmailVerified(userId: String): User? =
        jdbc.query(
            """
            UPDATE identity.users
            SET email_verified_at = COALESCE(email_verified_at, NOW()), updated_at = NOW()
            WHERE id = :userId
            RETURNING id, email, full_name, email_verified_at, auth_provider, created_at, updated_at
            """.trimIndent(),
            MapSqlParameterSource("userId", userId),
        ) { rs, _ -> mapUser(rs) }
            .firstOrNull()

    private fun newId(): String = UUID.randomUUID().toString().replace("-", "")

    private fun normalizeEmail(email: String): String = email.trim().lowercase()

    private fun mapAccount(rs: ResultSet) =
        Account(
            id = rs.getString("id"),
            name = rs.getString("name"),
            billingEmail = rs.getString("billing_email"),
            stripeCustomerId = rs.getString("stripe_customer_id"),
            planTier = rs.getString("plan_tier"),
            status = rs.getString("status"),
            createdAt = rs.getTimestamp("created_at").toInstant(),
            updatedAt = rs.getTimestamp("updated_at").toInstant(),
        )

    private fun mapUser(rs: ResultSet) =
        User(
            id = rs.getString("id"),
            email = rs.getString("email"),
            fullName = rs.getString("full_name"),
            emailVerifiedAt = rs.getTimestamp("email_verified_at")?.toInstant(),
            authProvider = rs.getString("auth_provider"),
            createdAt = rs.getTimestamp("created_at").toInstant(),
            updatedAt = rs.getTimestamp("updated_at").toInstant(),
        )

    private fun mapMembership(rs: ResultSet) =
        AccountMembership(
            accountId = rs.getString("account_id"),
            userId = rs.getString("user_id"),
            role = rs.getString("role"),
            invitedAt = rs.getTimestamp("invited_at")?.toInstant(),
            acceptedAt = rs.getTimestamp("accepted_at")?.toInstant(),
            createdAt = rs.getTimestamp("created_at").toInstant(),
            updatedAt = rs.getTimestamp("updated_at").toInstant(),
        )

    private fun mapLoginToken(rs: ResultSet) =
        LoginToken(
            id = rs.getString("id"),
            userId = rs.getString("user_id"),
            purpose = rs.getString("purpose"),
            expiresAt = rs.getTimestamp("expires_at").toInstant(),
            consumedAt = rs.getTimestamp("consumed_at")?.toInstant(),
            createdAt = rs.getTimestamp("created_at").toInstant(),
        )
}

package com.vedanova.platform.api.service

import com.vedanova.platform.config.AvipProperties
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import java.nio.charset.StandardCharsets
import java.time.Instant
import java.util.Base64
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

data class PortalSession(
    val userId: String,
    val accountId: String,
    val role: String,
    val expiresAt: Instant,
)

@Service
class PortalAuthService(
    private val avipProperties: AvipProperties,
) {
    fun issueSession(
        userId: String,
        accountId: String,
        role: String,
    ): Pair<String, Instant> {
        val expiresAt = Instant.now().plusSeconds(avipProperties.portal.sessionTtlHours * 3600)
        val payload = "$userId|$accountId|$role|${expiresAt.epochSecond}"
        return signToken(payload.toByteArray(StandardCharsets.UTF_8)) to expiresAt
    }

    fun validateSession(token: String): PortalSession {
        if (token.isBlank()) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "portal session required")
        }
        val payload = verifyTokenPayload(token)
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid portal session")
        val parts = String(payload, StandardCharsets.UTF_8).split('|', limit = 4)
        if (parts.size != 4) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid portal session")
        }
        val expiresAt =
            parts[3].toLongOrNull()
                ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid portal session")
        if (Instant.now().epochSecond > expiresAt) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "portal session expired")
        }
        return PortalSession(
            userId = parts[0],
            accountId = parts[1],
            role = parts[2],
            expiresAt = Instant.ofEpochSecond(expiresAt),
        )
    }

    fun sessionCookie(
        token: String,
        expiresAt: Instant,
    ): String {
        val maxAge = (expiresAt.epochSecond - System.currentTimeMillis() / 1000).coerceAtLeast(60)
        val name = avipProperties.portal.accessCookieName
        return "$name=$token; Path=/; Max-Age=$maxAge; HttpOnly; SameSite=Lax"
    }

    fun clearSessionCookie(): String {
        val name = avipProperties.portal.accessCookieName
        return "$name=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax"
    }

    private fun signToken(payload: ByteArray): String {
        val signature = sign(payload, sessionSecret())
        return "${encode(payload)}.${encode(signature)}"
    }

    private fun verifyTokenPayload(token: String): ByteArray? {
        val parts = token.split('.', limit = 2)
        if (parts.size != 2) return null
        val payload = decode(parts[0]) ?: return null
        val signature = decode(parts[1]) ?: return null
        val expected =
            try {
                sign(payload, sessionSecret())
            } catch (_: ResponseStatusException) {
                return null
            }
        if (!expected.contentEquals(signature)) return null
        return payload
    }

    private fun sessionSecret(): ByteArray {
        val secret =
            avipProperties.portal.sessionSecret.ifBlank {
                avipProperties.admin.sessionSecret.ifBlank { avipProperties.internalSecret }
            }
        if (secret.isBlank()) {
            throw ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "portal session secret not configured")
        }
        return secret.toByteArray(StandardCharsets.UTF_8)
    }

    private fun sign(payload: ByteArray, secret: ByteArray): ByteArray {
        val mac = Mac.getInstance("HmacSHA256")
        mac.init(SecretKeySpec(secret, "HmacSHA256"))
        return mac.doFinal(payload)
    }

    private fun encode(bytes: ByteArray): String =
        Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)

    private fun decode(value: String): ByteArray? =
        try {
            Base64.getUrlDecoder().decode(value)
        } catch (_: IllegalArgumentException) {
            null
        }
}

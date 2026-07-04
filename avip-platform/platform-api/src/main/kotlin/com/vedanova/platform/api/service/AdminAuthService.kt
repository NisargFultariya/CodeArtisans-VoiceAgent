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

@Service
class AdminAuthService(
    private val avipProperties: AvipProperties,
) {
    fun login(username: String, password: String): Pair<String, Instant> {
        val admin = avipProperties.admin
        if (admin.password.isBlank()) {
            throw ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "admin login disabled")
        }
        if (username != admin.username || password != admin.password) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid credentials")
        }
        val expiresAt = Instant.now().plusSeconds(admin.sessionTtlHours * 3600)
        return issueToken(admin.username, expiresAt) to expiresAt
    }

    fun validateToken(token: String): String {
        val admin = avipProperties.admin
        if (admin.password.isBlank()) {
            throw ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "admin login disabled")
        }
        val parts = token.split('.', limit = 2)
        if (parts.size != 2) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid token")
        }
        val payload = decode(parts[0])
        val signature = decode(parts[1])
        val expected = sign(payload, sessionSecret())
        if (!expected.contentEquals(signature)) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid token")
        }
        val payloadParts = String(payload, StandardCharsets.UTF_8).split('|', limit = 2)
        if (payloadParts.size != 2) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid token")
        }
        val username = payloadParts[0]
        val expiresAt =
            payloadParts[1].toLongOrNull()
                ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid token")
        if (Instant.now().epochSecond > expiresAt) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "token expired")
        }
        if (username != admin.username) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid token")
        }
        return username
    }

    private fun issueToken(username: String, expiresAt: Instant): String {
        val payload = "$username|${expiresAt.epochSecond}".toByteArray(StandardCharsets.UTF_8)
        val signature = sign(payload, sessionSecret())
        return "${encode(payload)}.${encode(signature)}"
    }

    private fun sessionSecret(): ByteArray {
        val secret = avipProperties.admin.sessionSecret.ifBlank { avipProperties.internalSecret }
        if (secret.isBlank()) {
            throw ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "admin session secret not configured")
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

    private fun decode(value: String): ByteArray =
        try {
            Base64.getUrlDecoder().decode(value)
        } catch (_: IllegalArgumentException) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid token")
        }
}

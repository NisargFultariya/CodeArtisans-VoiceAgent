package com.vedanova.platform.demo

import com.vedanova.platform.config.AvipProperties
import org.springframework.stereotype.Service
import java.nio.charset.StandardCharsets
import java.time.Instant
import java.util.Base64
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

data class VoiceDemoClaims(
    val requestId: String,
    val email: String,
    val expiresAt: Instant,
)

class DemoAccessDeniedException(message: String) : RuntimeException(message)

@Service
class VoiceDemoTokenService(
    private val avipProperties: AvipProperties,
) {
    fun issue(requestId: String, email: String, expiresAt: Instant): String {
        val payload = "$requestId|${email.trim().lowercase()}|${expiresAt.epochSecond}"
        return signToken(payload.toByteArray(StandardCharsets.UTF_8))
    }

    fun validate(token: String): VoiceDemoClaims? {
        if (token.isBlank()) return null
        val payload = verifyTokenPayload(token) ?: return null
        val parts = String(payload, StandardCharsets.UTF_8).split('|', limit = 3)
        if (parts.size != 3) return null
        val expiresAt = parts[2].toLongOrNull() ?: return null
        if (Instant.now().epochSecond > expiresAt) return null
        return VoiceDemoClaims(
            requestId = parts[0],
            email = parts[1],
            expiresAt = Instant.ofEpochSecond(expiresAt),
        )
    }

    fun requireValid(token: String): VoiceDemoClaims =
        validate(token) ?: throw DemoAccessDeniedException("demo access required")

    private fun signToken(payload: ByteArray): String {
        val signature = sign(payload, demoSecret())
        return "${encode(payload)}.${encode(signature)}"
    }

    private fun verifyTokenPayload(token: String): ByteArray? {
        val parts = token.split('.', limit = 2)
        if (parts.size != 2) return null
        val payload = decode(parts[0]) ?: return null
        val signature = decode(parts[1]) ?: return null
        val expected =
            try {
                sign(payload, demoSecret())
            } catch (_: IllegalStateException) {
                return null
            }
        if (!expected.contentEquals(signature)) return null
        return payload
    }

    private fun demoSecret(): ByteArray {
        val secret =
            avipProperties.voiceDemo.tokenSecret.ifBlank {
                avipProperties.admin.sessionSecret.ifBlank { avipProperties.internalSecret }
            }
        if (secret.isBlank()) {
            throw IllegalStateException("demo token secret not configured")
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

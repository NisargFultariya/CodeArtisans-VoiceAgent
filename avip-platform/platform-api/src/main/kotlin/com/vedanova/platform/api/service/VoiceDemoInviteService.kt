package com.vedanova.platform.api.service

import com.vedanova.platform.api.dto.DemoAccessResponse
import com.vedanova.platform.config.AvipProperties
import com.vedanova.platform.demo.VoiceDemoTokenService
import com.vedanova.platform.persistence.DemoRequestRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import java.time.Instant
import java.util.UUID

@Service
class VoiceDemoInviteService(
    private val demoRequestRepository: DemoRequestRepository,
    private val voiceDemoTokenService: VoiceDemoTokenService,
    private val voiceDemoMailService: VoiceDemoMailService,
    private val avipProperties: AvipProperties,
) {
    fun invite(email: String, source: String): DemoAccessResponse {
        val normalizedEmail = email.trim().lowercase()
        if (normalizedEmail.isEmpty() || !normalizedEmail.contains('@')) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "valid email required")
        }
        if (source !in ALLOWED_SOURCES) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid source")
        }

        val requestId = UUID.randomUUID().toString().replace("-", "")
        val expiresAt = Instant.now().plusSeconds(avipProperties.voiceDemo.tokenTtlHours * 3600)
        val token = voiceDemoTokenService.issue(requestId, normalizedEmail, expiresAt)

        demoRequestRepository.insert(
            id = requestId,
            email = normalizedEmail,
            fullName = null,
            company = null,
            shopDomain = null,
            monthlyVolume = null,
            message = null,
            source = source,
            demoShopId = null,
        )

        voiceDemoMailService.sendMagicLink(normalizedEmail, token, expiresAt)

        return DemoAccessResponse(
            message = "Check your email — we sent a link to open the voice demo.",
        )
    }

    companion object {
        const val SOURCE_USER = "demo-access"
        const val SOURCE_ADMIN = "admin-invite"
        private val ALLOWED_SOURCES = setOf(SOURCE_USER, SOURCE_ADMIN)
    }
}

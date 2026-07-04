package com.vedanova.platform.api.service

import com.vedanova.platform.config.AvipProperties
import org.slf4j.LoggerFactory
import org.springframework.mail.SimpleMailMessage
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.stereotype.Service
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@Service
class PortalMailService(
    private val mailSender: JavaMailSender,
    private val avipProperties: AvipProperties,
) {
    fun sendMagicLink(email: String, token: String, expiresAt: Instant) {
        val appUrl = avipProperties.appUrl.trim().trimEnd('/').ifEmpty { "http://localhost:5173" }
        val link = "$appUrl/portal?access=$token"
        val expiresLabel =
            DateTimeFormatter.ofPattern("MMM d, yyyy 'at' HH:mm z")
                .withZone(ZoneId.systemDefault())
                .format(expiresAt)

        val subject = "Sign in to your AVIP account"
        val body =
            """
            Hi,

            Use this link to sign in to your AVIP customer portal:

            $link

            This link expires $expiresLabel. If you did not request this email, you can ignore it.

            — AVIP
            """.trimIndent()

        if (!avipProperties.mail.enabled) {
            log.info("Mail disabled — portal login link for {}: {}", email, link)
            return
        }

        try {
            val message =
                SimpleMailMessage().apply {
                    from = avipProperties.mail.from
                    setTo(email)
                    setSubject(subject)
                    text = body
                }
            mailSender.send(message)
            log.info("Sent portal magic link to {}", email)
        } catch (ex: Exception) {
            log.warn("Failed to send portal email to {} — open this link manually: {}", email, link, ex)
        }
    }

    companion object {
        private val log = LoggerFactory.getLogger(PortalMailService::class.java)
    }
}

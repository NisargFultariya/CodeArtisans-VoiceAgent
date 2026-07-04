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
class VoiceDemoMailService(
    private val mailSender: JavaMailSender,
    private val avipProperties: AvipProperties,
) {
    fun sendMagicLink(email: String, token: String, expiresAt: Instant) {
        val appUrl = avipProperties.appUrl.trim().trimEnd('/').ifEmpty { "http://localhost:3000" }
        val link = "$appUrl/demo?access=$token"
        val expiresLabel =
            DateTimeFormatter.ofPattern("MMM d, yyyy 'at' HH:mm z")
                .withZone(ZoneId.systemDefault())
                .format(expiresAt)

        val subject = "Your AVIP voice demo link"
        val body =
            """
            Hi,

            Use this link to open the hold-to-talk voice demo:

            $link

            This link expires $expiresLabel.

            — AVIP
            """.trimIndent()

        if (!avipProperties.mail.enabled) {
            log.info("Mail disabled — voice demo link for {}: {}", email, link)
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
            log.info("Sent voice demo magic link to {}", email)
        } catch (ex: Exception) {
            // Keep the invite successful when SMTP is down (common in local dev without Mailpit).
            log.warn("Failed to send voice demo email to {} — open this link manually: {}", email, link, ex)
        }
    }

    companion object {
        private val log = LoggerFactory.getLogger(VoiceDemoMailService::class.java)
    }
}

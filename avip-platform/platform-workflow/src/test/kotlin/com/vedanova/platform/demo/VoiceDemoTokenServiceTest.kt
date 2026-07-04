package com.vedanova.platform.demo

import com.vedanova.platform.config.AvipProperties
import com.vedanova.platform.config.VoiceDemoProperties
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import java.time.Instant

class VoiceDemoTokenServiceTest {
    private val service =
        VoiceDemoTokenService(
            AvipProperties(
                voiceDemo = VoiceDemoProperties(tokenSecret = "voice-demo-test-secret"),
            ),
        )

    @Test
    fun `issue and validate demo token`() {
        val expiresAt = Instant.now().plusSeconds(3600)
        val token = service.issue("req-1", "user@example.com", expiresAt)
        val claims = service.validate(token)

        assertNotNull(claims)
        assertEquals("req-1", claims?.requestId)
        assertEquals("user@example.com", claims?.email)
    }

    @Test
    fun `expired token is rejected`() {
        val token = service.issue("req-1", "user@example.com", Instant.now().minusSeconds(60))
        assertNull(service.validate(token))
    }
}

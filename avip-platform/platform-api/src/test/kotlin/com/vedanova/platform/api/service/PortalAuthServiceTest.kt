package com.vedanova.platform.api.service

import com.vedanova.platform.config.AvipProperties
import com.vedanova.platform.config.PortalProperties
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.springframework.web.server.ResponseStatusException

class PortalAuthServiceTest {
    private fun service(sessionSecret: String = "portal-test-secret") =
        PortalAuthService(
            AvipProperties(
                internalSecret = "internal",
                portal = PortalProperties(sessionSecret = sessionSecret, sessionTtlHours = 24),
            ),
        )

    @Test
    fun `issueSession validates round trip`() {
        val auth = service()
        val (token, expiresAt) = auth.issueSession("user1", "acct1", "owner")
        val session = auth.validateSession(token)
        assertEquals("user1", session.userId)
        assertEquals("acct1", session.accountId)
        assertEquals("owner", session.role)
        assertEquals(expiresAt.epochSecond, session.expiresAt.epochSecond)
    }

    @Test
    fun `validateSession rejects tampered token`() {
        val auth = service()
        val (token, _) = auth.issueSession("user1", "acct1", "owner")
        val tampered = token.dropLast(4) + "xxxx"
        assertThrows(ResponseStatusException::class.java) {
            auth.validateSession(tampered)
        }
    }
}

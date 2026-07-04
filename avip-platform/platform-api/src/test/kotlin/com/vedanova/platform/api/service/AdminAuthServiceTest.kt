package com.vedanova.platform.api.service

import com.vedanova.platform.config.AdminProperties
import com.vedanova.platform.config.AvipProperties
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.springframework.web.server.ResponseStatusException

class AdminAuthServiceTest {
    private fun service(
        username: String = "admin",
        password: String = "secret",
        sessionSecret: String = "test-session-secret",
    ) = AdminAuthService(
        AvipProperties(
            internalSecret = "internal",
            admin =
                AdminProperties(
                    username = username,
                    password = password,
                    sessionSecret = sessionSecret,
                    sessionTtlHours = 24,
                ),
        ),
    )

    @Test
    fun `login issues token that validates`() {
        val auth = service()
        val (token, _) = auth.login("admin", "secret")
        assertEquals("admin", auth.validateToken(token))
    }

    @Test
    fun `login rejects invalid credentials`() {
        val auth = service()
        assertThrows(ResponseStatusException::class.java) {
            auth.login("admin", "wrong")
        }
    }

    @Test
    fun `login disabled when password blank`() {
        val auth = service(password = "")
        assertThrows(ResponseStatusException::class.java) {
            auth.login("admin", "secret")
        }
    }

    @Test
    fun `validateToken rejects malformed token`() {
        val auth = service()
        assertThrows(ResponseStatusException::class.java) {
            auth.validateToken("not-a-jwt")
        }
    }

    @Test
    fun `validateToken rejects tampered signature`() {
        val auth = service()
        val (token, _) = auth.login("admin", "secret")
        val tampered = token.dropLast(4) + "xxxx"
        assertThrows(ResponseStatusException::class.java) {
            auth.validateToken(tampered)
        }
    }
}

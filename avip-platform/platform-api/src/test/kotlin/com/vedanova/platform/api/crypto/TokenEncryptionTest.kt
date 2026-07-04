package com.vedanova.platform.crypto

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows

class TokenEncryptionTest {
    @Test
    fun `round trip encrypt and decrypt`() {
        val secret = "test-secret-key"
        val plain = "shpat_test_token_12345"
        val encoded = TokenEncryption.encrypt(plain, secret)
        val decoded = TokenEncryption.decrypt(encoded, secret)
        assertEquals(plain, decoded)
    }

    @Test
    fun `wrong secret fails decrypt`() {
        val encoded = TokenEncryption.encrypt("token", "secret-a")
        assertThrows<Exception> {
            TokenEncryption.decrypt(encoded, "secret-b")
        }
    }
}

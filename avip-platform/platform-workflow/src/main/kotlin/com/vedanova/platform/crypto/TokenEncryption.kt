package com.vedanova.platform.crypto

import java.security.SecureRandom
import java.util.Base64
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

/**
 * AES-256-GCM token encryption compatible with legacy Go/Node layout (iv|tag|ciphertext).
 */
object TokenEncryption {
    private const val IV_LENGTH = 12
    private const val TAG_LENGTH = 16

    fun keyFromSecret(secret: String): ByteArray =
        java.security.MessageDigest.getInstance("SHA-256")
            .digest(secret.toByteArray(Charsets.UTF_8))

    fun encrypt(plain: String, secret: String): String {
        val key = keyFromSecret(secret)
        val iv = ByteArray(IV_LENGTH)
        SecureRandom().nextBytes(iv)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, SecretKeySpec(key, "AES"), GCMParameterSpec(128, iv))
        val sealed = cipher.doFinal(plain.toByteArray(Charsets.UTF_8))
        val tag = sealed.copyOfRange(sealed.size - TAG_LENGTH, sealed.size)
        val ciphertext = sealed.copyOfRange(0, sealed.size - TAG_LENGTH)
        val out = iv + tag + ciphertext
        return Base64.getEncoder().encodeToString(out)
    }

    fun decrypt(encoded: String, secret: String): String {
        val key = keyFromSecret(secret)
        val buf = Base64.getDecoder().decode(encoded)
        require(buf.size >= IV_LENGTH + TAG_LENGTH) { "invalid encrypted token" }
        val iv = buf.copyOfRange(0, IV_LENGTH)
        val tag = buf.copyOfRange(IV_LENGTH, IV_LENGTH + TAG_LENGTH)
        val data = buf.copyOfRange(IV_LENGTH + TAG_LENGTH, buf.size)
        val ciphertext = data + tag
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.DECRYPT_MODE, SecretKeySpec(key, "AES"), GCMParameterSpec(128, iv))
        return String(cipher.doFinal(ciphertext), Charsets.UTF_8)
    }

    fun encryptionSecret(tokenEncryptionKey: String, shopifyApiSecret: String = ""): String {
        if (tokenEncryptionKey.isNotBlank()) return tokenEncryptionKey
        if (shopifyApiSecret.isNotBlank()) return shopifyApiSecret
        throw IllegalStateException("TOKEN_ENCRYPTION_KEY or SHOPIFY_API_SECRET required")
    }
}

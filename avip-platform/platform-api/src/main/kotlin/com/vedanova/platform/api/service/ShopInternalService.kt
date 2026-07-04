package com.vedanova.platform.api.service

import com.vedanova.platform.crypto.TokenEncryption
import com.vedanova.platform.persistence.Shop
import com.vedanova.platform.persistence.ShopRepository
import com.vedanova.platform.config.AvipProperties
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException

@Service
class ShopInternalService(
    private val shopRepository: ShopRepository,
    private val avipProperties: AvipProperties,
) {
    fun requireShop(domain: String): Shop {
        val trimmed = domain.trim()
        if (trimmed.isEmpty()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "shopDomain required")
        }
        return shopRepository.getByDomain(trimmed)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "shop not found")
    }

    fun findShop(domain: String): Shop? {
        val trimmed = domain.trim()
        if (trimmed.isEmpty()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "shopDomain required")
        }
        return shopRepository.getByDomain(trimmed)
    }

    fun upsertFromOAuth(domain: String, accessToken: String, scopes: String): Shop {
        val shopDomain = domain.trim()
        val token = accessToken.trim()
        if (shopDomain.isEmpty() || token.isEmpty()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "shopDomain and accessToken required")
        }
        val secret =
            try {
                TokenEncryption.encryptionSecret(avipProperties.tokenEncryptionKey)
            } catch (ex: IllegalStateException) {
                throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "upsert failed", ex)
            }
        val encrypted =
            try {
                TokenEncryption.encrypt(token, secret)
            } catch (ex: Exception) {
                throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "upsert failed", ex)
            }
        return try {
            shopRepository.upsertOAuth(shopDomain, encrypted, scopes)
        } catch (ex: Exception) {
            throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "upsert failed", ex)
        }
    }

    fun registerShopWebhooks(shopId: String) {
        if (avipProperties.appUrl.isBlank()) return
        log.info("webhook registration deferred for shop {} (Shopify client not ported yet)", shopId)
    }

    fun getOrCreateDevShop(domain: String): Shop {
        val shopDomain = domain.trim()
        if (shopDomain.isEmpty()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "shop domain required")
        }
        findShop(shopDomain)?.let { return it }
        val token = System.getenv("SHOPIFY_ACCESS_TOKEN")?.trim().orEmpty()
        val encrypted =
            if (token.isNotEmpty()) {
                try {
                    val secret = TokenEncryption.encryptionSecret(avipProperties.tokenEncryptionKey)
                    TokenEncryption.encrypt(token, secret)
                } catch (ex: Exception) {
                    throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "dev shop setup failed", ex)
                }
            } else {
                null
            }
        return try {
            shopRepository.ensureShop(shopDomain, encrypted)
        } catch (ex: Exception) {
            throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "dev shop setup failed", ex)
        }
    }

    fun devShopDomain(): String = avipProperties.devShopDomain.trim().ifEmpty { DEFAULT_DEV_SHOP_DOMAIN }

    companion object {
        private val log = LoggerFactory.getLogger(ShopInternalService::class.java)
        private const val DEFAULT_DEV_SHOP_DOMAIN = "avip-store-ioj9xku3.myshopify.com"
    }
}

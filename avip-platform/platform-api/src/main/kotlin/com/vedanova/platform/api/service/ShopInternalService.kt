package com.vedanova.platform.api.service

import com.vedanova.platform.persistence.Shop
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException

@Service
class ShopInternalService {
    fun requireShop(domain: String): Shop {
        val trimmed = domain.trim()
        if (trimmed.isEmpty()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "shopDomain required")
        }
        return Shop(id = "dummy-shop-id", shopDomain = trimmed)
    }

    fun findShop(domain: String): Shop? {
        val trimmed = domain.trim()
        if (trimmed.isEmpty()) {
            return null
        }
        return Shop(id = "dummy-shop-id", shopDomain = trimmed)
    }

    fun upsertFromOAuth(domain: String, accessToken: String, scopes: String): Shop {
        return Shop(id = "dummy-shop-id", shopDomain = domain)
    }

    fun registerShopWebhooks(shopId: String) {
        // Shopify webhooks disabled. No-op.
    }

    fun getOrCreateDevShop(domain: String): Shop {
        val shopDomain = domain.trim()
        return Shop(id = "dummy-shop-id", shopDomain = shopDomain)
    }

    fun devShopDomain(): String = DEFAULT_DEV_SHOP_DOMAIN

    companion object {
        private const val DEFAULT_DEV_SHOP_DOMAIN = "dummy-store.myshopify.com"
    }
}

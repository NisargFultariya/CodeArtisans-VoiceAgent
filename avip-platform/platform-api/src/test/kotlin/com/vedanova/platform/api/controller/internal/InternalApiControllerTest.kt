package com.vedanova.platform.api.controller.internal

import com.vedanova.platform.api.dto.PreferencesBody
import com.vedanova.platform.api.dto.PromptBody
import com.vedanova.platform.api.dto.UpsertShopRequest
import com.vedanova.platform.api.service.CallTriggerService
import com.vedanova.platform.api.service.ShopInternalService
import com.vedanova.platform.persistence.AnalyticsRepository
import com.vedanova.platform.persistence.CallRepository
import com.vedanova.platform.persistence.ComplianceRepository
import com.vedanova.platform.persistence.EscalationRepository
import com.vedanova.platform.persistence.PreferencesRepository
import com.vedanova.platform.persistence.PromptRepository
import com.vedanova.platform.persistence.Shop
import com.vedanova.platform.persistence.ShopAnalytics
import com.vedanova.platform.persistence.ShopPreferences
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.springframework.web.server.ResponseStatusException
import java.time.Instant

class InternalApiControllerTest {
    private val shopInternalService: ShopInternalService = mock()
    private val callTriggerService: CallTriggerService = mock()
    private val callRepository: CallRepository = mock()
    private val preferencesRepository: PreferencesRepository = mock()
    private val promptRepository: PromptRepository = mock()
    private val analyticsRepository: AnalyticsRepository = mock()
    private val escalationRepository: EscalationRepository = mock()
    private val complianceRepository: ComplianceRepository = mock()

    private val controller =
        InternalApiController(
            shopInternalService,
            callTriggerService,
            callRepository,
            preferencesRepository,
            promptRepository,
            analyticsRepository,
            escalationRepository,
            complianceRepository,
        )

    @Test
    fun `analytics returns 404 for missing shop`() {
        whenever(shopInternalService.requireShop("missing.myshopify.com"))
            .thenThrow(ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "shop not found"))

        assertThrows<ResponseStatusException> {
            controller.analytics("missing.myshopify.com")
        }
    }

    @Test
    fun `list calls returns empty when shop missing`() {
        whenever(shopInternalService.findShop("unknown.myshopify.com")).thenReturn(null)

        val response = controller.listCalls("unknown.myshopify.com", 30)

        assert(response.ok)
        assert(response.calls.isEmpty())
    }

    @Test
    fun `upsert shop delegates to service`() {
        val shop = Shop(id = "shop-1", shopDomain = "test.myshopify.com")
        whenever(shopInternalService.upsertFromOAuth("test.myshopify.com", "token", "read_orders"))
            .thenReturn(shop)

        val response =
            controller.upsertShop(
                UpsertShopRequest(
                    shopDomain = "test.myshopify.com",
                    accessToken = "token",
                    scopes = "read_orders",
                ),
            )

        assert(response.ok)
        assert(response.id == "shop-1")
        verify(shopInternalService).registerShopWebhooks("shop-1")
    }

    @Test
    fun `get preferences returns defaults when none saved`() {
        val shop = Shop(id = "shop-1", shopDomain = "test.myshopify.com")
        whenever(shopInternalService.requireShop("test.myshopify.com")).thenReturn(shop)
        whenever(preferencesRepository.get("shop-1")).thenReturn(null)

        val response = controller.getPreferences("test.myshopify.com")

        assert(response.ok)
        assert(response.preferences.defaultLanguage == "hi-IN")
    }

    @Test
    fun `put prompt rejects blank system prompt`() {
        val shop = Shop(id = "shop-1", shopDomain = "test.myshopify.com")
        whenever(shopInternalService.requireShop("test.myshopify.com")).thenReturn(shop)

        assertThrows<ResponseStatusException> {
            controller.putPrompt("test.myshopify.com", PromptBody(systemPrompt = "  "))
        }
    }

    @Test
    fun `analytics computes recovery rate`() {
        val shop = Shop(id = "shop-1", shopDomain = "test.myshopify.com")
        whenever(shopInternalService.requireShop("test.myshopify.com")).thenReturn(shop)
        whenever(analyticsRepository.shopAnalytics("shop-1"))
            .thenReturn(
                ShopAnalytics(
                    totalCalls = 4,
                    completedCalls = 3,
                    callsThisMonth = 2,
                    avgDurationSeconds = 45.0,
                    openEscalations = 1,
                ),
            )

        val response = controller.analytics("test.myshopify.com")

        assert(response.recoveryRate == "75%")
        assert(response.openEscalations == 1L)
    }

    @Test
    fun `put preferences saves and returns body`() {
        val shop = Shop(id = "shop-1", shopDomain = "test.myshopify.com")
        val updatedAt = Instant.parse("2026-06-19T10:00:00Z")
        whenever(shopInternalService.requireShop("test.myshopify.com")).thenReturn(shop)
        whenever(preferencesRepository.upsert(any())).thenReturn(
            ShopPreferences(
                shopId = "shop-1",
                defaultLanguage = "en-IN",
                autoWebhook = true,
                escalationEmailEnabled = false,
                updatedAt = updatedAt,
            ),
        )

        val response =
            controller.putPreferences(
                "test.myshopify.com",
                PreferencesBody(
                    defaultLanguage = "en-IN",
                    autoWebhook = true,
                    escalationEmailEnabled = false,
                ),
            )

        assert(response.preferences.defaultLanguage == "en-IN")
        assert(response.updatedAt == updatedAt.toString())
    }
}

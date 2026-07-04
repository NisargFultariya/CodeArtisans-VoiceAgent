package com.vedanova.platform.api.service

import com.vedanova.platform.api.dto.CreateDemoRequestBody
import com.vedanova.platform.persistence.DemoRequestRow
import com.vedanova.platform.persistence.DemoRequestRepository
import com.vedanova.platform.persistence.Shop
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.mockito.kotlin.anyOrNull
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.springframework.web.server.ResponseStatusException
import java.time.Instant

class DemoRequestServiceTest {
    private val demoRequestRepository: DemoRequestRepository = mock()
    private val shopInternalService: ShopInternalService = mock()
    private val service = DemoRequestService(demoRequestRepository, shopInternalService)

    @Test
    fun `book demo creates shop and stores lead`() {
        whenever(shopInternalService.getOrCreateDevShop("cool.myshopify.com"))
            .thenReturn(Shop(id = "shop-1", shopDomain = "cool.myshopify.com"))
        whenever(
            demoRequestRepository.insert(
                id = org.mockito.kotlin.any(),
                email = eq("ops@cool.com"),
                fullName = anyOrNull(),
                company = anyOrNull(),
                shopDomain = eq("cool.myshopify.com"),
                monthlyVolume = eq("2k orders"),
                message = anyOrNull(),
                source = eq("book-demo"),
                demoShopId = eq("shop-1"),
            ),
        ).thenReturn(demoRow("req-1"))

        val response =
            service.create(
                CreateDemoRequestBody(
                    email = "ops@cool.com",
                    shopDomain = "cool.myshopify.com",
                    monthlyVolume = "2k orders",
                ),
            )

        assertEquals("req-1", response.requestId)
        verify(shopInternalService).getOrCreateDevShop("cool.myshopify.com")
    }

    @Test
    fun `contact requires message`() {
        assertThrows(ResponseStatusException::class.java) {
            service.create(
                CreateDemoRequestBody(
                    email = "hello@brand.com",
                    source = "contact",
                ),
            )
        }
    }

    private fun demoRow(id: String) =
        DemoRequestRow(
            id = id,
            email = "ops@cool.com",
            shopDomain = "cool.myshopify.com",
            source = "book-demo",
            status = "new",
            demoShopId = "shop-1",
            createdAt = Instant.parse("2026-01-01T00:00:00Z"),
            updatedAt = Instant.parse("2026-01-01T00:00:00Z"),
        )
}

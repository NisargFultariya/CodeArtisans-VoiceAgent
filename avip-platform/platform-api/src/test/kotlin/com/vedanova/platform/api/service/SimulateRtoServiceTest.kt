package com.vedanova.platform.api.service

import com.vedanova.platform.api.dto.TriggerCallResponse
import com.vedanova.platform.config.AvipProperties
import com.vedanova.platform.persistence.Shop
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.springframework.http.HttpStatus
import org.springframework.web.server.ResponseStatusException

class SimulateRtoServiceTest {
    private val avipProperties =
        AvipProperties(
            simulationEnabled = true,
            devShopDomain = "dev.myshopify.com",
        )
    private val shopInternalService: ShopInternalService = mock()
    private val callTriggerService: CallTriggerService = mock()
    private val service =
        SimulateRtoService(avipProperties, shopInternalService, callTriggerService)

    @Test
    fun `simulate creates dev shop and triggers simulation workflow`() {
        whenever(shopInternalService.getOrCreateDevShop("dev.myshopify.com"))
            .thenReturn(Shop(id = "shop-1", shopDomain = "dev.myshopify.com"))
        whenever(callTriggerService.trigger(any()))
            .thenReturn(
                TriggerCallResponse(
                    workflowId = "call-shop-1-order-1",
                    orderId = "order-1",
                    simulation = true,
                    shopId = "shop-1",
                ),
            )

        val response = service.simulateRto("order-1", null)

        assert(response.ok)
        assert(response.simulation)
        assert(response.workflowId == "call-shop-1-order-1")
        verify(callTriggerService).trigger(
            org.mockito.kotlin.check {
                assert(it.shopDomain == "dev.myshopify.com")
                assert(it.orderId == "order-1")
                assert(it.simulation == true)
                assert(it.forceNew == true)
            },
        )
    }

    @Test
    fun `simulate rejects when disabled`() {
        val disabled =
            SimulateRtoService(
                avipProperties.copy(simulationEnabled = false),
                shopInternalService,
                callTriggerService,
            )

        val ex =
            assertThrows<ResponseStatusException> {
                disabled.simulateRto("order-1", null)
            }
        assert(ex.statusCode == HttpStatus.NOT_FOUND)
    }

    @Test
    fun `simulate requires order id`() {
        val ex =
            assertThrows<ResponseStatusException> {
                service.simulateRto("", null)
            }
        assert(ex.statusCode == HttpStatus.BAD_REQUEST)
    }
}

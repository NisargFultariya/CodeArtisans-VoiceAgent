package com.vedanova.platform.api.service

import com.vedanova.platform.api.dto.SimulateRtoResponse
import com.vedanova.platform.api.dto.TriggerCallRequest
import com.vedanova.platform.config.AvipProperties
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException

@Service
class SimulateRtoService(
    private val avipProperties: AvipProperties,
    private val shopInternalService: ShopInternalService,
    private val callTriggerService: CallTriggerService,
) {
    fun simulateRto(orderId: String?, shopDomain: String?): SimulateRtoResponse {
        if (!avipProperties.simulationEnabled) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "simulation disabled")
        }
        val normalizedOrderId = CallTriggerService.normalizeOrderId(orderId?.trim().orEmpty())
        if (normalizedOrderId.isEmpty()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "orderId required")
        }
        val domain = shopDomain?.trim()?.ifEmpty { null } ?: avipProperties.devShopDomain.trim().ifEmpty { DEFAULT_DEV_SHOP_DOMAIN }
        shopInternalService.getOrCreateDevShop(domain)
        val response =
            callTriggerService.trigger(
                TriggerCallRequest(
                    shopDomain = domain,
                    orderId = normalizedOrderId,
                    simulation = true,
                    forceNew = true,
                ),
            )
        return SimulateRtoResponse(
            workflowId = response.workflowId,
            simulation = true,
        )
    }

    companion object {
        private const val DEFAULT_DEV_SHOP_DOMAIN = "avip-store-ioj9xku3.myshopify.com"
    }
}

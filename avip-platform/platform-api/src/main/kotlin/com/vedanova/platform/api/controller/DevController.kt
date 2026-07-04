package com.vedanova.platform.api.controller

import com.vedanova.platform.api.dto.SimulateRtoResponse
import com.vedanova.platform.api.service.SimulateRtoService
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/dev")
class DevController(
    private val simulateRtoService: SimulateRtoService,
) {
    @PostMapping("/simulate-rto")
    fun simulateRto(
        @RequestParam orderId: String?,
        @RequestParam shop: String?,
        @RequestBody(required = false) body: SimulateRtoBody?,
    ): SimulateRtoResponse {
        var resolvedOrderId = orderId?.trim().orEmpty()
        if (resolvedOrderId.isEmpty()) {
            resolvedOrderId = body?.orderId?.trim().orEmpty()
        }
        return simulateRtoService.simulateRto(resolvedOrderId, shop)
    }
}

data class SimulateRtoBody(
    val orderId: String = "",
)

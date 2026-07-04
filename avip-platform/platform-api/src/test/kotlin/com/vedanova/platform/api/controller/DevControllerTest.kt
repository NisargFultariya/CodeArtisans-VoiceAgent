package com.vedanova.platform.api.controller

import com.vedanova.platform.api.dto.SimulateRtoResponse
import com.vedanova.platform.api.dto.TriggerCallResponse
import com.vedanova.platform.api.service.SimulateRtoService
import com.vedanova.platform.config.AvipProperties
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import org.springframework.http.HttpStatus
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import org.springframework.web.server.ResponseStatusException

class DevControllerTest {
    private val simulateRtoService: SimulateRtoService = mock()
    private val mockMvc: MockMvc =
        MockMvcBuilders.standaloneSetup(DevController(simulateRtoService)).build()

    @Test
    fun `simulate-rto returns workflow id`() {
        whenever(simulateRtoService.simulateRto("order-1", "test.myshopify.com"))
            .thenReturn(
                SimulateRtoResponse(
                    workflowId = "call-shop-order-1",
                    simulation = true,
                ),
            )

        mockMvc.perform(
            post("/dev/simulate-rto")
                .param("orderId", "order-1")
                .param("shop", "test.myshopify.com"),
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.ok").value(true))
            .andExpect(jsonPath("$.workflowId").value("call-shop-order-1"))
            .andExpect(jsonPath("$.simulation").value(true))
    }

    @Test
    fun `simulate-rto accepts order id in json body`() {
        whenever(simulateRtoService.simulateRto("body-order", null))
            .thenReturn(
                SimulateRtoResponse(
                    workflowId = "call-body",
                    simulation = true,
                ),
            )

        mockMvc.perform(
            post("/dev/simulate-rto")
                .contentType("application/json")
                .content("""{"orderId":"body-order"}"""),
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.workflowId").value("call-body"))
    }

    @Test
    fun `simulate-rto returns 404 when simulation disabled`() {
        whenever(simulateRtoService.simulateRto("order-1", null))
            .thenThrow(ResponseStatusException(HttpStatus.NOT_FOUND, "simulation disabled"))

        mockMvc.perform(post("/dev/simulate-rto").param("orderId", "order-1"))
            .andExpect(status().isNotFound)
    }
}

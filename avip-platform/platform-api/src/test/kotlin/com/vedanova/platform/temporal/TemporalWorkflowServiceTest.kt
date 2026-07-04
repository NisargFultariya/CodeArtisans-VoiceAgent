package com.vedanova.platform.temporal

import com.vedanova.platform.contracts.CallLifecycleInput
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class TemporalWorkflowServiceTest {
    @Test
    fun `buildCallWorkflowId uses idempotency key when set`() {
        val input =
            CallLifecycleInput(
                shopId = "shop-1",
                orderId = "order-1",
                idempotencyKey = "shop-1-order-1",
            )
        assertEquals("call-shop-1-order-1", TemporalWorkflowService.buildCallWorkflowId(input))
    }

    @Test
    fun `buildCallWorkflowId falls back to shop and order`() {
        val input =
            CallLifecycleInput(
                shopId = "shop-1",
                orderId = "order-1",
            )
        assertEquals("call-shop-1-order-1", TemporalWorkflowService.buildCallWorkflowId(input))
    }
}

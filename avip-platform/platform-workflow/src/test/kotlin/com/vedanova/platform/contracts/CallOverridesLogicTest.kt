package com.vedanova.platform.contracts

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class CallOverridesLogicTest {
    @Test
    fun `apply merges objective into system prompt`() {
        val shop = ShopConfig("s1", "test.myshopify.com", "Base prompt")
        val order = ShopifyOrderContext(orderId = "1", language = "")
        val (updatedShop, updatedOrder) =
            CallOverridesLogic.apply(
                shop,
                order,
                CallOverrides(objective = CallObjective.GET_REASON),
            )
        assertEquals(true, updatedShop.systemPrompt.contains("Primary goal"))
        assertEquals("hi-IN", updatedOrder.language)
    }
}

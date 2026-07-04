package com.vedanova.platform.contracts

object Simulation {
    fun fakeOrderContext(orderId: String): ShopifyOrderContext =
        ShopifyOrderContext(
            orderId = orderId,
            orderName = "#SIM-$orderId",
            customerId = "sim-customer",
            customerName = "Sim Customer",
            customerPhone = "+919999999999",
            customerEmail = "sim@example.com",
            address =
                OrderAddress(
                    line1 = "123 Test Street",
                    city = "Mumbai",
                    state = "MH",
                    postalCode = "400001",
                ),
            language = "hi-IN",
            attemptNumber = 1,
            failureReason = "Simulated delivery failure",
            createdAt = "2026-01-01T00:00:00Z",
            updatedAt = "2026-01-01T00:00:00Z",
        )
}

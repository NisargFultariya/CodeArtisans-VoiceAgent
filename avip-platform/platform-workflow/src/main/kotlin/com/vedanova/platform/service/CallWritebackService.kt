package com.vedanova.platform.service

import com.vedanova.platform.contracts.CallCompletedPayload
import com.vedanova.platform.contracts.ShopifyOrderContext
import org.springframework.stereotype.Service

@Service
class CallWritebackService {
    fun writebackCompleted(
        shopId: String,
        orderContext: ShopifyOrderContext,
        payload: CallCompletedPayload,
    ) {
        // Shopify writeback removed. No-op.
    }
}

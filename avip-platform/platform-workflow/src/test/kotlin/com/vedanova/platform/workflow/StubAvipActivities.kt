package com.vedanova.platform.workflow

import com.vedanova.platform.activity.AvipActivities
import com.vedanova.platform.contracts.AttachRecordingInput
import com.vedanova.platform.contracts.CallLifecycleInput
import com.vedanova.platform.contracts.DialComplianceInput
import com.vedanova.platform.contracts.DialComplianceResult
import com.vedanova.platform.contracts.DispatchCallResult
import com.vedanova.platform.contracts.DispatchParams
import com.vedanova.platform.contracts.EscalationParams
import com.vedanova.platform.contracts.ShopConfig
import com.vedanova.platform.contracts.ShopifyOrderContext
import com.vedanova.platform.contracts.UpdateCallStatusActivityInput
import com.vedanova.platform.contracts.WritebackParams

class StubAvipActivities : AvipActivities {
    var fetchCalled = false
    var writebackCalled = false

    var loadShopConfigResult: ShopConfig = ShopConfig("", "", "")
    var fetchOrderContextResult: ShopifyOrderContext = ShopifyOrderContext(orderId = "")
    var dispatchResult: DispatchCallResult = DispatchCallResult("", "", "", "")

    override fun pingActivity(name: String): String = "hello, $name"

    override fun loadShopConfig(shopId: String): ShopConfig = loadShopConfigResult

    override fun fetchOrderContext(shopId: String, orderId: String): ShopifyOrderContext {
        fetchCalled = true
        return fetchOrderContextResult
    }

    override fun dispatchLivekitAgent(params: DispatchParams): DispatchCallResult = dispatchResult

    override fun recordCallStarted(input: CallLifecycleInput, roomName: String, workflowId: String): String = "call-1"

    override fun dialCustomerPstn(roomName: String, customerPhone: String) {}

    override fun checkDialCompliance(input: DialComplianceInput): DialComplianceResult =
        DialComplianceResult(allowed = true, ndrStage = "ndr-1")

    override fun attachRecordingPlaceholder(input: AttachRecordingInput): String =
        "recordings/${input.shopId}/${input.orderId}.wav"

    override fun updateCallStatus(input: UpdateCallStatusActivityInput) {}

    override fun createEscalationRecord(params: EscalationParams) {}

    override fun writebackShopifyAttempt(params: WritebackParams) {
        writebackCalled = true
    }
}

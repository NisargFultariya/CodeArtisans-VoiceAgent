package com.vedanova.platform.activity

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
import io.temporal.activity.ActivityInterface
import io.temporal.activity.ActivityMethod

@ActivityInterface
interface AvipActivities {
    @ActivityMethod(name = "PingActivity")
    fun pingActivity(name: String): String

    @ActivityMethod(name = "LoadShopConfig")
    fun loadShopConfig(shopId: String): ShopConfig

    @ActivityMethod(name = "FetchOrderContext")
    fun fetchOrderContext(shopId: String, orderId: String): ShopifyOrderContext

    @ActivityMethod(name = "DispatchLivekitAgent")
    fun dispatchLivekitAgent(params: DispatchParams): DispatchCallResult

    @ActivityMethod(name = "RecordCallStarted")
    fun recordCallStarted(input: CallLifecycleInput, roomName: String, workflowId: String): String

    @ActivityMethod(name = "DialCustomerPstn")
    fun dialCustomerPstn(roomName: String, customerPhone: String)

    @ActivityMethod(name = "CheckDialCompliance")
    fun checkDialCompliance(input: DialComplianceInput): DialComplianceResult

    @ActivityMethod(name = "AttachRecordingPlaceholder")
    fun attachRecordingPlaceholder(input: AttachRecordingInput): String

    @ActivityMethod(name = "UpdateCallStatus")
    fun updateCallStatus(input: UpdateCallStatusActivityInput)

    @ActivityMethod(name = "CreateEscalationRecord")
    fun createEscalationRecord(params: EscalationParams)

    @ActivityMethod(name = "WritebackShopifyAttempt")
    fun writebackShopifyAttempt(params: WritebackParams)
}

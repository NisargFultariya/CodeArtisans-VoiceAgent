package com.vedanova.platform.activity

import com.vedanova.platform.compliance.ComplianceService
import com.vedanova.platform.config.AvipProperties
import com.vedanova.platform.contracts.AttachRecordingInput
import com.vedanova.platform.contracts.CallLifecycleInput
import com.vedanova.platform.contracts.DialComplianceInput
import com.vedanova.platform.contracts.DialComplianceResult
import com.vedanova.platform.contracts.DispatchCallResult
import com.vedanova.platform.contracts.DispatchParams
import com.vedanova.platform.contracts.EscalationParams
import com.vedanova.platform.contracts.ShopConfig
import com.vedanova.platform.contracts.ShopifyOrderContext
import com.vedanova.platform.contracts.Simulation
import com.vedanova.platform.contracts.UpdateCallStatusActivityInput
import com.vedanova.platform.contracts.WritebackParams
import com.vedanova.platform.livekit.LiveKitTelephonyAdapter
import com.vedanova.platform.persistence.CallRepository
import com.vedanova.platform.persistence.EscalationRepository
import com.vedanova.platform.service.ShopConfigService
import com.vedanova.platform.storage.RecordingStorage
import com.vedanova.platform.telephony.TelephonyAdapter
import org.springframework.stereotype.Component

@Component
class AvipActivitiesImpl(
    private val shopConfigService: ShopConfigService,
    private val liveKitTelephonyAdapter: LiveKitTelephonyAdapter,
    private val telephonyAdapter: TelephonyAdapter,
    private val callRepository: CallRepository,
    private val escalationRepository: EscalationRepository,
    private val complianceService: ComplianceService,
    private val recordingStorage: RecordingStorage,
    private val avipProperties: AvipProperties,
) : AvipActivities {
    override fun pingActivity(name: String): String = "hello, $name"

    override fun loadShopConfig(shopId: String): ShopConfig = shopConfigService.loadConfig(shopId)

    override fun fetchOrderContext(shopId: String, orderId: String): ShopifyOrderContext {
        // Return a mock simulated context since Shopify integrations are removed
        return Simulation.fakeOrderContext(orderId)
    }

    override fun dispatchLivekitAgent(params: DispatchParams): DispatchCallResult =
        liveKitTelephonyAdapter.dispatchAgent(params)

    override fun recordCallStarted(
        input: CallLifecycleInput,
        roomName: String,
        workflowId: String,
    ): String = callRepository.upsertDispatching(input.shopId, input.orderId, workflowId, roomName)

    override fun dialCustomerPstn(roomName: String, customerPhone: String) {
        telephonyAdapter.dialOutbound(roomName, customerPhone)
    }

    override fun checkDialCompliance(input: DialComplianceInput): DialComplianceResult {
        val result = complianceService.checkDial(input)
        if (result.allowed) {
            callRepository.updateNdrStage(input.shopId, input.orderId, result.ndrStage)
        }
        return result
    }

    override fun attachRecordingPlaceholder(input: AttachRecordingInput): String {
        val key = recordingStorage.objectKey(input.shopId, input.orderId)
        callRepository.attachRecordingKey(input.shopId, input.orderId, key)
        return key
    }

    override fun updateCallStatus(input: UpdateCallStatusActivityInput) {
        callRepository.updateStatus(
            shopId = input.shopId,
            orderId = input.orderId,
            status = input.status,
            outcome = input.outcome.takeIf { it.isNotBlank() },
            durationSeconds = input.durationSeconds,
        )
    }

    override fun createEscalationRecord(params: EscalationParams) {
        escalationRepository.create(params.shopId, params.orderId, params.reason)
    }

    override fun writebackShopifyAttempt(params: WritebackParams) {
        // Shopify writeback removed. No-op.
    }
}

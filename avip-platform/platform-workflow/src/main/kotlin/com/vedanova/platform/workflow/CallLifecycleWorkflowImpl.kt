package com.vedanova.platform.workflow

import com.vedanova.platform.activity.AvipActivities
import com.vedanova.platform.contracts.CallCompletedPayload
import com.vedanova.platform.contracts.CallLifecycleInput
import com.vedanova.platform.contracts.CallOverridesLogic
import com.vedanova.platform.contracts.CallStatus
import com.vedanova.platform.contracts.DialComplianceInput
import com.vedanova.platform.contracts.AttachRecordingInput
import com.vedanova.platform.contracts.DispatchParams
import com.vedanova.platform.contracts.EscalateSignalPayload
import com.vedanova.platform.contracts.EscalationParams
import com.vedanova.platform.contracts.ShopConfig
import com.vedanova.platform.contracts.ShopifyOrderContext
import com.vedanova.platform.contracts.Simulation
import com.vedanova.platform.contracts.UpdateCallStatusActivityInput
import com.vedanova.platform.contracts.WritebackParams
import io.temporal.activity.ActivityOptions
import io.temporal.common.RetryOptions
import io.temporal.workflow.Workflow
import java.time.Duration

open class CallLifecycleWorkflowImpl : CallLifecycleWorkflow {
    private var completedPayload: CallCompletedPayload? = null
    private var escalated = false
    private var escalationReason = ""

    override fun callCompleted(payload: CallCompletedPayload) {
        completedPayload = payload
    }

    override fun escalateToHuman(payload: EscalateSignalPayload) {
        escalated = true
        escalationReason = payload.reason
    }

    override fun run(input: CallLifecycleInput): String {
        val activities =
            Workflow.newActivityStub(
                AvipActivities::class.java,
                ActivityOptions.newBuilder()
                    .setStartToCloseTimeout(Duration.ofMinutes(5))
                    .setRetryOptions(RetryOptions.newBuilder().setMaximumAttempts(3).build())
                    .build(),
            )

        val workflowId = Workflow.getInfo().workflowId

        var shopConfig = activities.loadShopConfig(input.shopId)

        var orderContext: ShopifyOrderContext =
            if (input.simulationMode) {
                Simulation.fakeOrderContext(input.orderId)
            } else {
                activities.fetchOrderContext(input.shopId, input.orderId)
            }

        val merged = CallOverridesLogic.apply(shopConfig, orderContext, input.overrides)
        shopConfig = merged.first
        orderContext = merged.second

        val dispatch =
            activities.dispatchLivekitAgent(
                DispatchParams(
                    orderContext = orderContext,
                    workflowId = workflowId,
                    shopId = input.shopId,
                    systemPrompt = shopConfig.systemPrompt,
                    simulationMode = input.simulationMode,
                    objective = input.overrides.objective,
                    language = orderContext.language,
                ),
            )

        activities.recordCallStarted(input, dispatch.roomName, workflowId)

        if (!input.simulationMode) {
            val compliance =
                activities.checkDialCompliance(
                    DialComplianceInput(
                        shopId = input.shopId,
                        orderId = input.orderId,
                        customerPhone = orderContext.customerPhone,
                        attemptNumber = orderContext.attemptNumber,
                    ),
                )
            if (!compliance.allowed) {
                activities.createEscalationRecord(
                    EscalationParams(
                        shopId = input.shopId,
                        orderId = input.orderId,
                        reason = compliance.reason,
                    ),
                )
                activities.updateCallStatus(
                    UpdateCallStatusActivityInput(
                        shopId = input.shopId,
                        orderId = input.orderId,
                        status = CallStatus.ESCALATED.value,
                        outcome = compliance.reason,
                    ),
                )
                return "blocked:${input.orderId}"
            }
            activities.dialCustomerPstn(dispatch.roomName, orderContext.customerPhone)
        }

        activities.updateCallStatus(
            UpdateCallStatusActivityInput(
                shopId = input.shopId,
                orderId = input.orderId,
                status = CallStatus.IN_CALL.value,
            ),
        )

        val gotSignal =
            Workflow.await(Duration.ofMinutes(30)) {
                completedPayload != null || escalated
            }

        if (!gotSignal) {
            activities.updateCallStatus(
                UpdateCallStatusActivityInput(
                    shopId = input.shopId,
                    orderId = input.orderId,
                    status = CallStatus.CANCELLED.value,
                    outcome = "timeout",
                ),
            )
            return "timeout:${input.orderId}"
        }

        if (escalated) {
            activities.createEscalationRecord(
                EscalationParams(
                    shopId = input.shopId,
                    orderId = input.orderId,
                    reason = escalationReason,
                ),
            )
            activities.updateCallStatus(
                UpdateCallStatusActivityInput(
                    shopId = input.shopId,
                    orderId = input.orderId,
                    status = CallStatus.ESCALATED.value,
                    outcome = escalationReason,
                ),
            )
            return "escalated:${input.orderId}"
        }

        val payload = completedPayload ?: return "unknown:${input.orderId}"

        if (!input.simulationMode) {
            activities.writebackShopifyAttempt(
                WritebackParams(
                    shopId = input.shopId,
                    orderContext = orderContext,
                    payload = payload,
                ),
            )
        }

        var outcome = payload.outcome
        if (outcome.isBlank()) outcome = payload.reason
        val duration = payload.callDurationSeconds.takeIf { it > 0 }
        activities.attachRecordingPlaceholder(
            AttachRecordingInput(
                shopId = input.shopId,
                orderId = input.orderId,
            ),
        )
        activities.updateCallStatus(
            UpdateCallStatusActivityInput(
                shopId = input.shopId,
                orderId = input.orderId,
                status = CallStatus.COMPLETED.value,
                outcome = outcome,
                durationSeconds = duration,
            ),
        )
        return "completed:${input.orderId}"
    }
}

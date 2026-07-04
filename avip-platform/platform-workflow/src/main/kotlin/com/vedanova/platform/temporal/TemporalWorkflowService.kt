package com.vedanova.platform.temporal

import com.vedanova.platform.config.AvipProperties
import com.vedanova.platform.contracts.CallLifecycleInput
import io.temporal.api.enums.v1.WorkflowIdConflictPolicy
import io.temporal.client.WorkflowClient
import io.temporal.client.WorkflowOptions

class TemporalWorkflowService(
    private val workflowClient: WorkflowClient,
    private val avipProperties: AvipProperties,
) {
    fun startCallLifecycle(input: CallLifecycleInput): String {
        val workflowId = buildCallWorkflowId(input)
        val optionsBuilder =
            WorkflowOptions.newBuilder()
                .setWorkflowId(workflowId)
                .setTaskQueue(avipProperties.temporal.taskQueue)
        if (input.idempotencyKey.isBlank()) {
            optionsBuilder.setWorkflowIdConflictPolicy(
                WorkflowIdConflictPolicy.WORKFLOW_ID_CONFLICT_POLICY_USE_EXISTING,
            )
        }
        val stub =
            workflowClient.newUntypedWorkflowStub(
                TemporalConstants.WORKFLOW_CALL_LIFECYCLE,
                optionsBuilder.build(),
            )
        stub.start(input)
        return workflowId
    }

    companion object {
        fun buildCallWorkflowId(input: CallLifecycleInput): String {
            val key = input.idempotencyKey.trim()
            return if (key.isNotEmpty()) {
                "call-$key"
            } else {
                "call-${input.shopId}-${input.orderId}"
            }
        }
    }
}

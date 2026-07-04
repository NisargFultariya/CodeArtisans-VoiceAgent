package com.vedanova.platform.temporal

import com.vedanova.platform.contracts.CallCompletedPayload
import io.temporal.client.WorkflowClient

class TemporalSignalService(
    private val workflowClient: WorkflowClient,
) {
    fun signalCallCompleted(workflowId: String, payload: CallCompletedPayload) {
        val stub = workflowClient.newUntypedWorkflowStub(workflowId)
        stub.signal(TemporalConstants.SIGNAL_CALL_COMPLETED, payload)
    }

    fun signalEscalateToHuman(workflowId: String, reason: String) {
        val stub = workflowClient.newUntypedWorkflowStub(workflowId)
        stub.signal(TemporalConstants.SIGNAL_ESCALATE_TO_HUMAN, mapOf("reason" to reason))
    }
}

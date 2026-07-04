package com.vedanova.platform.workflow

import com.vedanova.platform.contracts.CallCompletedPayload
import com.vedanova.platform.contracts.OutboundCallWorkflowInput
import io.temporal.workflow.SignalMethod
import io.temporal.workflow.WorkflowInterface
import io.temporal.workflow.WorkflowMethod

@WorkflowInterface
interface OutboundCallWorkflow {
    @WorkflowMethod(name = "OutboundCallWorkflow")
    fun run(input: OutboundCallWorkflowInput): String

    @SignalMethod(name = "callCompleted")
    fun callCompleted(payload: CallCompletedPayload)
}

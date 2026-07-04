package com.vedanova.platform.workflow

import com.vedanova.platform.contracts.CallCompletedPayload
import com.vedanova.platform.contracts.CallLifecycleInput
import com.vedanova.platform.contracts.EscalateSignalPayload
import io.temporal.workflow.SignalMethod
import io.temporal.workflow.WorkflowInterface
import io.temporal.workflow.WorkflowMethod

@WorkflowInterface
interface CallLifecycleWorkflow {
    @WorkflowMethod(name = "CallLifecycleWorkflow")
    fun run(input: CallLifecycleInput): String

    @SignalMethod(name = "callCompleted")
    fun callCompleted(payload: CallCompletedPayload)

    @SignalMethod(name = "escalateToHuman")
    fun escalateToHuman(payload: EscalateSignalPayload)
}

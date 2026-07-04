package com.vedanova.platform.workflow

import io.temporal.workflow.WorkflowInterface
import io.temporal.workflow.WorkflowMethod

@WorkflowInterface
interface HelloWorkflow {
    @WorkflowMethod(name = "HelloWorkflow")
    fun run(name: String): String
}

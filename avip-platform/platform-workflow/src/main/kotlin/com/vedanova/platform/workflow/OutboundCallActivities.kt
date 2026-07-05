package com.vedanova.platform.workflow

import io.temporal.activity.ActivityInterface
import io.temporal.activity.ActivityMethod

@ActivityInterface
interface OutboundCallActivities {
    @ActivityMethod(name = "OutboundCall_UpdateStatus")
    fun updateStatus(
        callId: String,
        status: String,
        outcome: String? = null,
        error: String? = null,
        durationSeconds: Int? = null,
        userUtterances: List<String> = emptyList()
    )

    @ActivityMethod(name = "OutboundCall_DispatchAgent")
    fun dispatchAgent(
        roomName: String,
        scenario: String,
        language: String,
        voice: String,
        callId: String,
        workflowId: String
    ): DispatchAgentResult

    @ActivityMethod(name = "OutboundCall_UpdateCallDetails")
    fun updateCallDetails(callId: String, roomName: String, workflowId: String)

    @ActivityMethod(name = "OutboundCall_DialPhone")
    fun dialPhone(roomName: String, phoneNumber: String)

    @ActivityMethod(name = "OutboundCall_TerminateCall")
    fun terminateCall(roomName: String)
}

data class DispatchAgentResult(
    val success: Boolean,
    val error: String? = null
)

package com.vedanova.platform.api.controller.internal

import com.vedanova.platform.contracts.CallCompletedPayload
import com.vedanova.platform.temporal.TemporalSignalService
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.springframework.web.server.ResponseStatusException

class InternalSignalControllerTest {
    private val temporalSignalService: TemporalSignalService = mock()
    private val controller = InternalSignalController(temporalSignalService)

    @Test
    fun `call-completed forwards to temporal`() {
        val response =
            controller.callCompleted(
                CallCompletedRequest(
                    workflowId = "wf-42",
                    payload =
                        CallCompletedPayload(
                            outcome = "completed",
                            reason = "not home",
                            language = "hi-IN",
                            callDurationSeconds = 60,
                            userUtterances = listOf("hello"),
                            agentId = "job-1",
                            status = "completed",
                        ),
                ),
            )

        assert(response.ok)
        assert(response.workflowId == "wf-42")
        verify(temporalSignalService).signalCallCompleted(
            "wf-42",
            CallCompletedPayload(
                outcome = "completed",
                reason = "not home",
                language = "hi-IN",
                callDurationSeconds = 60,
                userUtterances = listOf("hello"),
                agentId = "job-1",
                status = "completed",
            ),
        )
    }

    @Test
    fun `call-completed rejects blank workflow id`() {
        assertThrows<ResponseStatusException> {
            controller.callCompleted(CallCompletedRequest(workflowId = "  "))
        }
    }
}

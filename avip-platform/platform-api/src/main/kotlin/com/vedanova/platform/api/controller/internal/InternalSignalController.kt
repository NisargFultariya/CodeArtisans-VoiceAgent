package com.vedanova.platform.api.controller.internal

import com.vedanova.platform.contracts.CallCompletedPayload
import com.vedanova.platform.temporal.TemporalSignalService
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException

@RestController
@RequestMapping("/internal/signals")
class InternalSignalController(
    private val temporalSignalService: TemporalSignalService,
) {
    @PostMapping("/call-completed")
    fun callCompleted(@Valid @RequestBody body: CallCompletedRequest): SignalResponse {
        val workflowId = body.workflowId.trim()
        if (workflowId.isEmpty()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "workflowId required")
        }
        temporalSignalService.signalCallCompleted(workflowId, body.payload)
        return SignalResponse(ok = true, workflowId = workflowId)
    }

    @PostMapping("/escalate")
    fun escalate(@Valid @RequestBody body: EscalateRequest): SignalResponse {
        val workflowId = body.workflowId.trim()
        if (workflowId.isEmpty()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "workflowId required")
        }
        temporalSignalService.signalEscalateToHuman(workflowId, body.reason)
        return SignalResponse(ok = true, workflowId = workflowId)
    }
}

data class CallCompletedRequest(
    @field:NotBlank val workflowId: String,
    val payload: CallCompletedPayload = CallCompletedPayload(),
)

data class EscalateRequest(
    @field:NotBlank val workflowId: String,
    val reason: String = "",
)

data class SignalResponse(
    val ok: Boolean,
    val workflowId: String,
)

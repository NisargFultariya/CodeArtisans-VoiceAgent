package com.vedanova.platform.api.controller

import com.vedanova.platform.config.AvipProperties
import com.vedanova.platform.contracts.OutboundCallWorkflowInput
import com.vedanova.platform.persistence.OutboundCallRepository
import com.vedanova.platform.persistence.OutboundCallRow
import com.vedanova.platform.api.service.CallStatusPublisher
import com.vedanova.platform.contracts.CallStatusUpdatedEvent
import io.livekit.server.AccessToken
import io.livekit.server.RoomJoin
import io.livekit.server.RoomName
import io.temporal.client.WorkflowClient
import io.temporal.client.WorkflowOptions
import org.springframework.context.ApplicationEventPublisher
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.*
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import org.springframework.web.server.ResponseStatusException
import com.fasterxml.jackson.databind.ObjectMapper
import java.util.UUID
import java.util.concurrent.TimeUnit

@RestController
@RequestMapping("/api/calls")
class OutboundCallController(
    private val outboundCallRepository: OutboundCallRepository,
    private val workflowClient: WorkflowClient,
    private val avipProperties: AvipProperties,
    private val callStatusPublisher: CallStatusPublisher,
    private val eventPublisher: ApplicationEventPublisher,
) {
    private val objectMapper = ObjectMapper().findAndRegisterModules()
    @PostMapping
    fun createCall(@RequestBody body: CreateOutboundCallRequest): CreateOutboundCallResponse {
        val mode = body.mode.trim().lowercase().ifBlank { "phone" }
        if (mode == "phone" && body.phoneNumber.isNullOrBlank()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Phone number required in phone mode")
        }

        val callId = UUID.randomUUID().toString().replace("-", "")
        
        val isScheduled = (body.delayMinutes != null && body.delayMinutes > 0) || body.scheduledTimeEpochMs != null
        val initialStatus = if (isScheduled) "SCHEDULED" else "CALLING"

        val customDataStr = body.customData?.let { 
            try {
                objectMapper.writeValueAsString(it)
            } catch (e: Exception) {
                "{}"
            }
        } ?: "{}"

        // 1. Persist call metadata in DB
        outboundCallRepository.create(
            id = callId,
            phoneNumber = body.phoneNumber?.trim(),
            scenario = body.scenario.trim(),
            language = body.language.trim(),
            voice = body.voice.trim(),
            mode = mode,
            status = initialStatus,
            customerName = body.customerName?.trim(),
            systemPrompt = body.systemPrompt?.trim(),
            customData = customDataStr
        )

        if (isScheduled) {
            val outcomeMsg = if (body.delayMinutes != null) "Scheduled in ${body.delayMinutes} mins" else "Scheduled for custom time"
            outboundCallRepository.updateStatus(callId, "SCHEDULED", outcome = outcomeMsg)
        }

        // 2. Start Temporal Workflow
        val workflowId = "outbound-$callId"
        val input = OutboundCallWorkflowInput(
            callId = callId,
            phoneNumber = body.phoneNumber?.trim().orEmpty(),
            scenario = body.scenario.trim(),
            language = body.language.trim(),
            voice = body.voice.trim(),
            mode = mode,
            delayMinutes = body.delayMinutes,
            scheduledTimeEpochMs = body.scheduledTimeEpochMs,
            customerName = body.customerName?.trim(),
            systemPrompt = body.systemPrompt?.trim(),
            customData = body.customData
        )

        val options = WorkflowOptions.newBuilder()
            .setWorkflowId(workflowId)
            .setTaskQueue(avipProperties.temporal.taskQueue)
            .build()

        try {
            val stub = workflowClient.newUntypedWorkflowStub("OutboundCallWorkflow", options)
            stub.start(input)
        } catch (ex: Exception) {
            outboundCallRepository.updateStatus(callId, "FAILED", outcome = "Workflow start failed: ${ex.message}")
            throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to start Temporal workflow", ex)
        }

        // 3. Generate LiveKit token if mode is browser
        var token: String? = null
        var roomName: String? = null
        if (mode == "browser") {
            val lk = avipProperties.livekit
            if (lk.apiKey.isNotBlank() && lk.apiSecret.isNotBlank()) {
                roomName = "outbound-$callId"
                val participantIdentity = "browser-user-${callId.take(6)}"
                token = AccessToken(lk.apiKey, lk.apiSecret).apply {
                    identity = participantIdentity
                    name = "Operator User"
                    ttl = TimeUnit.MINUTES.toMillis(15)
                    addGrants(RoomJoin(true), RoomName(roomName))
                }.toJwt()
            }
        }

        return CreateOutboundCallResponse(
            callId = callId,
            workflowId = workflowId,
            status = "CALLING",
            roomName = roomName,
            token = token
        )
    }

    @GetMapping
    fun listCalls(@RequestParam(defaultValue = "50") limit: Int): List<OutboundCallRow> {
        return outboundCallRepository.listRecent(limit)
    }

    @GetMapping("/{callId}")
    fun getCall(@PathVariable callId: String): OutboundCallRow {
        return outboundCallRepository.get(callId)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Call not found")
    }

    @GetMapping(value = ["/stream"], produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    fun streamUpdates(): SseEmitter {
        return callStatusPublisher.subscribe()
    }

    @PostMapping("/{callId}/transcript")
    fun addTranscriptLine(
        @PathVariable callId: String,
        @RequestBody body: TranscriptLineRequest
    ): Map<String, Any> {
        val line = "[${body.speaker}] ${body.text.trim()}"
        outboundCallRepository.appendTranscriptLine(callId, line)
        
        // Notify SSE subscribers
        val currentCall = outboundCallRepository.get(callId)
        val transcriptText = currentCall?.transcript.orEmpty()
        eventPublisher.publishEvent(
            CallStatusUpdatedEvent(
                source = this,
                callId = callId,
                status = currentCall?.status ?: "IN_CALL",
                data = mapOf("transcript" to transcriptText)
            )
        )
        
        return mapOf("success" to true)
    }
}

data class CreateOutboundCallRequest(
    val phoneNumber: String?,
    val scenario: String,
    val language: String,
    val voice: String,
    val mode: String = "phone",
    val delayMinutes: Int? = null,
    val scheduledTimeEpochMs: Long? = null,
    val customerName: String? = null,
    val systemPrompt: String? = null,
    val customData: Map<String, Any>? = null,
)

data class CreateOutboundCallResponse(
    val callId: String,
    val workflowId: String,
    val status: String,
    val roomName: String? = null,
    val token: String? = null
)

data class TranscriptLineRequest(
    val speaker: String, // "agent" or "user" or "system"
    val text: String
)

package com.vedanova.platform.activity

import com.vedanova.platform.config.AvipProperties
import com.vedanova.platform.contracts.CallStatusUpdatedEvent
import com.vedanova.platform.persistence.OutboundCallRepository
import com.vedanova.platform.telephony.TelephonyAdapter
import com.vedanova.platform.workflow.OutboundCallActivities
import com.vedanova.platform.workflow.DispatchAgentResult
import tools.jackson.databind.ObjectMapper
import io.livekit.server.AgentDispatchServiceClient
import io.livekit.server.RoomServiceClient
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Component
import java.time.Duration

@Component
class OutboundCallActivitiesImpl(
    private val outboundCallRepository: OutboundCallRepository,
    private val avipProperties: AvipProperties,
    private val telephonyAdapter: TelephonyAdapter,
    private val objectMapper: ObjectMapper,
    private val eventPublisher: ApplicationEventPublisher,
) : OutboundCallActivities {

    override fun updateStatus(
        callId: String,
        status: String,
        outcome: String?,
        error: String?,
        durationSeconds: Int?,
        userUtterances: List<String>
    ) {
        val transcriptText = if (userUtterances.isNotEmpty()) {
            userUtterances.joinToString("\n")
        } else null

        val finalOutcome = outcome ?: error

        outboundCallRepository.updateStatus(
            id = callId,
            status = status,
            outcome = finalOutcome,
            durationSeconds = durationSeconds,
            transcript = transcriptText
        )

        // Publish Spring event to alert API listeners (SSE)
        val eventData = mutableMapOf<String, Any?>()
        if (finalOutcome != null) eventData["outcome"] = finalOutcome
        if (durationSeconds != null) eventData["durationSeconds"] = durationSeconds
        if (transcriptText != null) eventData["transcript"] = transcriptText

        eventPublisher.publishEvent(
            CallStatusUpdatedEvent(
                source = this,
                callId = callId,
                status = status,
                data = eventData
            )
        )
        
        log.info("Outbound callStatus updated callId={} status={}", callId, status)
    }

    override fun dispatchAgent(
        roomName: String,
        scenario: String,
        language: String,
        voice: String,
        callId: String,
        workflowId: String
    ): DispatchAgentResult {
        val lk = avipProperties.livekit
        val apiUrl = lk.resolvedApiUrl()
        if (lk.url.isBlank() || apiUrl.isBlank() || lk.apiKey.isBlank() || lk.apiSecret.isBlank()) {
            log.error("LiveKit not configured for outbound dispatch")
            return DispatchAgentResult(false, "LiveKit credentials not configured")
        }

        val roomClient = RoomServiceClient.createClient(apiUrl, lk.apiKey, lk.apiSecret)
        val dispatchClient = AgentDispatchServiceClient.createClient(apiUrl, lk.apiKey, lk.apiSecret)

        val metaMap = mapOf(
            "source" to "outbound-call",
            "simulationMode" to false,
            "language" to language,
            "scenario" to scenario,
            "voice" to voice,
            "callId" to callId,
            "workflowId" to workflowId
        )
        val metaJson = objectMapper.writeValueAsString(metaMap)

        try {
            log.info("Creating LiveKit room={} for callId={}", roomName, callId)
            roomClient.createRoom(roomName, 1800, 2, null, metaJson).execute()
        } catch (ex: Exception) {
            log.error("Failed to create LiveKit room={}", roomName, ex)
            return DispatchAgentResult(false, "Failed to create LiveKit room: ${ex.message}")
        }

        try {
            log.info("Creating agent dispatch room={} agentName={}", roomName, lk.agentName)
            dispatchClient.createDispatch(roomName, lk.agentName, metaJson).execute()

            // Wait for agent to join the room
            if (!waitForAgentParticipant(roomClient, roomName, Duration.ofSeconds(20))) {
                log.warn("Agent did not join room={} within 20s, redispatching once", roomName)
                dispatchClient.createDispatch(roomName, lk.agentName, metaJson).execute()
                if (!waitForAgentParticipant(roomClient, roomName, Duration.ofSeconds(15))) {
                    log.error("Agent failed to join room={} after redispatch", roomName)
                    return DispatchAgentResult(false, "Agent did not join LiveKit room")
                }
            }

            // Publish Agent Joined status event
            eventPublisher.publishEvent(
                CallStatusUpdatedEvent(
                    source = this,
                    callId = callId,
                    status = "AGENT_JOINED"
                )
            )

            log.info("Agent joined successfully room={}", roomName)
            return DispatchAgentResult(true)
        } catch (ex: Exception) {
            log.error("Failed to dispatch agent room={}", roomName, ex)
            return DispatchAgentResult(false, "Dispatch failed: ${ex.message}")
        }
    }

    override fun updateCallDetails(callId: String, roomName: String, workflowId: String) {
        outboundCallRepository.updateDetails(callId, roomName, workflowId)
    }

    override fun dialPhone(roomName: String, phoneNumber: String) {
        log.info("Dialing outbound PSTN call room={} phone={}", roomName, phoneNumber)
        telephonyAdapter.dialOutbound(roomName, phoneNumber)
    }

    override fun terminateCall(roomName: String) {
        val lk = avipProperties.livekit
        val apiUrl = lk.resolvedApiUrl()
        if (lk.url.isBlank() || apiUrl.isBlank() || lk.apiKey.isBlank() || lk.apiSecret.isBlank()) {
            log.warn("LiveKit credentials not configured, skipping call termination")
            return
        }
        try {
            log.info("Deleting LiveKit room={} to hang up the SIP participant", roomName)
            val roomClient = RoomServiceClient.createClient(apiUrl, lk.apiKey, lk.apiSecret)
            roomClient.deleteRoom(roomName).execute()
            log.info("LiveKit room={} successfully deleted", roomName)
        } catch (ex: Exception) {
            log.warn("Failed to delete LiveKit room={}: {}", roomName, ex.message)
        }
    }

    private fun waitForAgentParticipant(
        roomClient: RoomServiceClient,
        roomName: String,
        timeout: Duration
    ): Boolean {
        val deadline = System.currentTimeMillis() + timeout.toMillis()
        while (System.currentTimeMillis() < deadline) {
            try {
                val participants = roomClient.listParticipants(roomName).execute().body().orEmpty()
                for (participant in participants) {
                    if (isAgentIdentity(participant.identity)) {
                        log.info("Agent found in room={} identity={}", roomName, participant.identity)
                        return true
                    }
                }
            } catch (ex: Exception) {
                log.warn("Error listing participants: {}", ex.message)
            }
            Thread.sleep(500)
        }
        return false
    }

    private fun isAgentIdentity(identity: String): Boolean {
        val id = identity.trim()
        return id == "avip-agent" || id.startsWith("agent-") || id.startsWith("avip-agent")
    }

    companion object {
        private val log = LoggerFactory.getLogger(OutboundCallActivitiesImpl::class.java)
    }
}

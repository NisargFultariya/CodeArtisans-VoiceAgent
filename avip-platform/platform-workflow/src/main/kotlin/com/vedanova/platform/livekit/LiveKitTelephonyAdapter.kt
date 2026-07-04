package com.vedanova.platform.livekit

import tools.jackson.databind.ObjectMapper
import com.vedanova.platform.config.AvipProperties
import com.vedanova.platform.contracts.DispatchCallResult
import com.vedanova.platform.contracts.DispatchParams
import io.livekit.server.AgentDispatchServiceClient
import io.livekit.server.RoomServiceClient
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import java.time.Duration

@Component
class LiveKitTelephonyAdapter(
    private val avipProperties: AvipProperties,
    private val objectMapper: ObjectMapper,
) {
    fun dispatchAgent(params: DispatchParams): DispatchCallResult {
        val lk = avipProperties.livekit
        require(lk.apiUrl.isNotBlank() && lk.apiKey.isNotBlank() && lk.apiSecret.isNotBlank()) {
            "LIVEKIT_API_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET required"
        }
        val roomName = buildRoomName(params.orderContext.orderId)
        val roomClient = RoomServiceClient.createClient(lk.apiUrl, lk.apiKey, lk.apiSecret)
        val dispatchClient = AgentDispatchServiceClient.createClient(lk.apiUrl, lk.apiKey, lk.apiSecret)

        val meta =
            linkedMapOf<String, Any?>(
                "source" to "avip",
                "orderId" to params.orderContext.orderId,
                "customerPhone" to params.orderContext.customerPhone,
                "workflowId" to params.workflowId,
                "shopId" to params.shopId,
                "systemPrompt" to params.systemPrompt,
                "simulationMode" to params.simulationMode,
                "customerName" to params.orderContext.customerName,
                "orderName" to params.orderContext.orderName,
            )
        val language = params.language.ifBlank { params.orderContext.language }
        if (language.isNotBlank()) meta["language"] = language
        if (params.objective.isNotBlank()) meta["objective"] = params.objective
        val metaJson = objectMapper.writeValueAsString(meta)

        roomClient.createRoom(roomName, 1800, 2, null, metaJson).execute()

        val dispatch =
            dispatchClient.createDispatch(roomName, lk.agentName, metaJson).execute().body()
                ?: throw IllegalStateException("LiveKit dispatch returned empty body")

        if (!waitForAgentParticipant(roomClient, roomName, Duration.ofSeconds(25))) {
            log.warn("agent slow for room={} — redispatching", roomName)
            try {
                dispatchClient.createDispatch(roomName, lk.agentName, metaJson).execute()
            } catch (ex: Exception) {
                log.warn("redispatch failed room={}: {}", roomName, ex.message)
            }
            if (!waitForAgentParticipant(roomClient, roomName, Duration.ofSeconds(20))) {
                throw IllegalStateException("agent did not join room $roomName")
            }
        }

        log.info("dispatch ok room={} dispatchId={} agent={}", roomName, dispatch.id, lk.agentName)
        return DispatchCallResult(
            dispatchId = dispatch.id,
            roomName = roomName,
            customerPhone = params.orderContext.customerPhone,
            orderId = params.orderContext.orderId,
        )
    }

    private fun waitForAgentParticipant(
        roomClient: RoomServiceClient,
        roomName: String,
        timeout: Duration,
    ): Boolean {
        val deadline = System.currentTimeMillis() + timeout.toMillis()
        while (System.currentTimeMillis() < deadline) {
            val participants = roomClient.listParticipants(roomName).execute().body().orEmpty()
            for (participant in participants) {
                if (isAgentIdentity(participant.identity)) {
                    log.info("agent joined room={} identity={}", roomName, participant.identity)
                    return true
                }
            }
            Thread.sleep(500)
        }
        return false
    }

    private fun isAgentIdentity(identity: String): Boolean {
        val id = identity.trim()
        return id == "avip-agent" || id.startsWith("agent-") || id.startsWith("avip-agent")
    }

    private fun buildRoomName(orderId: String): String {
        val digits = orderId.filter { it.isDigit() }
        return "avip-$digits-${System.currentTimeMillis()}"
    }

    companion object {
        private val log = LoggerFactory.getLogger(LiveKitTelephonyAdapter::class.java)
    }
}

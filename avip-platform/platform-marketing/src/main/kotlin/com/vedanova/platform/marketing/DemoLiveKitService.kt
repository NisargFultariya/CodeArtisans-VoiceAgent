package com.vedanova.platform.marketing

import tools.jackson.databind.ObjectMapper
import com.vedanova.platform.config.AvipProperties
import io.livekit.server.AccessToken
import io.livekit.server.AgentDispatchServiceClient
import io.livekit.server.RoomJoin
import io.livekit.server.RoomName
import io.livekit.server.RoomServiceClient
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.security.SecureRandom
import java.util.concurrent.TimeUnit

@Service
class DemoLiveKitService(
    private val avipProperties: AvipProperties,
    private val objectMapper: ObjectMapper,
) {
    fun createSession(lang: String, scenario: String): DemoSessionResponse {
        val lk = avipProperties.livekit
        val apiUrl = lk.resolvedApiUrl()
        if (lk.url.isBlank() || apiUrl.isBlank() || lk.apiKey.isBlank() || lk.apiSecret.isBlank()) {
            throw org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.PRECONDITION_FAILED,
                "LiveKit not configured — set LIVEKIT_URL, LIVEKIT_API_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET in platform/.env and restart the API",
            )
        }

        val normalizedLang = DemoLanguage.normalize(lang)
        val normalizedScenario = DemoScenario.normalize(scenario)
        val roomName = "avip-demo-${randomHex(8)}"
        val participantIdentity = "demo-user-${randomHex(6)}"
        val agentName = lk.agentName.ifBlank { "avip-recovery-agent" }

        val roomClient = RoomServiceClient.createClient(apiUrl, lk.apiKey, lk.apiSecret)
        try {
            roomClient
                .createRoom(roomName, 300, 2, null, """{"source":"avip-demo"}""")
                .execute()
        } catch (ex: Exception) {
            log.error("LiveKit createRoom failed room={}", roomName, ex)
            throw org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_GATEWAY,
                "Could not create LiveKit room — check LIVEKIT_API_URL and credentials",
                ex,
            )
        }

        val token =
            AccessToken(lk.apiKey, lk.apiSecret).apply {
                identity = participantIdentity
                name = "Demo User"
                ttl = TimeUnit.MINUTES.toMillis(2)
                addGrants(RoomJoin(true), RoomName(roomName))
            }.toJwt()

        val (dispatchOk, dispatchHint) =
            dispatchDemoAgent(apiUrl, agentName, roomName, normalizedLang, normalizedScenario)

        return DemoSessionResponse(
            url = lk.url,
            roomName = roomName,
            token = token,
            identity = participantIdentity,
            agentName = agentName,
            dispatchOk = dispatchOk,
            dispatchHint = dispatchHint,
        )
    }

    private fun dispatchDemoAgent(
        apiUrl: String,
        agentName: String,
        roomName: String,
        lang: String,
        scenario: String,
    ): Pair<Boolean, String?> {
        val lk = avipProperties.livekit
        val metaJson =
            objectMapper.writeValueAsString(
                mapOf(
                    "source" to "avip-demo",
                    "simulationMode" to true,
                    "language" to lang,
                    "scenario" to scenario,
                ),
            )
        return try {
            val dispatchClient = AgentDispatchServiceClient.createClient(apiUrl, lk.apiKey, lk.apiSecret)
            dispatchClient.createDispatch(roomName, agentName, metaJson).execute()
            true to null
        } catch (ex: Exception) {
            log.warn("demo dispatch failed room={}: {}", roomName, ex.message)
            false to "dispatch failed: ${ex.message} (is agent running as \"$agentName\"?)"
        }
    }

    private fun randomHex(byteCount: Int): String {
        val bytes = ByteArray(byteCount)
        SECURE_RANDOM.nextBytes(bytes)
        return bytes.joinToString("") { "%02x".format(it) }
    }

    companion object {
        private val log = LoggerFactory.getLogger(DemoLiveKitService::class.java)
        private val SECURE_RANDOM = SecureRandom()
    }
}

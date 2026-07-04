package com.vedanova.platform.telephony

import com.vedanova.platform.config.AvipProperties
import io.livekit.server.CreateSipParticipantOptions
import io.livekit.server.SipServiceClient
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

@Component
class TelephonyAdapter(
    private val avipProperties: AvipProperties,
) {
    fun dialOutbound(roomName: String, customerPhone: String) {
        Thread.sleep(1500)
        when (avipProperties.telephony.provider.trim().ifBlank { "vobiz" }) {
            "noop", "stub" -> {
                log.info("skip dial (provider={}) room={} phone={}", avipProperties.telephony.provider, roomName, customerPhone)
            }
            "vobiz" -> dialViaLiveKitSip(roomName, customerPhone)
            else -> throw IllegalStateException("unsupported TELEPHONY_PROVIDER: ${avipProperties.telephony.provider}")
        }
    }

    private fun dialViaLiveKitSip(roomName: String, customerPhone: String) {
        val lk = avipProperties.livekit
        val trunkId = lk.sipOutboundTrunkId.ifBlank { System.getenv("LIVEKIT_SIP_OUTBOUND_TRUNK_ID").orEmpty() }
        require(trunkId.isNotBlank()) { "missing LIVEKIT_SIP_OUTBOUND_TRUNK_ID" }
        require(lk.apiUrl.isNotBlank() && lk.apiKey.isNotBlank() && lk.apiSecret.isNotBlank()) {
            "LIVEKIT_API_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET required"
        }
        val e164 = toE164(customerPhone)
        val sipClient = SipServiceClient.createClient(lk.apiUrl, lk.apiKey, lk.apiSecret)
        val identity = "customer-${System.currentTimeMillis()}"
        val options =
            CreateSipParticipantOptions(
                participantIdentity = identity,
                participantName = "Customer",
                participantMetadata = """{"role":"customer","phone":"$e164"}""",
                playDialtone = true,
                waitUntilAnswered = lk.sipWaitUntilAnswered,
            )
        val info = sipClient.createSipParticipant(trunkId, e164, roomName, options).execute().body()
            ?: throw IllegalStateException("SIP participant creation returned empty body")
        log.info(
            "vobiz/livekit sip dial ok participant={} call={} phone={}",
            info.participantId,
            info.sipCallId,
            e164,
        )
    }

    private fun toE164(phone: String): String {
        val digits = phone.filter { it.isDigit() || it == '+' }
        if (digits.startsWith("+")) return digits
        if (digits.length == 10) return "+91$digits"
        if (digits.length == 12 && digits.startsWith("91")) return "+$digits"
        return "+$digits"
    }

    companion object {
        private val log = LoggerFactory.getLogger(TelephonyAdapter::class.java)
    }
}

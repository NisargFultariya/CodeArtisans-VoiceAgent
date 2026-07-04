package com.vedanova.platform.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "avip")
data class AvipProperties(
    val internalSecret: String = "",
    val appUrl: String = "",
    val tokenEncryptionKey: String = "",
    val defaultLanguage: String = "hi-IN",
    val shopifyApiVersion: String = "2024-10",
    val simulationEnabled: Boolean = true,
    val devShopDomain: String = "avip-store-ioj9xku3.myshopify.com",
    val temporal: TemporalProperties = TemporalProperties(),
    val livekit: LiveKitProperties = LiveKitProperties(),
    val sarvam: SarvamProperties = SarvamProperties(),
    val telephony: TelephonyProperties = TelephonyProperties(),
    val storage: StorageProperties = StorageProperties(),
    val admin: AdminProperties = AdminProperties(),
    val voiceDemo: VoiceDemoProperties = VoiceDemoProperties(),
    val portal: PortalProperties = PortalProperties(),
    val mail: MailProperties = MailProperties(),
)

data class PortalProperties(
    val loginTokenTtlMinutes: Long = 30,
    val sessionTtlHours: Long = 168,
    val sessionSecret: String = "",
    val accessCookieName: String = "avip_portal_session",
)

data class VoiceDemoProperties(
    /** When true, /demo and its APIs require a magic-link token. */
    val gateEnabled: Boolean = true,
    val tokenTtlHours: Long = 72,
    val tokenSecret: String = "",
    val accessCookieName: String = "avip_demo_token",
    /** Persist voice demo transcripts to Postgres + optional local files. */
    val transcriptLogEnabled: Boolean = true,
    /** Relative to process working dir; also mounted in compose for host access. */
    val transcriptLogDir: String = "data/demo-transcripts",
)

data class MailProperties(
    val enabled: Boolean = true,
    val from: String = "AVIP <noreply@avip.local>",
)

data class AdminProperties(
    val username: String = "admin",
    val password: String = "",
    val sessionSecret: String = "",
    val sessionTtlHours: Long = 24,
)

data class StorageProperties(
    val endpoint: String = "",
    val accessKey: String = "",
    val secretKey: String = "",
    val bucket: String = "avip-recordings",
    val region: String = "us-east-1",
)

data class TemporalProperties(
    val address: String = "localhost:7233",
    val namespace: String = "default",
    val taskQueue: String = "avip-main",
)

data class LiveKitProperties(
    /** WSS URL for browser clients (LiveKit WebRTC). */
    val url: String = "",
    /** HTTPS base URL for LiveKit server SDK (room create, dispatch, SIP). */
    val apiUrl: String = "",
    val apiKey: String = "",
    val apiSecret: String = "",
    val agentName: String = "avip-recovery-agent",
    val sipOutboundTrunkId: String = "",
    val sipWaitUntilAnswered: Boolean = false,
) {
    fun resolvedApiUrl(): String =
        apiUrl.ifBlank {
            when {
                url.startsWith("wss://") -> "https://${url.removePrefix("wss://")}"
                url.startsWith("ws://") -> "http://${url.removePrefix("ws://")}"
                else -> url
            }
        }
}

data class SarvamProperties(
    val apiKey: String = "",
    /** bulbul:v3 speaker id — default female voice for Soniqa. */
    val ttsSpeaker: String = "priya",
)

data class TelephonyProperties(
    val provider: String = "vobiz",
)

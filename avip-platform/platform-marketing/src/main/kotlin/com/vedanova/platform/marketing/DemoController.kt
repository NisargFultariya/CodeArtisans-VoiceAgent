package com.vedanova.platform.marketing

import com.vedanova.platform.config.AvipProperties
import com.vedanova.platform.demo.DemoAccessDeniedException
import com.vedanova.platform.demo.VoiceDemoTokenService
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.client.RestClientResponseException
import org.springframework.web.server.ResponseStatusException
import tools.jackson.databind.ObjectMapper

@Controller
class DemoController(
    private val demoLiveKitService: DemoLiveKitService,
    private val sarvamDemoClient: SarvamDemoClient,
    private val demoTranscriptLogService: DemoTranscriptLogService,
    private val avipProperties: AvipProperties,
    private val voiceDemoTokenService: VoiceDemoTokenService,
    private val objectMapper: ObjectMapper,
) {
    /** Exchange a magic-link token for an HttpOnly cookie (used by the React /demo page). */
    @GetMapping("/demo/grant-access")
    @ResponseBody
    fun grantAccess(@RequestParam("access") access: String): ResponseEntity<Void> {
        if (!avipProperties.voiceDemo.gateEnabled) {
            return ResponseEntity.noContent().build()
        }
        val token = access.trim().ifEmpty { null }
            ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "access token required")
        val claims = voiceDemoTokenService.validate(token)
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid or expired link")
        val maxAge = (claims.expiresAt.epochSecond - System.currentTimeMillis() / 1000).coerceAtLeast(60)
        return ResponseEntity
            .noContent()
            .header(HttpHeaders.SET_COOKIE, demoAccessCookie(token, maxAge.toInt()))
            .build()
    }

    @GetMapping("/demo/access-status")
    @ResponseBody
    fun accessStatus(request: HttpServletRequest): DemoAccessStatusResponse {
        if (!avipProperties.voiceDemo.gateEnabled) {
            return DemoAccessStatusResponse(granted = true)
        }
        val token = extractDemoToken(request)
        val granted =
            token?.let {
                try {
                    voiceDemoTokenService.requireValid(it)
                    true
                } catch (_: Exception) {
                    false
                }
            } ?: false
        return DemoAccessStatusResponse(granted = granted)
    }

    @PostMapping("/demo/session")
    @ResponseBody
    fun createSession(
        request: HttpServletRequest,
        @RequestParam("lang", required = false) lang: String?,
        @RequestParam("scenario", required = false) scenario: String?,
    ): DemoSessionResponse {
        requireDemoAccess(request)
        return demoLiveKitService.createSession(lang.orEmpty(), scenario.orEmpty())
    }

    @PostMapping("/demo/tts")
    fun tts(
        request: HttpServletRequest,
        @RequestBody req: DemoTtsRequest,
    ): ResponseEntity<ByteArray> {
        requireDemoAccess(request)
        val text = req.text.trim()
        if (text.isEmpty()) {
            return ResponseEntity.badRequest().build()
        }
        val apiKey = avipProperties.sarvam.apiKey
        if (apiKey.isBlank()) {
            return ResponseEntity.status(HttpStatus.PRECONDITION_FAILED).build()
        }
        val lang = DemoLanguage.normalize(req.lang)
        val speaker =
            req.speaker.trim().ifBlank { avipProperties.sarvam.ttsSpeaker }
                .ifBlank { SarvamDemoClient.DEFAULT_SPEAKER }
        val audio =
            try {
                sarvamDemoClient.synthesize(
                    apiKey,
                    text,
                    lang,
                    speaker,
                )
            } catch (ex: RestClientResponseException) {
                return sarvamErrorResponse(ex.statusCode.value(), ex.responseBodyAsString)
            } catch (ex: Exception) {
                return sarvamErrorResponse(null, ex.message)
            }
        val contentType = sarvamDemoClient.audioContentType(audio)
        return ResponseEntity
            .ok()
            .header(HttpHeaders.CONTENT_TYPE, contentType)
            .header(HttpHeaders.CACHE_CONTROL, "no-store")
            .body(audio)
    }

    @PostMapping("/demo/transcribe")
    @ResponseBody
    fun transcribe(
        request: HttpServletRequest,
        @RequestParam("lang", required = false) lang: String?,
        @RequestBody wav: ByteArray,
    ): ResponseEntity<DemoTranscribeResponse> {
        requireDemoAccess(request)
        if (wav.size < 44) {
            return ResponseEntity.badRequest().build()
        }
        if (wav.size > MAX_DEMO_AUDIO_BYTES) {
            return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).build()
        }
        val apiKey = avipProperties.sarvam.apiKey
        if (apiKey.isBlank()) {
            return ResponseEntity.status(HttpStatus.PRECONDITION_FAILED).build()
        }
        val normalizedLang = DemoLanguage.normalize(lang)
        val text =
            try {
                sarvamDemoClient.transcribeWav(apiKey, wav, normalizedLang).trim()
            } catch (ex: RestClientResponseException) {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(DemoTranscribeResponse(text = sarvamErrorMessage(ex.statusCode.value(), ex.responseBodyAsString)))
            } catch (_: Exception) {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build()
            }
        return ResponseEntity.ok(DemoTranscribeResponse(text = text))
    }

    @PostMapping("/demo/transcript-log")
    @ResponseBody
    fun saveTranscriptLog(
        request: HttpServletRequest,
        @RequestBody body: DemoTranscriptLogRequest,
    ): DemoTranscriptLogResponse {
        requireDemoAccess(request)
        if (body.id.isBlank() || body.roomName.isBlank()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "id and roomName required")
        }
        val email =
            extractDemoToken(request)?.let { token ->
                try {
                    voiceDemoTokenService.validate(token)?.email
                } catch (_: Exception) {
                    null
                }
            }
        return demoTranscriptLogService.save(
            body.copy(participantEmail = body.participantEmail ?: email),
        )
    }

    private fun requireDemoAccess(request: HttpServletRequest) {
        if (!avipProperties.voiceDemo.gateEnabled) return
        val token = extractDemoToken(request)
        try {
            if (token == null) throw DemoAccessDeniedException("demo access required")
            voiceDemoTokenService.requireValid(token)
        } catch (_: DemoAccessDeniedException) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "demo access required")
        }
    }

    private fun extractDemoToken(request: HttpServletRequest): String? {
        val auth = request.getHeader(HttpHeaders.AUTHORIZATION).orEmpty()
        if (auth.startsWith("Bearer ", ignoreCase = true)) {
            return auth.substring(7).trim().ifEmpty { null }
        }
        request.getHeader("X-AVIP-Demo-Token")?.trim()?.ifEmpty { null }?.let { return it }
        return request.cookies
            ?.firstOrNull { it.name == avipProperties.voiceDemo.accessCookieName }
            ?.value
            ?.trim()
            ?.ifEmpty { null }
    }

    private fun demoAccessCookie(token: String, maxAgeSeconds: Int): String {
        val name = avipProperties.voiceDemo.accessCookieName
        return "$name=$token; Path=/; Max-Age=$maxAgeSeconds; HttpOnly; SameSite=Lax"
    }

    private fun sarvamErrorResponse(
        httpStatus: Int?,
        body: String?,
    ): ResponseEntity<ByteArray> =
        ResponseEntity
            .status(HttpStatus.BAD_GATEWAY)
            .header(HttpHeaders.CONTENT_TYPE, MediaType.TEXT_PLAIN_VALUE)
            .body(sarvamErrorMessage(httpStatus, body).toByteArray())

    private fun sarvamErrorMessage(
        httpStatus: Int?,
        body: String?,
    ): String {
        val trimmed = body?.trim().orEmpty()
        if (trimmed.startsWith("{")) {
            try {
                val msg = objectMapper.readTree(trimmed).path("error").path("message").asText("").trim()
                if (msg.isNotEmpty()) return msg
            } catch (_: Exception) {
                // fall through
            }
        }
        if (httpStatus != null) return "Sarvam TTS failed (HTTP $httpStatus)"
        return trimmed.ifBlank { "Sarvam TTS failed" }
    }

    companion object {
        private const val MAX_DEMO_AUDIO_BYTES = 5 * 1024 * 1024
    }
}

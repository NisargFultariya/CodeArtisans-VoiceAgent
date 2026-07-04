package com.vedanova.platform.marketing

import tools.jackson.databind.ObjectMapper
import org.springframework.http.MediaType
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import java.util.Base64

@Component
class SarvamDemoClient(
    private val objectMapper: ObjectMapper,
) {
    private val restClient = RestClient.create()

    fun transcribeWav(
        apiKey: String,
        wav: ByteArray,
        languageCode: String,
    ): String {
        require(apiKey.isNotBlank()) { "SARVAM_API_KEY not configured" }
        val boundary = "----AvipDemo${System.nanoTime()}"
        val fields =
            buildMap {
                put("model", "saaras:v3")
                put("mode", "transcribe")
                if (languageCode.isNotBlank()) put("language_code", languageCode)
            }
        val body =
            buildMultipartBody(
                boundary = boundary,
                fields = fields,
                fileField = "file",
                fileName = "audio.wav",
                fileContentType = "audio/wav",
                fileBytes = wav,
            )

        val raw =
            restClient
                .post()
                .uri(SPEECH_TO_TEXT_URL)
                .header("api-subscription-key", apiKey)
                .header("Content-Type", "multipart/form-data; boundary=$boundary")
                .body(body)
                .retrieve()
                .body(String::class.java)
                .orEmpty()

        return parseTranscript(raw)
    }

    fun synthesize(
        apiKey: String,
        text: String,
        languageCode: String,
        speaker: String = DEFAULT_SPEAKER,
    ): ByteArray {
        require(apiKey.isNotBlank()) { "SARVAM_API_KEY not configured" }
        val payload =
            mapOf(
                "text" to text,
                "target_language_code" to languageCode,
                "model" to "bulbul:v3",
                "speaker" to speaker.ifBlank { DEFAULT_SPEAKER },
                "speech_sample_rate" to 24000,
            )

        val raw =
            restClient
                .post()
                .uri(TEXT_TO_SPEECH_URL)
                .header("api-subscription-key", apiKey)
                .header("Content-Type", "application/json")
                .body(payload)
                .retrieve()
                .body(ByteArray::class.java)
                ?: byteArrayOf()

        return parseAudio(raw)
    }

    fun audioContentType(audio: ByteArray): String =
        if (audio.size >= 3 && audio.copyOfRange(0, 3).decodeToString() == "RIFF") {
            "audio/wav"
        } else {
            MediaType.APPLICATION_OCTET_STREAM_VALUE
        }

    private fun parseTranscript(raw: String): String {
        val trimmed = raw.trim()
        if (trimmed.isEmpty()) return ""
        if (trimmed.startsWith("<")) return ""
        if (!trimmed.startsWith("{")) return trimmed
        return try {
            val tree = objectMapper.readTree(trimmed)
            sequenceOf("transcript", "text")
                .mapNotNull { field -> tree.get(field)?.asText()?.trim() }
                .firstOrNull()
                .orEmpty()
        } catch (_: Exception) {
            ""
        }
    }

    private fun parseAudio(raw: ByteArray): ByteArray {
        if (raw.size >= 3 && raw.copyOfRange(0, 3).decodeToString() == "RIFF") {
            return raw
        }
        return try {
            val tree = objectMapper.readTree(raw)
            val encoded = tree.get("audios")?.get(0)?.asText()?.trim().orEmpty()
            if (encoded.isEmpty()) raw else decodeMaybeBase64(encoded)
        } catch (_: Exception) {
            raw
        }
    }

    private fun decodeMaybeBase64(value: String): ByteArray {
        if (value.isEmpty()) return byteArrayOf()
        return try {
            Base64.getDecoder().decode(value)
        } catch (_: IllegalArgumentException) {
            byteArrayOf()
        }
    }

    private fun buildMultipartBody(
        boundary: String,
        fields: Map<String, String>,
        fileField: String,
        fileName: String,
        fileContentType: String,
        fileBytes: ByteArray,
    ): ByteArray {
        val crlf = "\r\n"
        val out = StringBuilder()
        for ((key, value) in fields) {
            out.append("--").append(boundary).append(crlf)
            out.append("Content-Disposition: form-data; name=\"").append(key).append('"').append(crlf)
            out.append(crlf)
            out.append(value).append(crlf)
        }
        out.append("--").append(boundary).append(crlf)
        out.append("Content-Disposition: form-data; name=\"").append(fileField).append("\"; filename=\"")
            .append(fileName).append('"').append(crlf)
        out.append("Content-Type: ").append(fileContentType).append(crlf)
        out.append(crlf)
        val prefix = out.toString().toByteArray()
        val suffix = (crlf + "--" + boundary + "--" + crlf).toByteArray()
        return prefix + fileBytes + suffix
    }

    companion object {
        private const val SPEECH_TO_TEXT_URL = "https://api.sarvam.ai/speech-to-text"
        private const val TEXT_TO_SPEECH_URL = "https://api.sarvam.ai/text-to-speech"
        const val DEFAULT_SPEAKER = "priya"
    }
}

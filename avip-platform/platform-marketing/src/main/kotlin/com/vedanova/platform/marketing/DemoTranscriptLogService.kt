package com.vedanova.platform.marketing

import com.vedanova.platform.config.AvipProperties
import com.vedanova.platform.persistence.DemoTranscriptLogRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.time.LocalDate
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter

@Service
class DemoTranscriptLogService(
    private val repository: DemoTranscriptLogRepository,
    private val avipProperties: AvipProperties,
) {
    fun save(request: DemoTranscriptLogRequest): DemoTranscriptLogResponse {
        if (!avipProperties.voiceDemo.transcriptLogEnabled) {
            return DemoTranscriptLogResponse(saved = false, id = request.id)
        }
        val lines = request.lines.filter { it.isNotBlank() }
        if (lines.isEmpty()) {
            return DemoTranscriptLogResponse(saved = false, id = request.id)
        }

        val transcript = lines.joinToString("\n")
        val row =
            repository.upsert(
                id = request.id,
                roomName = request.roomName,
                participantEmail = request.participantEmail?.trim()?.ifBlank { null },
                language = request.language?.trim()?.ifBlank { null },
                scenario = request.scenario?.trim()?.ifBlank { null },
                voice = request.voice?.trim()?.ifBlank { null },
                inputMode = request.inputMode?.trim()?.ifBlank { null },
                status = request.status.trim().ifBlank { "unknown" },
                transcript = transcript,
                lineCount = lines.size,
            )

        val filePath = writeFile(row)
        log.info(
            "demo transcript saved id={} room={} status={} lines={} file={}",
            row.id,
            row.roomName,
            row.status,
            row.lineCount,
            filePath?.toString() ?: "-",
        )
        return DemoTranscriptLogResponse(
            saved = true,
            id = row.id,
            filePath = filePath?.toString(),
        )
    }

    private fun writeFile(row: com.vedanova.platform.persistence.DemoTranscriptLogRow): Path? {
        val dirSetting = avipProperties.voiceDemo.transcriptLogDir.trim()
        if (dirSetting.isEmpty()) return null
        return try {
            val base = Paths.get(dirSetting)
            val day = LocalDate.ofInstant(row.updatedAt, ZoneOffset.UTC)
            val dayDir = base.resolve(day.format(DateTimeFormatter.ISO_LOCAL_DATE))
            Files.createDirectories(dayDir)
            val safeRoom = row.roomName.replace(Regex("[^a-zA-Z0-9._-]"), "_")
            val file = dayDir.resolve("${row.id}_${safeRoom}.log")
            val header =
                buildString {
                    appendLine("# Soniqa demo transcript")
                    appendLine("id: ${row.id}")
                    appendLine("room: ${row.roomName}")
                    appendLine("email: ${row.participantEmail ?: "-"}")
                    appendLine("language: ${row.language ?: "-"}")
                    appendLine("scenario: ${row.scenario ?: "-"}")
                    appendLine("voice: ${row.voice ?: "-"}")
                    appendLine("input_mode: ${row.inputMode ?: "-"}")
                    appendLine("status: ${row.status}")
                    appendLine("lines: ${row.lineCount}")
                    appendLine("updated_at: ${row.updatedAt}")
                    appendLine("---")
                }
            Files.writeString(file, header + row.transcript + "\n")
            file
        } catch (ex: Exception) {
            log.warn("demo transcript file write failed id={}: {}", row.id, ex.message)
            null
        }
    }

    companion object {
        private val log = LoggerFactory.getLogger(DemoTranscriptLogService::class.java)
    }
}

package com.vedanova.platform.persistence

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate
import org.springframework.stereotype.Repository
import java.time.Instant

@Repository
class OutboundCallRepository(
    private val jdbc: NamedParameterJdbcTemplate,
) {
    fun create(
        id: String,
        phoneNumber: String?,
        scenario: String,
        language: String,
        voice: String,
        mode: String,
        status: String,
        customerName: String? = null,
        systemPrompt: String? = null,
        customData: String? = null,
        agentName: String? = null,
    ) {
        jdbc.update(
            """
            INSERT INTO outbound_calls (
                id, phone_number, scenario, language, voice, mode, status, started_at, created_at, updated_at,
                customer_name, system_prompt, custom_data, agent_name
            ) VALUES (
                :id, :phoneNumber, :scenario, :language, :voice, :mode, :status, NOW(), NOW(), NOW(),
                :customerName, :systemPrompt, :customData::jsonb, :agentName
            )
            """.trimIndent(),
            MapSqlParameterSource()
                .addValue("id", id)
                .addValue("phoneNumber", phoneNumber)
                .addValue("scenario", scenario)
                .addValue("language", language)
                .addValue("voice", voice)
                .addValue("mode", mode)
                .addValue("status", status)
                .addValue("customerName", customerName)
                .addValue("systemPrompt", systemPrompt)
                .addValue("customData", customData)
                .addValue("agentName", agentName)
        )
    }

    fun updateStatus(
        id: String,
        status: String,
        outcome: String? = null,
        durationSeconds: Int? = null,
        transcript: String? = null,
        recordingUrl: String? = null
    ) {
        val endedAt = if (status == "COMPLETED" || status == "FAILED" || status == "CANCELLED") java.sql.Timestamp.from(Instant.now()) else null
        val answeredAt = if (status == "CONNECTED") java.sql.Timestamp.from(Instant.now()) else null
        
        jdbc.update(
            """
            UPDATE outbound_calls
            SET status = :status,
                outcome = COALESCE(:outcome, outcome),
                duration = COALESCE(:duration, duration),
                transcript = COALESCE(:transcript, transcript),
                recording_url = COALESCE(:recordingUrl, recording_url),
                answered_at = COALESCE(:answeredAt, answered_at),
                ended_at = COALESCE(:endedAt, ended_at),
                updated_at = NOW()
            WHERE id = :id
            """.trimIndent(),
            MapSqlParameterSource()
                .addValue("id", id)
                .addValue("status", status)
                .addValue("outcome", outcome?.takeIf { it.isNotBlank() })
                .addValue("duration", durationSeconds)
                .addValue("transcript", transcript?.takeIf { it.isNotBlank() })
                .addValue("recordingUrl", recordingUrl?.takeIf { it.isNotBlank() })
                .addValue("answeredAt", answeredAt)
                .addValue("endedAt", endedAt)
        )
    }

    fun updateDetails(id: String, roomName: String, workflowId: String) {
        jdbc.update(
            """
            UPDATE outbound_calls
            SET room_name = :roomName,
                workflow_id = :workflowId,
                livekit_room = :roomName,
                updated_at = NOW()
            WHERE id = :id
            """.trimIndent(),
            MapSqlParameterSource()
                .addValue("id", id)
                .addValue("roomName", roomName)
                .addValue("workflowId", workflowId)
        )
    }

    fun appendTranscriptLine(id: String, line: String) {
        jdbc.update(
            """
            UPDATE outbound_calls
            SET transcript = CASE 
                WHEN transcript IS NULL OR transcript = '' THEN :line 
                ELSE transcript || CHR(10) || :line 
            END,
            updated_at = NOW()
            WHERE id = :id
            """.trimIndent(),
            MapSqlParameterSource()
                .addValue("id", id)
                .addValue("line", line)
        )
    }

    fun get(id: String): OutboundCallRow? {
        return jdbc.query(
            "SELECT * FROM outbound_calls WHERE id = :id",
            MapSqlParameterSource("id", id)
        ) { rs, _ ->
            OutboundCallRow(
                id = rs.getString("id"),
                phoneNumber = rs.getString("phone_number"),
                status = rs.getString("status"),
                workflowId = rs.getString("workflow_id"),
                roomName = rs.getString("room_name"),
                agentName = rs.getString("agent_name"),
                language = rs.getString("language"),
                voice = rs.getString("voice"),
                scenario = rs.getString("scenario"),
                mode = rs.getString("mode"),
                startedAt = rs.getTimestamp("started_at")?.toInstant(),
                answeredAt = rs.getTimestamp("answered_at")?.toInstant(),
                endedAt = rs.getTimestamp("ended_at")?.toInstant(),
                duration = rs.getObject("duration") as Int?,
                recordingUrl = rs.getString("recording_url"),
                transcriptUrl = rs.getString("transcript_url"),
                twilioCallSid = rs.getString("twilio_call_sid"),
                livekitRoom = rs.getString("livekit_room"),
                transcript = rs.getString("transcript"),
                summary = rs.getString("summary"),
                outcome = rs.getString("outcome"),
                customerName = rs.getString("customer_name"),
                systemPrompt = rs.getString("system_prompt"),
                customData = rs.getString("custom_data")
            )
        }.firstOrNull()
    }

    fun listRecent(limit: Int): List<OutboundCallRow> {
        val capped = limit.coerceIn(1, 200)
        return jdbc.query(
            "SELECT * FROM outbound_calls ORDER BY created_at DESC LIMIT :limit",
            MapSqlParameterSource("limit", capped)
        ) { rs, _ ->
            OutboundCallRow(
                id = rs.getString("id"),
                phoneNumber = rs.getString("phone_number"),
                status = rs.getString("status"),
                workflowId = rs.getString("workflow_id"),
                roomName = rs.getString("room_name"),
                agentName = rs.getString("agent_name"),
                language = rs.getString("language"),
                voice = rs.getString("voice"),
                scenario = rs.getString("scenario"),
                mode = rs.getString("mode"),
                startedAt = rs.getTimestamp("started_at")?.toInstant(),
                answeredAt = rs.getTimestamp("answered_at")?.toInstant(),
                endedAt = rs.getTimestamp("ended_at")?.toInstant(),
                duration = rs.getObject("duration") as Int?,
                recordingUrl = rs.getString("recording_url"),
                transcriptUrl = rs.getString("transcript_url"),
                twilioCallSid = rs.getString("twilio_call_sid"),
                livekitRoom = rs.getString("livekit_room"),
                transcript = rs.getString("transcript"),
                summary = rs.getString("summary"),
                outcome = rs.getString("outcome"),
                customerName = rs.getString("customer_name"),
                systemPrompt = rs.getString("system_prompt"),
                customData = rs.getString("custom_data")
            )
        }
    }
}

data class OutboundCallRow(
    val id: String,
    val phoneNumber: String?,
    val status: String,
    val workflowId: String?,
    val roomName: String?,
    val agentName: String?,
    val language: String?,
    val voice: String?,
    val scenario: String?,
    val mode: String,
    val startedAt: Instant?,
    val answeredAt: Instant?,
    val endedAt: Instant?,
    val duration: Int?,
    val recordingUrl: String?,
    val transcriptUrl: String?,
    val twilioCallSid: String?,
    val livekitRoom: String?,
    val transcript: String?,
    val summary: String?,
    val outcome: String?,
    val customerName: String? = null,
    val systemPrompt: String? = null,
    val customData: String? = null
)

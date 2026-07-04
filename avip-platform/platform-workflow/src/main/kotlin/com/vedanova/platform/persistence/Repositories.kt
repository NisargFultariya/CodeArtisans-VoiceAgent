package com.vedanova.platform.persistence

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate
import org.springframework.stereotype.Repository
import java.sql.ResultSet
import java.time.Instant
import java.util.UUID

@Repository
class ShopRepository(
    private val jdbc: NamedParameterJdbcTemplate,
) {
    fun getById(id: String): Shop? =
        jdbc.query(
            """
            SELECT id, shop_domain, account_id, access_token_encrypted, scopes
            FROM shops
            WHERE id = :id AND uninstalled_at IS NULL
            """.trimIndent(),
            MapSqlParameterSource("id", id),
        ) { rs, _ -> mapShop(rs) }
            .firstOrNull()

    fun getByDomain(domain: String): Shop? =
        jdbc.query(
            """
            SELECT id, shop_domain, account_id, access_token_encrypted, scopes
            FROM shops
            WHERE shop_domain = :domain AND uninstalled_at IS NULL
            """.trimIndent(),
            MapSqlParameterSource("domain", domain),
        ) { rs, _ -> mapShop(rs) }
            .firstOrNull()

    fun upsertOAuth(domain: String, tokenEncrypted: String, scopes: String): Shop {
        val id = UUID.randomUUID().toString().replace("-", "")
        val params =
            MapSqlParameterSource()
                .addValue("id", id)
                .addValue("domain", domain)
                .addValue("token", tokenEncrypted)
                .addValue("scopes", scopes)
        return jdbc.queryForObject(
            """
            INSERT INTO shops (id, shop_domain, access_token_encrypted, scopes, installed_at, updated_at)
            VALUES (:id, :domain, :token, :scopes, NOW(), NOW())
            ON CONFLICT (shop_domain) DO UPDATE SET
              access_token_encrypted = EXCLUDED.access_token_encrypted,
              scopes = EXCLUDED.scopes,
              installed_at = NOW(),
              uninstalled_at = NULL,
              updated_at = NOW()
            RETURNING id, shop_domain, account_id, access_token_encrypted, scopes
            """.trimIndent(),
            params,
        ) { rs, _ -> mapShop(rs) }!!
    }

    fun ensureShop(domain: String, tokenEncrypted: String? = null): Shop {
        getByDomain(domain)?.let { return it }
        val id = UUID.randomUUID().toString().replace("-", "")
        val params =
            MapSqlParameterSource()
                .addValue("id", id)
                .addValue("domain", domain)
                .addValue("token", tokenEncrypted)
        return jdbc.queryForObject(
            """
            INSERT INTO shops (id, shop_domain, access_token_encrypted, installed_at, updated_at)
            VALUES (:id, :domain, :token, NOW(), NOW())
            ON CONFLICT (shop_domain) DO UPDATE SET
              updated_at = NOW(),
              uninstalled_at = NULL
            RETURNING id, shop_domain, account_id, access_token_encrypted, scopes
            """.trimIndent(),
            params,
        ) { rs, _ -> mapShop(rs) }!!
    }

    fun linkToAccount(shopId: String, accountId: String): Shop? {
        val params =
            MapSqlParameterSource()
                .addValue("shopId", shopId)
                .addValue("accountId", accountId)
        return jdbc.query(
            """
            UPDATE shops
            SET account_id = :accountId, updated_at = NOW()
            WHERE id = :shopId AND uninstalled_at IS NULL
            RETURNING id, shop_domain, account_id, access_token_encrypted, scopes
            """.trimIndent(),
            params,
        ) { rs, _ -> mapShop(rs) }
            .firstOrNull()
    }

    fun listForAccount(accountId: String): List<Shop> =
        jdbc.query(
            """
            SELECT id, shop_domain, account_id, access_token_encrypted, scopes
            FROM shops
            WHERE account_id = :accountId AND uninstalled_at IS NULL
            ORDER BY shop_domain ASC
            """.trimIndent(),
            MapSqlParameterSource("accountId", accountId),
        ) { rs, _ -> mapShop(rs) }

    fun listAll(limit: Int): List<ShopSummary> {
        val capped = limit.coerceIn(1, 200)
        return jdbc.query(
            """
            SELECT
              s.id,
              s.shop_domain,
              s.account_id,
              s.installed_at,
              COUNT(c.id)::bigint AS call_count
            FROM shops s
            LEFT JOIN calls c ON c.shop_id = s.id
            WHERE s.uninstalled_at IS NULL
            GROUP BY s.id, s.shop_domain, s.account_id, s.installed_at
            ORDER BY s.installed_at DESC NULLS LAST, s.shop_domain ASC
            LIMIT :limit
            """.trimIndent(),
            MapSqlParameterSource("limit", capped),
        ) { rs, _ ->
            ShopSummary(
                id = rs.getString("id"),
                shopDomain = rs.getString("shop_domain"),
                accountId = rs.getString("account_id"),
                installedAt = rs.getTimestamp("installed_at")?.toInstant(),
                callCount = rs.getLong("call_count"),
            )
        }
    }

    fun countActive(): Long =
        jdbc.queryForObject(
            """
            SELECT COUNT(*)::bigint
            FROM shops
            WHERE uninstalled_at IS NULL
            """.trimIndent(),
            MapSqlParameterSource(),
            Long::class.java,
        ) ?: 0L

    private fun mapShop(rs: ResultSet) =
        Shop(
            id = rs.getString("id"),
            shopDomain = rs.getString("shop_domain"),
            accountId = rs.getString("account_id"),
            accessTokenEncrypted = rs.getString("access_token_encrypted"),
            scopes = rs.getString("scopes"),
        )
}

@Repository
class CallRepository(
    private val jdbc: NamedParameterJdbcTemplate,
) {
    fun listRecentGlobal(limit: Int): List<AdminCallRow> {
        val capped = limit.coerceIn(1, 200)
        return jdbc.query(
            """
            SELECT
              c.shop_id,
              s.shop_domain,
              c.order_id,
              c.status,
              c.outcome,
              c.workflow_id,
              c.duration_seconds,
              c.updated_at
            FROM calls c
            JOIN shops s ON s.id = c.shop_id
            ORDER BY c.updated_at DESC
            LIMIT :limit
            """.trimIndent(),
            MapSqlParameterSource("limit", capped),
        ) { rs, _ ->
            AdminCallRow(
                shopId = rs.getString("shop_id"),
                shopDomain = rs.getString("shop_domain"),
                orderId = rs.getString("order_id"),
                status = rs.getString("status"),
                outcome = rs.getString("outcome"),
                workflowId = rs.getString("workflow_id"),
                durationSeconds = rs.getObject("duration_seconds") as Int?,
                updatedAt = rs.getTimestamp("updated_at").toInstant(),
            )
        }
    }

    fun listRecentByShop(shopId: String, limit: Int): List<CallRow> {
        val capped = limit.coerceIn(1, 100).let { if (it <= 0) 30 else it }
        return jdbc.query(
            """
            SELECT order_id, status, outcome, workflow_id, duration_seconds, updated_at
            FROM calls
            WHERE shop_id = :shopId
            ORDER BY updated_at DESC
            LIMIT :limit
            """.trimIndent(),
            MapSqlParameterSource()
                .addValue("shopId", shopId)
                .addValue("limit", capped),
        ) { rs, _ ->
            CallRow(
                orderId = rs.getString("order_id"),
                status = rs.getString("status"),
                outcome = rs.getString("outcome"),
                workflowId = rs.getString("workflow_id"),
                durationSeconds = rs.getObject("duration_seconds") as Int?,
                updatedAt = rs.getTimestamp("updated_at").toInstant(),
            )
        }
    }

    fun upsertDispatching(
        shopId: String,
        orderId: String,
        workflowId: String,
        roomName: String,
    ): String {
        val id = UUID.randomUUID().toString().replace("-", "")
        return jdbc.queryForObject(
            """
            INSERT INTO calls (id, shop_id, order_id, workflow_id, room_name, status)
            VALUES (:id, :shopId, :orderId, :workflowId, :roomName, 'dispatching')
            ON CONFLICT (shop_id, order_id) DO UPDATE SET
              workflow_id = EXCLUDED.workflow_id,
              room_name = EXCLUDED.room_name,
              status = 'dispatching',
              updated_at = NOW()
            RETURNING id
            """.trimIndent(),
            MapSqlParameterSource()
                .addValue("id", id)
                .addValue("shopId", shopId)
                .addValue("orderId", orderId)
                .addValue("workflowId", workflowId)
                .addValue("roomName", roomName),
            String::class.java,
        ) ?: id
    }

    fun updateStatus(
        shopId: String,
        orderId: String,
        status: String,
        outcome: String?,
        durationSeconds: Int?,
    ) {
        jdbc.update(
            """
            UPDATE calls
            SET status = :status,
                outcome = :outcome,
                duration_seconds = COALESCE(:duration, duration_seconds),
                updated_at = NOW()
            WHERE shop_id = :shopId AND order_id = :orderId
            """.trimIndent(),
            MapSqlParameterSource()
                .addValue("shopId", shopId)
                .addValue("orderId", orderId)
                .addValue("status", status)
                .addValue("outcome", outcome?.takeIf { it.isNotBlank() })
                .addValue("duration", durationSeconds),
        )
    }

    fun attachRecordingKey(shopId: String, orderId: String, objectKey: String) {
        jdbc.update(
            """
            UPDATE calls
            SET recording_object_key = :objectKey,
                updated_at = NOW()
            WHERE shop_id = :shopId AND order_id = :orderId
            """.trimIndent(),
            MapSqlParameterSource()
                .addValue("shopId", shopId)
                .addValue("orderId", orderId)
                .addValue("objectKey", objectKey),
        )
    }

    fun updateNdrStage(shopId: String, orderId: String, ndrStage: String) {
        jdbc.update(
            """
            UPDATE calls
            SET ndr_stage = :ndrStage,
                updated_at = NOW()
            WHERE shop_id = :shopId AND order_id = :orderId
            """.trimIndent(),
            MapSqlParameterSource()
                .addValue("shopId", shopId)
                .addValue("orderId", orderId)
                .addValue("ndrStage", ndrStage),
        )
    }
}

@Repository
class PreferencesRepository(
    private val jdbc: NamedParameterJdbcTemplate,
) {
    fun get(shopId: String): ShopPreferences? =
        jdbc.query(
            """
            SELECT shop_id, default_language, auto_webhook, escalation_email_enabled, updated_at
            FROM shop_preferences
            WHERE shop_id = :shopId
            """.trimIndent(),
            MapSqlParameterSource("shopId", shopId),
        ) { rs, _ -> mapPrefs(rs) }
            .firstOrNull()

    fun upsert(prefs: ShopPreferences): ShopPreferences {
        val params =
            MapSqlParameterSource()
                .addValue("shopId", prefs.shopId)
                .addValue("lang", prefs.defaultLanguage)
                .addValue("autoWebhook", prefs.autoWebhook)
                .addValue("escalationEmail", prefs.escalationEmailEnabled)
        return jdbc.queryForObject(
            """
            INSERT INTO shop_preferences (shop_id, default_language, auto_webhook, escalation_email_enabled, updated_at)
            VALUES (:shopId, :lang, :autoWebhook, :escalationEmail, NOW())
            ON CONFLICT (shop_id) DO UPDATE SET
              default_language = EXCLUDED.default_language,
              auto_webhook = EXCLUDED.auto_webhook,
              escalation_email_enabled = EXCLUDED.escalation_email_enabled,
              updated_at = NOW()
            RETURNING shop_id, default_language, auto_webhook, escalation_email_enabled, updated_at
            """.trimIndent(),
            params,
        ) { rs, _ -> mapPrefs(rs) }!!
    }

    private fun mapPrefs(rs: ResultSet) =
        ShopPreferences(
            shopId = rs.getString("shop_id"),
            defaultLanguage = rs.getString("default_language"),
            autoWebhook = rs.getBoolean("auto_webhook"),
            escalationEmailEnabled = rs.getBoolean("escalation_email_enabled"),
            updatedAt = rs.getTimestamp("updated_at").toInstant(),
        )
}

@Repository
class PromptRepository(
    private val jdbc: NamedParameterJdbcTemplate,
) {
    fun getDefault(shopId: String): PromptProfile? =
        jdbc.query(
            """
            SELECT id, name, system_prompt, updated_at
            FROM prompt_profiles
            WHERE shop_id = :shopId AND is_default = TRUE
            LIMIT 1
            """.trimIndent(),
            MapSqlParameterSource("shopId", shopId),
        ) { rs, _ ->
            PromptProfile(
                id = rs.getString("id"),
                name = rs.getString("name"),
                systemPrompt = rs.getString("system_prompt"),
                updatedAt = rs.getTimestamp("updated_at").toInstant(),
            )
        }.firstOrNull()

    fun upsertDefault(shopId: String, systemPrompt: String): PromptProfile {
        val id = UUID.randomUUID().toString().replace("-", "")
        val params =
            MapSqlParameterSource()
                .addValue("id", id)
                .addValue("shopId", shopId)
                .addValue("prompt", systemPrompt)
        return jdbc.queryForObject(
            """
            WITH existing AS (
              SELECT id FROM prompt_profiles WHERE shop_id = :shopId AND is_default = TRUE LIMIT 1
            ),
            updated AS (
              UPDATE prompt_profiles
              SET system_prompt = :prompt, updated_at = NOW()
              WHERE id IN (SELECT id FROM existing)
              RETURNING id, name, system_prompt, updated_at
            ),
            inserted AS (
              INSERT INTO prompt_profiles (id, shop_id, name, system_prompt, is_default, updated_at)
              SELECT :id, :shopId, 'default', :prompt, TRUE, NOW()
              WHERE NOT EXISTS (SELECT 1 FROM existing)
              RETURNING id, name, system_prompt, updated_at
            )
            SELECT id, name, system_prompt, updated_at FROM updated
            UNION ALL
            SELECT id, name, system_prompt, updated_at FROM inserted
            LIMIT 1
            """.trimIndent(),
            params,
        ) { rs, _ ->
            PromptProfile(
                id = rs.getString("id"),
                name = rs.getString("name"),
                systemPrompt = rs.getString("system_prompt"),
                updatedAt = rs.getTimestamp("updated_at").toInstant(),
            )
        }!!
    }
}

@Repository
class AnalyticsRepository(
    private val jdbc: NamedParameterJdbcTemplate,
) {
    fun platformAnalytics(): PlatformAnalytics {
        val stats =
            jdbc.queryForMap(
                """
                SELECT
                  COUNT(*)::bigint AS total_calls,
                  COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW() AT TIME ZONE 'UTC'))::bigint AS calls_this_month,
                  COUNT(*) FILTER (WHERE status = 'completed')::bigint AS completed_calls,
                  COALESCE(AVG(duration_seconds) FILTER (WHERE duration_seconds IS NOT NULL), 0)::float8 AS avg_duration_seconds
                FROM calls
                """.trimIndent(),
                MapSqlParameterSource(),
            )
        val openEscalations =
            jdbc.queryForObject(
                """
                SELECT COUNT(*)::bigint
                FROM escalations
                WHERE status = 'open'
                """.trimIndent(),
                MapSqlParameterSource(),
                Long::class.java,
            ) ?: 0L
        val totalShops =
            jdbc.queryForObject(
                """
                SELECT COUNT(*)::bigint
                FROM shops
                WHERE uninstalled_at IS NULL
                """.trimIndent(),
                MapSqlParameterSource(),
                Long::class.java,
            ) ?: 0L
        return PlatformAnalytics(
            totalShops = totalShops,
            totalCalls = (stats["total_calls"] as Number).toLong(),
            callsThisMonth = (stats["calls_this_month"] as Number).toLong(),
            completedCalls = (stats["completed_calls"] as Number).toLong(),
            avgDurationSeconds = (stats["avg_duration_seconds"] as Number).toDouble(),
            openEscalations = openEscalations,
        )
    }

    fun shopAnalytics(shopId: String): ShopAnalytics {
        val stats =
            jdbc.queryForMap(
                """
                SELECT
                  COUNT(*)::bigint AS total_calls,
                  COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW() AT TIME ZONE 'UTC'))::bigint AS calls_this_month,
                  COUNT(*) FILTER (WHERE status = 'completed')::bigint AS completed_calls,
                  COALESCE(AVG(duration_seconds) FILTER (WHERE duration_seconds IS NOT NULL), 0)::float8 AS avg_duration_seconds
                FROM calls
                WHERE shop_id = :shopId
                """.trimIndent(),
                MapSqlParameterSource("shopId", shopId),
            )
        val openEscalations =
            jdbc.queryForObject(
                """
                SELECT COUNT(*)::bigint
                FROM escalations
                WHERE shop_id = :shopId AND status = 'open'
                """.trimIndent(),
                MapSqlParameterSource("shopId", shopId),
                Long::class.java,
            ) ?: 0L
        return ShopAnalytics(
            callsThisMonth = (stats["calls_this_month"] as Number).toLong(),
            totalCalls = (stats["total_calls"] as Number).toLong(),
            completedCalls = (stats["completed_calls"] as Number).toLong(),
            avgDurationSeconds = (stats["avg_duration_seconds"] as Number).toDouble(),
            openEscalations = openEscalations,
        )
    }
}

@Repository
class EscalationRepository(
    private val jdbc: NamedParameterJdbcTemplate,
) {
    fun listRecentGlobal(limit: Int): List<AdminEscalationRow> {
        val capped = limit.coerceIn(1, 200)
        return jdbc.query(
            """
            SELECT
              e.id,
              e.shop_id,
              s.shop_domain,
              e.order_id,
              e.reason,
              e.status,
              e.assignee,
              e.created_at,
              e.updated_at
            FROM escalations e
            JOIN shops s ON s.id = e.shop_id
            ORDER BY
              CASE e.status WHEN 'open' THEN 0 ELSE 1 END,
              e.updated_at DESC
            LIMIT :limit
            """.trimIndent(),
            MapSqlParameterSource("limit", capped),
        ) { rs, _ ->
            AdminEscalationRow(
                id = rs.getString("id"),
                shopId = rs.getString("shop_id"),
                shopDomain = rs.getString("shop_domain"),
                orderId = rs.getString("order_id"),
                reason = rs.getString("reason"),
                status = rs.getString("status"),
                assignee = rs.getString("assignee"),
                createdAt = rs.getTimestamp("created_at").toInstant(),
                updatedAt = rs.getTimestamp("updated_at").toInstant(),
            )
        }
    }

    fun listByShop(shopId: String, limit: Int): List<EscalationRow> {
        val capped = limit.coerceIn(1, 100).let { if (it <= 0) 50 else it }
        return jdbc.query(
            """
            SELECT id, order_id, reason, status, assignee, created_at, updated_at
            FROM escalations
            WHERE shop_id = :shopId
            ORDER BY
              CASE status WHEN 'open' THEN 0 ELSE 1 END,
              updated_at DESC
            LIMIT :limit
            """.trimIndent(),
            MapSqlParameterSource()
                .addValue("shopId", shopId)
                .addValue("limit", capped),
        ) { rs, _ ->
            EscalationRow(
                id = rs.getString("id"),
                orderId = rs.getString("order_id"),
                reason = rs.getString("reason"),
                status = rs.getString("status"),
                assignee = rs.getString("assignee"),
                createdAt = rs.getTimestamp("created_at").toInstant(),
                updatedAt = rs.getTimestamp("updated_at").toInstant(),
            )
        }
    }

    fun create(shopId: String, orderId: String, reason: String) {
        val id = UUID.randomUUID().toString().replace("-", "")
        jdbc.update(
            """
            INSERT INTO escalations (id, shop_id, order_id, reason, status)
            VALUES (:id, :shopId, :orderId, :reason, 'open')
            """.trimIndent(),
            MapSqlParameterSource()
                .addValue("id", id)
                .addValue("shopId", shopId)
                .addValue("orderId", orderId)
                .addValue("reason", reason.takeIf { it.isNotBlank() }),
        )
    }

    fun resolve(shopId: String, escalationId: String, assignee: String?) {
        jdbc.update(
            """
            UPDATE escalations
            SET status = 'resolved',
                assignee = COALESCE(:assignee, assignee),
                updated_at = NOW()
            WHERE id = :id AND shop_id = :shopId AND status = 'open'
            """.trimIndent(),
            MapSqlParameterSource()
                .addValue("id", escalationId)
                .addValue("shopId", shopId)
                .addValue("assignee", assignee?.takeIf { it.isNotBlank() }),
        )
    }
}

@Repository
class DemoRequestRepository(
    private val jdbc: NamedParameterJdbcTemplate,
) {
    fun insert(
        id: String,
        email: String,
        fullName: String?,
        company: String?,
        shopDomain: String?,
        monthlyVolume: String?,
        message: String?,
        source: String,
        demoShopId: String?,
    ): DemoRequestRow {
        val params =
            MapSqlParameterSource()
                .addValue("id", id)
                .addValue("email", email)
                .addValue("fullName", fullName)
                .addValue("company", company)
                .addValue("shopDomain", shopDomain)
                .addValue("monthlyVolume", monthlyVolume)
                .addValue("message", message)
                .addValue("source", source)
                .addValue("demoShopId", demoShopId)
        return jdbc.queryForObject(
            """
            INSERT INTO demo_requests (
              id, email, full_name, company, shop_domain, monthly_volume, message,
              source, status, demo_shop_id, created_at, updated_at
            )
            VALUES (
              :id, :email, :fullName, :company, :shopDomain, :monthlyVolume, :message,
              :source, 'new', :demoShopId, NOW(), NOW()
            )
            RETURNING
              id, email, full_name, company, shop_domain, monthly_volume, message,
              source, status, demo_shop_id, created_at, updated_at
            """.trimIndent(),
            params,
        ) { rs, _ -> mapRow(rs) }!!
    }

    fun listRecent(limit: Int): List<DemoRequestRow> {
        val capped = limit.coerceIn(1, 200)
        return jdbc.query(
            """
            SELECT
              id, email, full_name, company, shop_domain, monthly_volume, message,
              source, status, demo_shop_id, created_at, updated_at
            FROM demo_requests
            ORDER BY created_at DESC
            LIMIT :limit
            """.trimIndent(),
            MapSqlParameterSource("limit", capped),
        ) { rs, _ -> mapRow(rs) }
    }

    fun countNew(): Long =
        jdbc.queryForObject(
            """
            SELECT COUNT(*)::bigint
            FROM demo_requests
            WHERE status = 'new'
            """.trimIndent(),
            MapSqlParameterSource(),
            Long::class.java,
        ) ?: 0L

    private fun mapRow(rs: ResultSet) =
        DemoRequestRow(
            id = rs.getString("id"),
            email = rs.getString("email"),
            fullName = rs.getString("full_name"),
            company = rs.getString("company"),
            shopDomain = rs.getString("shop_domain"),
            monthlyVolume = rs.getString("monthly_volume"),
            message = rs.getString("message"),
            source = rs.getString("source"),
            status = rs.getString("status"),
            demoShopId = rs.getString("demo_shop_id"),
            createdAt = rs.getTimestamp("created_at").toInstant(),
            updatedAt = rs.getTimestamp("updated_at").toInstant(),
        )
}

@Repository
class DemoTranscriptLogRepository(
    private val jdbc: NamedParameterJdbcTemplate,
) {
    fun upsert(
        id: String,
        roomName: String,
        participantEmail: String?,
        language: String?,
        scenario: String?,
        voice: String?,
        inputMode: String?,
        status: String,
        transcript: String,
        lineCount: Int,
    ): DemoTranscriptLogRow {
        val params =
            MapSqlParameterSource()
                .addValue("id", id)
                .addValue("roomName", roomName)
                .addValue("participantEmail", participantEmail)
                .addValue("language", language)
                .addValue("scenario", scenario)
                .addValue("voice", voice)
                .addValue("inputMode", inputMode)
                .addValue("status", status)
                .addValue("transcript", transcript)
                .addValue("lineCount", lineCount)
        return jdbc.queryForObject(
            """
            INSERT INTO demo_transcript_logs (
              id, room_name, participant_email, language, scenario, voice, input_mode,
              status, transcript, line_count, created_at, updated_at
            )
            VALUES (
              :id, :roomName, :participantEmail, :language, :scenario, :voice, :inputMode,
              :status, :transcript, :lineCount, NOW(), NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
              room_name = EXCLUDED.room_name,
              participant_email = COALESCE(EXCLUDED.participant_email, demo_transcript_logs.participant_email),
              language = EXCLUDED.language,
              scenario = EXCLUDED.scenario,
              voice = EXCLUDED.voice,
              input_mode = EXCLUDED.input_mode,
              status = EXCLUDED.status,
              transcript = EXCLUDED.transcript,
              line_count = EXCLUDED.line_count,
              updated_at = NOW()
            RETURNING
              id, room_name, participant_email, language, scenario, voice, input_mode,
              status, transcript, line_count, created_at, updated_at
            """.trimIndent(),
            params,
        ) { rs, _ -> mapTranscriptRow(rs) }!!
    }

    private fun mapTranscriptRow(rs: ResultSet) =
        DemoTranscriptLogRow(
            id = rs.getString("id"),
            roomName = rs.getString("room_name"),
            participantEmail = rs.getString("participant_email"),
            language = rs.getString("language"),
            scenario = rs.getString("scenario"),
            voice = rs.getString("voice"),
            inputMode = rs.getString("input_mode"),
            status = rs.getString("status"),
            transcript = rs.getString("transcript"),
            lineCount = rs.getInt("line_count"),
            createdAt = rs.getTimestamp("created_at").toInstant(),
            updatedAt = rs.getTimestamp("updated_at").toInstant(),
        )
}

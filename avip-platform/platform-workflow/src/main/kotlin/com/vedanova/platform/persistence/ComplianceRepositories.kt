package com.vedanova.platform.persistence

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.UUID

data class OrderConsentRow(
    val shopId: String,
    val orderId: String,
    val customerPhone: String?,
    val consentSource: String,
    val grantedAt: Instant,
)

@Repository
class ComplianceRepository(
    private val jdbc: NamedParameterJdbcTemplate,
) {
    fun hasConsent(shopId: String, orderId: String): Boolean {
        val count =
            jdbc.queryForObject(
                """
                SELECT COUNT(*) FROM compliance.order_consent
                WHERE shop_id = :shopId AND order_id = :orderId
                """.trimIndent(),
                MapSqlParameterSource()
                    .addValue("shopId", shopId)
                    .addValue("orderId", orderId),
                Long::class.java,
            ) ?: 0L
        return count > 0
    }

    fun getConsent(shopId: String, orderId: String): OrderConsentRow? =
        jdbc.query(
            """
            SELECT shop_id, order_id, customer_phone, consent_source, granted_at
            FROM compliance.order_consent
            WHERE shop_id = :shopId AND order_id = :orderId
            """.trimIndent(),
            MapSqlParameterSource()
                .addValue("shopId", shopId)
                .addValue("orderId", orderId),
        ) { rs, _ ->
            OrderConsentRow(
                shopId = rs.getString("shop_id"),
                orderId = rs.getString("order_id"),
                customerPhone = rs.getString("customer_phone"),
                consentSource = rs.getString("consent_source"),
                grantedAt = rs.getTimestamp("granted_at").toInstant(),
            )
        }.firstOrNull()

    fun recordConsent(
        shopId: String,
        orderId: String,
        customerPhone: String?,
        source: String,
    ): OrderConsentRow {
        val id = UUID.randomUUID().toString().replace("-", "")
        return jdbc.queryForObject(
            """
            INSERT INTO compliance.order_consent (id, shop_id, order_id, customer_phone, consent_source, granted_at)
            VALUES (:id, :shopId, :orderId, :phone, :source, NOW())
            ON CONFLICT (shop_id, order_id) DO UPDATE SET
              customer_phone = COALESCE(EXCLUDED.customer_phone, compliance.order_consent.customer_phone),
              consent_source = EXCLUDED.consent_source,
              granted_at = NOW()
            RETURNING shop_id, order_id, customer_phone, consent_source, granted_at
            """.trimIndent(),
            MapSqlParameterSource()
                .addValue("id", id)
                .addValue("shopId", shopId)
                .addValue("orderId", orderId)
                .addValue("phone", customerPhone?.takeIf { it.isNotBlank() })
                .addValue("source", source.ifBlank { "checkout" }),
        ) { rs, _ ->
            OrderConsentRow(
                shopId = rs.getString("shop_id"),
                orderId = rs.getString("order_id"),
                customerPhone = rs.getString("customer_phone"),
                consentSource = rs.getString("consent_source"),
                grantedAt = rs.getTimestamp("granted_at").toInstant(),
            )
        }!!
    }

    fun isDnd(phoneE164: String): Boolean {
        val normalized = phoneE164.trim()
        if (normalized.isEmpty()) return false
        val count =
            jdbc.queryForObject(
                """
                SELECT COUNT(*) FROM compliance.dnd_numbers
                WHERE phone_e164 = :phone
                """.trimIndent(),
                MapSqlParameterSource("phone", normalized),
                Long::class.java,
            ) ?: 0L
        return count > 0
    }
}

@Repository
class AuditRepository(
    private val jdbc: NamedParameterJdbcTemplate,
) {
    fun log(
        shopId: String?,
        eventType: String,
        payload: String?,
    ) {
        val id = UUID.randomUUID().toString().replace("-", "")
        jdbc.update(
            """
            INSERT INTO audit.events (id, shop_id, event_type, payload, created_at)
            VALUES (:id, :shopId, :eventType, CAST(:payload AS JSONB), NOW())
            """.trimIndent(),
            MapSqlParameterSource()
                .addValue("id", id)
                .addValue("shopId", shopId)
                .addValue("eventType", eventType)
                .addValue("payload", payload ?: "{}"),
        )
    }
}

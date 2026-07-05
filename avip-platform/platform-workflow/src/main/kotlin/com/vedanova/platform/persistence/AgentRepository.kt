package com.vedanova.platform.persistence

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate
import org.springframework.stereotype.Repository
import java.time.Instant

@Repository
class AgentRepository(
    private val jdbc: NamedParameterJdbcTemplate,
) {
    fun getAllTemplates(): List<AgentTemplate> {
        return jdbc.query(
            "SELECT * FROM agent_templates ORDER BY name ASC",
            MapSqlParameterSource()
        ) { rs, _ ->
            AgentTemplate(
                id = rs.getString("id"),
                name = rs.getString("name"),
                type = rs.getString("type"),
                desc = rs.getString("desc"),
                icon = rs.getString("icon"),
                prompt = rs.getString("prompt"),
                fields = rs.getString("fields")
            )
        }
    }

    fun getAllAgents(): List<Agent> {
        return jdbc.query(
            "SELECT * FROM agents ORDER BY created_at DESC",
            MapSqlParameterSource()
        ) { rs, _ ->
            Agent(
                id = rs.getString("id"),
                name = rs.getString("name"),
                type = rs.getString("type"),
                template = rs.getString("template"),
                status = rs.getString("status"),
                color = rs.getString("color"),
                calls = rs.getInt("calls"),
                conv = rs.getInt("conv"),
                created = rs.getString("created"),
                config = rs.getString("config"),
                createdAt = rs.getTimestamp("created_at").toInstant()
            )
        }
    }

    fun createAgent(agent: Agent) {
        jdbc.update(
            """
            INSERT INTO agents (
                id, name, type, template, status, color, calls, conv, created, config, created_at
            ) VALUES (
                :id, :name, :type, :template, :status, :color, :calls, :conv, :created, :config::jsonb, :createdAt
            )
            """.trimIndent(),
            MapSqlParameterSource()
                .addValue("id", agent.id)
                .addValue("name", agent.name)
                .addValue("type", agent.type)
                .addValue("template", agent.template)
                .addValue("status", agent.status)
                .addValue("color", agent.color)
                .addValue("calls", agent.calls)
                .addValue("conv", agent.conv)
                .addValue("created", agent.created)
                .addValue("config", agent.config)
                .addValue("createdAt", java.sql.Timestamp.from(agent.createdAt))
        )
    }

    fun updateAgent(agent: Agent) {
        jdbc.update(
            """
            UPDATE agents
            SET name = :name,
                type = :type,
                template = :template,
                status = :status,
                color = :color,
                config = :config::jsonb
            WHERE id = :id
            """.trimIndent(),
            MapSqlParameterSource()
                .addValue("id", agent.id)
                .addValue("name", agent.name)
                .addValue("type", agent.type)
                .addValue("template", agent.template)
                .addValue("status", agent.status)
                .addValue("color", agent.color)
                .addValue("config", agent.config)
        )
    }

    fun updateAgentStatus(id: String, status: String) {
        jdbc.update(
            "UPDATE agents SET status = :status WHERE id = :id",
            MapSqlParameterSource()
                .addValue("id", id)
                .addValue("status", status)
        )
    }

    fun deleteAgent(id: String) {
        jdbc.update(
            "DELETE FROM agents WHERE id = :id",
            MapSqlParameterSource("id", id)
        )
    }
}

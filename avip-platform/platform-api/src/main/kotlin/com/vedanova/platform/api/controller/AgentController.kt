package com.vedanova.platform.api.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.vedanova.platform.persistence.Agent
import com.vedanova.platform.persistence.AgentRepository
import org.springframework.web.bind.annotation.*
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.UUID

@RestController
@RequestMapping("/api")
class AgentController(
    private val agentRepository: AgentRepository,
) {
    private val objectMapper = ObjectMapper().findAndRegisterModules()

    @GetMapping("/templates")
    fun getTemplates(): List<ApiAgentTemplate> {
        return agentRepository.getAllTemplates().map {
            ApiAgentTemplate(
                id = it.id,
                name = it.name,
                type = it.type,
                desc = it.desc,
                icon = it.icon,
                prompt = it.prompt,
                fields = it.fields?.let { str -> 
                    try {
                        objectMapper.readValue(str, Any::class.java)
                    } catch (e: Exception) {
                        null
                    }
                }
            )
        }
    }

    @GetMapping("/agents")
    fun getAgents(): List<ApiAgent> {
        return agentRepository.getAllAgents().map {
            ApiAgent(
                id = it.id,
                name = it.name,
                type = it.type,
                template = it.template,
                status = it.status,
                color = it.color,
                calls = it.calls,
                conv = it.conv,
                created = it.created,
                config = it.config?.let { str -> 
                    try {
                        objectMapper.readValue(str, Any::class.java)
                    } catch (e: Exception) {
                        null
                    }
                }
            )
        }
    }

    @PostMapping("/agents")
    fun createAgent(@RequestBody req: CreateAgentRequest): ApiAgent {
        val id = "agt_" + UUID.randomUUID().toString().replace("-", "").take(8)
        val formatter = DateTimeFormatter.ofPattern("MMM d, yyyy").withZone(ZoneId.systemDefault())
        val dateString = formatter.format(Instant.now())
        
        val configStr = req.config?.let { objectMapper.writeValueAsString(it) } ?: "{}"

        val agent = Agent(
            id = id,
            name = req.name.trim(),
            type = req.type.trim(),
            template = req.template.trim(),
            status = req.status?.trim() ?: "Active",
            color = req.color?.trim() ?: "#FF5C73",
            calls = req.calls ?: 0,
            conv = req.conv ?: 0,
            created = dateString,
            config = configStr,
            createdAt = Instant.now()
        )
        
        agentRepository.createAgent(agent)

        return ApiAgent(
            id = agent.id,
            name = agent.name,
            type = agent.type,
            template = agent.template,
            status = agent.status,
            color = agent.color,
            calls = agent.calls,
            conv = agent.conv,
            created = agent.created,
            config = agent.config?.let { str -> 
                try {
                    objectMapper.readValue(str, Any::class.java)
                } catch (e: Exception) {
                    null
                }
            }
        )
    }

    @PutMapping("/agents/{id}")
    fun updateAgent(@PathVariable id: String, @RequestBody req: CreateAgentRequest): ApiAgent {
        val configStr = req.config?.let { objectMapper.writeValueAsString(it) } ?: "{}"
        
        val agent = Agent(
            id = id,
            name = req.name.trim(),
            type = req.type.trim(),
            template = req.template.trim(),
            status = req.status?.trim() ?: "Active",
            color = req.color?.trim(),
            config = configStr,
            created = null
        )
        
        agentRepository.updateAgent(agent)

        return ApiAgent(
            id = agent.id,
            name = agent.name,
            type = agent.type,
            template = agent.template,
            status = agent.status,
            color = agent.color,
            calls = req.calls ?: 0,
            conv = req.conv ?: 0,
            created = null,
            config = agent.config?.let { str -> 
                try {
                    objectMapper.readValue(str, Any::class.java)
                } catch (e: Exception) {
                    null
                }
            }
        )
    }

    @PostMapping("/agents/{id}/pause-resume")
    fun pauseResumeAgent(@PathVariable id: String): Map<String, Any> {
        val agents = agentRepository.getAllAgents()
        val match = agents.find { it.id == id } ?: throw NoSuchElementException("Agent not found")
        val nextStatus = if (match.status == "Active") "Paused" else "Active"
        agentRepository.updateAgentStatus(id, nextStatus)
        return mapOf("success" to true, "status" to nextStatus)
    }

    @DeleteMapping("/agents/{id}")
    fun deleteAgent(@PathVariable id: String): Map<String, Any> {
        agentRepository.deleteAgent(id)
        return mapOf("success" to true)
    }
}

data class ApiAgentTemplate(
    val id: String,
    val name: String,
    val type: String,
    val desc: String?,
    val icon: String?,
    val prompt: String?,
    val fields: Any?,
)

data class ApiAgent(
    val id: String,
    val name: String,
    val type: String,
    val template: String,
    val status: String,
    val color: String?,
    val calls: Int,
    val conv: Int,
    val created: String?,
    val config: Any?,
)

data class CreateAgentRequest(
    val name: String,
    val type: String,
    val template: String,
    val status: String?,
    val color: String?,
    val config: Any?,
    val calls: Int?,
    val conv: Int?,
)

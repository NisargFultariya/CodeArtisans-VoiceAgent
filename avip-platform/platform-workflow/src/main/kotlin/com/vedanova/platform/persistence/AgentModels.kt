package com.vedanova.platform.persistence

import java.time.Instant

data class AgentTemplate(
    val id: String,
    val name: String,
    val type: String,
    val desc: String?,
    val icon: String?,
    val prompt: String?,
    val fields: String?, // JSON string
)

data class Agent(
    val id: String,
    val name: String,
    val type: String,
    val template: String,
    val status: String,
    val color: String?,
    val calls: Int = 0,
    val conv: Int = 0,
    val created: String?,
    val config: String?, // JSON string
    val createdAt: Instant = Instant.now(),
)

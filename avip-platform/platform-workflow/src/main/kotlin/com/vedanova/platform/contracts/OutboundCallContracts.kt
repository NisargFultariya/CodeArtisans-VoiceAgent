package com.vedanova.platform.contracts

import org.springframework.context.ApplicationEvent

data class OutboundCallWorkflowInput(
    val callId: String,
    val phoneNumber: String,
    val scenario: String,
    val language: String,
    val voice: String,
    val mode: String, // "phone" or "browser"
    val delayMinutes: Int? = null,
    val scheduledTimeEpochMs: Long? = null,
)

class CallStatusUpdatedEvent(
    source: Any,
    val callId: String,
    val status: String,
    val data: Map<String, Any?> = emptyMap()
) : ApplicationEvent(source)

package com.vedanova.platform.api.service

import com.vedanova.platform.contracts.CallStatusUpdatedEvent
import org.slf4j.LoggerFactory
import org.springframework.context.event.EventListener
import org.springframework.stereotype.Component

@Component
class CallStatusListener(
    private val callStatusPublisher: CallStatusPublisher
) {
    @EventListener
    fun handleCallStatusUpdated(event: CallStatusUpdatedEvent) {
        log.info("Received CallStatusUpdatedEvent callId={} status={}", event.callId, event.status)
        callStatusPublisher.publish(
            callId = event.callId,
            status = event.status,
            data = event.data
        )
    }

    companion object {
        private val log = LoggerFactory.getLogger(CallStatusListener::class.java)
    }
}

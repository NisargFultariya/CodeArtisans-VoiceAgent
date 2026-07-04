package com.vedanova.platform.api.service

import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import java.util.concurrent.CopyOnWriteArrayList

@Component
class CallStatusPublisher {
    private val emitters = CopyOnWriteArrayList<SseEmitter>()

    fun subscribe(): SseEmitter {
        val emitter = SseEmitter(24 * 60 * 60 * 1000L) // 24 hours timeout
        emitters.add(emitter)
        
        emitter.onCompletion {
            emitters.remove(emitter)
            log.debug("SSE emitter completed. Active size={}", emitters.size)
        }
        emitter.onTimeout {
            emitters.remove(emitter)
            log.debug("SSE emitter timed out. Active size={}", emitters.size)
        }
        emitter.onError {
            emitters.remove(emitter)
            log.warn("SSE emitter error. Active size={}", emitters.size)
        }
        
        // Send initial connect event to verify stream is working
        try {
            emitter.send(SseEmitter.event().name("connect").data("connected"))
        } catch (ex: Exception) {
            emitters.remove(emitter)
        }
        
        log.info("New SSE subscriber added. Total active={}", emitters.size)
        return emitter
    }

    fun publish(callId: String, status: String, data: Map<String, Any?> = emptyMap()) {
        val payload = mapOf(
            "callId" to callId,
            "status" to status,
            "data" to data
        )
        
        val deadEmitters = mutableListOf<SseEmitter>()
        for (emitter in emitters) {
            try {
                emitter.send(SseEmitter.event().name("call-update").data(payload))
            } catch (ex: Exception) {
                deadEmitters.add(emitter)
            }
        }
        if (deadEmitters.isNotEmpty()) {
            emitters.removeAll(deadEmitters)
            log.info("Cleaned up {} dead SSE emitters. Remaining={}", deadEmitters.size, emitters.size)
        }
    }

    companion object {
        private val log = LoggerFactory.getLogger(CallStatusPublisher::class.java)
    }
}

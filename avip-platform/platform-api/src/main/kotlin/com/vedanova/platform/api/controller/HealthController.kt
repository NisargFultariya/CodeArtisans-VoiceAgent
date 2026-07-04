package com.vedanova.platform.api.controller

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Instant

@RestController
class HealthController {
    @GetMapping("/health")
    fun health(): Map<String, Any> =
        mapOf(
            "ok" to true,
            "service" to "avip-platform-api",
            "time" to Instant.now().toString(),
        )
}

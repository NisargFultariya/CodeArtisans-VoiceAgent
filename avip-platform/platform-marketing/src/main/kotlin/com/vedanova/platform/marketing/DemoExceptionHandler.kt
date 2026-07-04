package com.vedanova.platform.marketing

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.server.ResponseStatusException

@RestControllerAdvice(basePackageClasses = [DemoController::class])
class DemoExceptionHandler {
    @ExceptionHandler(ResponseStatusException::class)
    fun handleResponseStatus(ex: ResponseStatusException): ResponseEntity<Map<String, String>> {
        val message = ex.reason?.takeIf { it.isNotBlank() } ?: ex.statusCode.toString()
        return ResponseEntity
            .status(ex.statusCode)
            .body(mapOf("message" to message))
    }
}

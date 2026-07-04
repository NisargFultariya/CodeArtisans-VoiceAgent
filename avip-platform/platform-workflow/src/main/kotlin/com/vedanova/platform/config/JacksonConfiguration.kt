package com.vedanova.platform.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import tools.jackson.databind.ObjectMapper
import tools.jackson.module.kotlin.jacksonObjectMapper

@Configuration
class JacksonConfiguration {
    @Bean
    fun objectMapper(): ObjectMapper = jacksonObjectMapper()
}

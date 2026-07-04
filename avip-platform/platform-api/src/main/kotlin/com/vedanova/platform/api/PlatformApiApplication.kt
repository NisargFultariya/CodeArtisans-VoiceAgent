package com.vedanova.platform.api

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.runApplication
import com.vedanova.platform.config.AvipProperties

@SpringBootApplication(scanBasePackages = ["com.vedanova.platform"])
@EnableConfigurationProperties(AvipProperties::class)
class PlatformApiApplication

fun main(args: Array<String>) {
    runApplication<PlatformApiApplication>(*args)
}

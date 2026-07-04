package com.vedanova.platform.worker

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.runApplication
import com.vedanova.platform.config.AvipProperties

@SpringBootApplication(scanBasePackages = ["com.vedanova.platform"])
@EnableConfigurationProperties(AvipProperties::class)
class PlatformWorkerApplication

fun main(args: Array<String>) {
    runApplication<PlatformWorkerApplication>(*args)
}

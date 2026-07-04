plugins {
    alias(libs.plugins.kotlin.spring)
    alias(libs.plugins.spring.boot)
}

dependencies {
    implementation(project(":platform-workflow"))
    implementation(libs.spring.boot.starter.jdbc)
    implementation(libs.postgresql)
    implementation(libs.temporal.sdk)
    implementation(libs.kotlin.reflect)
}

springBoot {
    mainClass.set("com.vedanova.platform.worker.PlatformWorkerApplicationKt")
}

tasks.named<org.springframework.boot.gradle.tasks.bundling.BootJar>("bootJar") {
    archiveFileName.set("avip-platform-worker.jar")
}

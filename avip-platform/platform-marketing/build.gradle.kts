plugins {
    alias(libs.plugins.kotlin.spring)
}

dependencies {
    implementation(project(":platform-workflow"))
    implementation(libs.spring.boot.starter.webmvc)
    implementation(libs.livekit.server)
    implementation(libs.kotlin.reflect)
    implementation(libs.jackson.module.kotlin)
}

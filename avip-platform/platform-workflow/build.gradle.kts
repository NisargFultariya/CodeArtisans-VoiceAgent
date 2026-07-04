plugins {
    alias(libs.plugins.kotlin.spring)
}

allOpen {
    annotation("io.temporal.workflow.WorkflowInterface")
}

dependencies {
    implementation("org.springframework:spring-context")
    implementation(libs.spring.boot.starter.jdbc)
    implementation(libs.temporal.sdk)
    implementation(libs.livekit.server)
    implementation(libs.kotlin.reflect)
    implementation(libs.jackson.module.kotlin)
    implementation(libs.jackson2.module.kotlin)

    testImplementation(libs.spring.boot.starter.test)
    testImplementation("io.temporal:temporal-testing:1.31.0")
    testImplementation("org.mockito.kotlin:mockito-kotlin:5.4.0")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

plugins {
    alias(libs.plugins.kotlin.spring)
    alias(libs.plugins.spring.boot)
}

dependencies {
    implementation(project(":platform-marketing"))
    implementation(project(":platform-workflow"))
    implementation(libs.temporal.sdk)
    implementation(libs.livekit.server)
    implementation(libs.spring.boot.starter.webmvc)
    implementation(libs.spring.boot.starter.actuator)
    implementation(libs.spring.boot.starter.jdbc)
    implementation(libs.spring.boot.starter.validation)
    implementation(libs.spring.boot.starter.mail)
    implementation(libs.spring.boot.starter.flyway)
    runtimeOnly(libs.flyway.database.postgresql)
    implementation(libs.postgresql)
    implementation(libs.springdoc.openapi)
    implementation(libs.kotlin.reflect)

    testImplementation(libs.spring.boot.starter.test)
    testImplementation("org.springframework:spring-test")
    testImplementation("org.mockito.kotlin:mockito-kotlin:5.4.0")
}

springBoot {
    mainClass.set("com.vedanova.platform.api.PlatformApiApplicationKt")
}

val platformWebDir = rootProject.layout.projectDirectory.dir("platform-web")
val webDistDir = platformWebDir.dir("dist")
val adminStaticOutDir = layout.buildDirectory.dir("generated/resources")

val npmInstallWeb by tasks.registering(Exec::class) {
    group = "build"
    description = "Install platform-web npm dependencies"
    workingDir = platformWebDir.asFile
    commandLine("npm", "install")
    inputs.file(platformWebDir.file("package.json"))
    outputs.dir(platformWebDir.dir("node_modules"))
}

val buildPlatformWeb by tasks.registering(Exec::class) {
    group = "build"
    description = "Build platform-web admin UI"
    dependsOn(npmInstallWeb)
    workingDir = platformWebDir.asFile
    commandLine("npm", "run", "build")
    inputs.dir(platformWebDir.dir("src"))
    inputs.file(platformWebDir.file("package.json"))
    inputs.file(platformWebDir.file("vite.config.ts"))
    outputs.dir(webDistDir)
}

val copyPlatformWeb by tasks.registering(Copy::class) {
    group = "build"
    description = "Copy platform-web dist into generated static resources"
    dependsOn(buildPlatformWeb)
    from(webDistDir)
    into(adminStaticOutDir.map { it.dir("static") })
}

sourceSets.named("main") {
    resources.srcDir(adminStaticOutDir)
}

tasks.named<ProcessResources>("processResources") {
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
    if (!project.hasProperty("skipWebBuild")) {
        dependsOn(copyPlatformWeb)
    }
}

tasks.named<org.springframework.boot.gradle.tasks.bundling.BootJar>("bootJar") {
    archiveFileName.set("avip-platform-api.jar")
}

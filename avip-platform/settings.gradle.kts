plugins {
    id("org.gradle.toolchains.foojay-resolver-convention") version "0.9.0"
}

rootProject.name = "avip-platform"

include("platform-api")
include("platform-marketing")
include("platform-workflow")
include("platform-worker")

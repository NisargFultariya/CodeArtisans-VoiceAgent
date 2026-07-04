package com.vedanova.platform.marketing

object DemoScenario {
    private const val DEFAULT = "availability"

    private val supported =
        setOf(
            "landmark",
            "availability",
            "payment",
            "backup_contact",
            "impulse_modification",
        )

    fun normalize(scenario: String?): String {
        val key = scenario?.trim()?.lowercase()?.replace("-", "_").orEmpty()
        return if (key in supported) key else DEFAULT
    }
}

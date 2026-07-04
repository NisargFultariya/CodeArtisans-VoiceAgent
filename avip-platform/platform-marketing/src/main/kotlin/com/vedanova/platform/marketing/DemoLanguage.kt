package com.vedanova.platform.marketing

object DemoLanguage {
    private const val DEFAULT = "hi-IN"

    private val supported =
        setOf(
            "hi-IN",
            "gu-IN",
            "ta-IN",
            "te-IN",
            "mr-IN",
        )

    fun normalize(lang: String?): String {
        val trimmed = lang?.trim().orEmpty()
        return if (trimmed in supported) trimmed else DEFAULT
    }
}

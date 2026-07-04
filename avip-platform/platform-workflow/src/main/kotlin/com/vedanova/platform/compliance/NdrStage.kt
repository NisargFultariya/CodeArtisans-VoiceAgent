package com.vedanova.platform.compliance

object NdrStage {
    const val NDR1 = "ndr-1"
    const val NDR2 = "ndr-2"
    const val NDR3 = "ndr-3"

    fun fromAttemptNumber(attemptNumber: Int): String =
        when {
            attemptNumber >= 3 -> NDR3
            attemptNumber == 2 -> NDR2
            else -> NDR1
        }

    fun allowsAiDial(stage: String): Boolean = stage != NDR3
}

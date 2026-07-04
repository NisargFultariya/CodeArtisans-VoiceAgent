package com.vedanova.platform.contracts

data class DialComplianceInput(
    val shopId: String,
    val orderId: String,
    val customerPhone: String = "",
    val attemptNumber: Int = 1,
)

data class DialComplianceResult(
    val allowed: Boolean,
    val reason: String = "",
    val ndrStage: String = "",
)

data class AttachRecordingInput(
    val shopId: String,
    val orderId: String,
)

package com.vedanova.platform.marketing

data class DemoSessionResponse(
    val url: String,
    val roomName: String,
    val token: String,
    val identity: String,
    val agentName: String,
    val dispatchOk: Boolean,
    val dispatchHint: String? = null,
)

data class DemoTtsRequest(
    val text: String = "",
    val lang: String = "",
    val speaker: String = "",
)

data class DemoTranscribeResponse(
    val text: String,
)

data class DemoAccessStatusResponse(
    val granted: Boolean,
)

data class DemoTranscriptLogRequest(
    val id: String = "",
    val roomName: String = "",
    val participantEmail: String? = null,
    val language: String? = null,
    val scenario: String? = null,
    val voice: String? = null,
    val inputMode: String? = null,
    val status: String = "",
    val lines: List<String> = emptyList(),
)

data class DemoTranscriptLogResponse(
    val saved: Boolean,
    val id: String,
    val filePath: String? = null,
)

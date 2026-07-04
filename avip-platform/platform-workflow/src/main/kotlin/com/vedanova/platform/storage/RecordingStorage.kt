package com.vedanova.platform.storage

import com.vedanova.platform.config.AvipProperties
import org.springframework.stereotype.Component

@Component
class RecordingStorage(
    private val avipProperties: AvipProperties,
) {
    fun objectKey(shopId: String, orderId: String): String =
        "recordings/$shopId/$orderId.wav"

    fun bucket(): String = avipProperties.storage.bucket.ifBlank { DEFAULT_BUCKET }

    companion object {
        const val DEFAULT_BUCKET = "avip-recordings"
    }
}

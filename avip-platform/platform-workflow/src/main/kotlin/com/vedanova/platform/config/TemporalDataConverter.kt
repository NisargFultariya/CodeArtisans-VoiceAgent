package com.vedanova.platform.config

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import io.temporal.common.converter.DataConverter
import io.temporal.common.converter.DefaultDataConverter
import io.temporal.common.converter.JacksonJsonPayloadConverter

/** Jackson 2.x + Kotlin module for Temporal payload (de)serialization. */
object TemporalDataConverter {
    fun create(): DataConverter =
        DefaultDataConverter.newDefaultInstance()
            .withPayloadConverterOverrides(JacksonJsonPayloadConverter(jacksonObjectMapper()))
}

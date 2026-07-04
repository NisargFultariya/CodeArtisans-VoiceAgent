package com.vedanova.platform.config

import com.vedanova.platform.config.AvipProperties
import com.vedanova.platform.temporal.TemporalSignalService
import com.vedanova.platform.temporal.TemporalWorkflowService
import io.temporal.client.WorkflowClient
import io.temporal.client.WorkflowClientOptions
import io.temporal.common.converter.DataConverter
import io.temporal.serviceclient.WorkflowServiceStubs
import io.temporal.serviceclient.WorkflowServiceStubsOptions
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class TemporalConfiguration(
    private val avipProperties: AvipProperties,
) {
    @Bean
    fun temporalDataConverter(): DataConverter = TemporalDataConverter.create()

    @Bean
    fun workflowServiceStubs(): WorkflowServiceStubs =
        WorkflowServiceStubs.newServiceStubs(
            WorkflowServiceStubsOptions.newBuilder()
                .setTarget(avipProperties.temporal.address)
                .build(),
        )

    @Bean
    fun workflowClient(
        stubs: WorkflowServiceStubs,
        dataConverter: DataConverter,
    ): WorkflowClient =
        WorkflowClient.newInstance(
            stubs,
            WorkflowClientOptions.newBuilder()
                .setNamespace(avipProperties.temporal.namespace)
                .setDataConverter(dataConverter)
                .build(),
        )

    @Bean
    fun temporalSignalService(client: WorkflowClient): TemporalSignalService =
        TemporalSignalService(client)

    @Bean
    fun temporalWorkflowService(client: WorkflowClient): TemporalWorkflowService =
        TemporalWorkflowService(client, avipProperties)
}

package com.vedanova.platform.worker

import com.vedanova.platform.activity.AvipActivitiesImpl
import com.vedanova.platform.activity.OutboundCallActivitiesImpl
import com.vedanova.platform.config.AvipProperties
import com.vedanova.platform.workflow.CallLifecycleWorkflowImpl
import com.vedanova.platform.workflow.OutboundCallWorkflowImpl
import com.vedanova.platform.workflow.HelloWorkflowImpl
import io.temporal.client.WorkflowClient
import io.temporal.worker.Worker
import io.temporal.worker.WorkerFactory
import jakarta.annotation.PreDestroy
import org.slf4j.LoggerFactory
import org.springframework.boot.context.event.ApplicationReadyEvent
import org.springframework.context.event.EventListener
import org.springframework.stereotype.Component

@Component
class TemporalWorkerRunner(
    private val workflowClient: WorkflowClient,
    private val avipProperties: AvipProperties,
    private val activities: AvipActivitiesImpl,
    private val outboundCallActivities: OutboundCallActivitiesImpl,
) {
    private lateinit var workerFactory: WorkerFactory

    @EventListener(ApplicationReadyEvent::class)
    fun startWorker() {
        workerFactory = WorkerFactory.newInstance(workflowClient)
        val worker: Worker = workerFactory.newWorker(avipProperties.temporal.taskQueue)
        worker.registerWorkflowImplementationTypes(
            HelloWorkflowImpl::class.java,
            CallLifecycleWorkflowImpl::class.java,
            OutboundCallWorkflowImpl::class.java,
        )
        worker.registerActivitiesImplementations(activities, outboundCallActivities)
        workerFactory.start()
        log.info(
            "Temporal worker started on queue={} namespace={}",
            avipProperties.temporal.taskQueue,
            avipProperties.temporal.namespace,
        )
    }

    @PreDestroy
    fun shutdown() {
        if (::workerFactory.isInitialized) {
            workerFactory.shutdown()
            log.info("Temporal worker stopped")
        }
    }

    companion object {
        private val log = LoggerFactory.getLogger(TemporalWorkerRunner::class.java)
    }
}

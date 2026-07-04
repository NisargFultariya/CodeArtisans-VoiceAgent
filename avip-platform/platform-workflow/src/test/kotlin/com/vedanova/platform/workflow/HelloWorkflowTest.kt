package com.vedanova.platform.workflow

import io.temporal.client.WorkflowOptions
import io.temporal.testing.TestWorkflowEnvironment
import io.temporal.worker.Worker
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

class HelloWorkflowTest {
    private lateinit var testEnv: TestWorkflowEnvironment
    private lateinit var worker: Worker
    private lateinit var activities: StubAvipActivities

    @BeforeEach
    fun setUp() {
        testEnv = TestWorkflowEnvironment.newInstance()
        worker = testEnv.newWorker(TASK_QUEUE)
        activities = StubAvipActivities()
        worker.registerWorkflowImplementationTypes(HelloWorkflowImpl::class.java)
        worker.registerActivitiesImplementations(activities)
        testEnv.start()
    }

    @AfterEach
    fun tearDown() {
        testEnv.close()
    }

    @Test
    fun `hello workflow returns ping activity result`() {
        val workflow =
            testEnv.workflowClient.newWorkflowStub(
                HelloWorkflow::class.java,
                WorkflowOptions.newBuilder().setTaskQueue(TASK_QUEUE).build(),
            )
        assertEquals("hello, avip", workflow.run("avip"))
    }

    companion object {
        private const val TASK_QUEUE = "test-avip-main"
    }
}

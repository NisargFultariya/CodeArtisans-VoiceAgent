package com.vedanova.platform.workflow

import com.vedanova.platform.activity.AvipActivities
import io.temporal.activity.ActivityOptions
import io.temporal.workflow.Workflow
import java.time.Duration

open class HelloWorkflowImpl : HelloWorkflow {
    override fun run(name: String): String {
        val activities =
            Workflow.newActivityStub(
                AvipActivities::class.java,
                ActivityOptions.newBuilder()
                    .setStartToCloseTimeout(Duration.ofMinutes(5))
                    .build(),
            )
        return activities.pingActivity(name)
    }
}

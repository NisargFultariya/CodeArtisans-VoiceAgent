package com.vedanova.platform.api.controller

import com.vedanova.platform.api.dto.CreateDemoRequestBody
import com.vedanova.platform.api.dto.CreateDemoRequestResponse
import com.vedanova.platform.api.dto.DemoAccessRequestBody
import com.vedanova.platform.api.dto.DemoAccessResponse
import com.vedanova.platform.api.service.DemoRequestService
import com.vedanova.platform.api.service.VoiceDemoInviteService
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/marketing")
class MarketingController(
    private val demoRequestService: DemoRequestService,
    private val voiceDemoInviteService: VoiceDemoInviteService,
) {
    /** Email-only: sends a time-limited magic link to the hold-to-talk voice demo. */
    @PostMapping("/demo-access")
    fun requestDemoAccess(@RequestBody body: DemoAccessRequestBody): DemoAccessResponse =
        voiceDemoInviteService.invite(
            email = body.email,
            source = VoiceDemoInviteService.SOURCE_USER,
        )

    @PostMapping("/demo-requests")
    fun createDemoRequest(@RequestBody body: CreateDemoRequestBody): CreateDemoRequestResponse =
        demoRequestService.create(body)
}

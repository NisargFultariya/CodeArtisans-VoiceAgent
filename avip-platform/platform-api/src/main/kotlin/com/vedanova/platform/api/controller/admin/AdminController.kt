package com.vedanova.platform.api.controller.admin

import com.vedanova.platform.api.dto.AdminCallItemDto
import com.vedanova.platform.api.dto.AdminDashboardResponse
import com.vedanova.platform.api.dto.AdminDemoInviteRequest
import com.vedanova.platform.api.dto.AdminDemoInviteResponse
import com.vedanova.platform.api.dto.AdminDemoRequestItemDto
import com.vedanova.platform.api.dto.AdminEscalationItemDto
import com.vedanova.platform.api.dto.AdminListCallsResponse
import com.vedanova.platform.api.dto.AdminListDemoRequestsResponse
import com.vedanova.platform.api.dto.AdminListEscalationsResponse
import com.vedanova.platform.api.dto.AdminListShopsResponse
import com.vedanova.platform.api.dto.AdminLoginRequest
import com.vedanova.platform.api.dto.AdminLoginResponse
import com.vedanova.platform.api.dto.AdminMeResponse
import com.vedanova.platform.api.dto.AdminShopItemDto
import com.vedanova.platform.api.service.AdminAuthService
import com.vedanova.platform.api.service.VoiceDemoInviteService
import com.vedanova.platform.api.support.ApiFormats
import com.vedanova.platform.persistence.AnalyticsRepository
import com.vedanova.platform.persistence.CallRepository
import com.vedanova.platform.persistence.DemoRequestRepository
import com.vedanova.platform.persistence.EscalationRepository
import com.vedanova.platform.persistence.ShopRepository
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestAttribute
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/admin/api")
class AdminController(
    private val adminAuthService: AdminAuthService,
    private val shopRepository: ShopRepository,
    private val callRepository: CallRepository,
    private val escalationRepository: EscalationRepository,
    private val analyticsRepository: AnalyticsRepository,
    private val demoRequestRepository: DemoRequestRepository,
    private val voiceDemoInviteService: VoiceDemoInviteService,
) {
    @PostMapping("/auth/login")
    fun login(@RequestBody body: AdminLoginRequest): AdminLoginResponse {
        val (token, expiresAt) = adminAuthService.login(body.username.trim(), body.password)
        return AdminLoginResponse(
            token = token,
            expiresAt = ApiFormats.rfc3339(expiresAt),
            username = body.username.trim(),
        )
    }

    @GetMapping("/auth/me")
    fun me(@RequestAttribute("adminUsername") username: String): AdminMeResponse =
        AdminMeResponse(username = username)

    @GetMapping("/dashboard")
    fun dashboard(
        @RequestAttribute("adminUsername") @Suppress("UNUSED_PARAMETER") username: String,
    ): AdminDashboardResponse {
        val stats = analyticsRepository.platformAnalytics()
        val recentCalls = callRepository.listRecentGlobal(10).map(::toCallDto)
        val recentEscalations = escalationRepository.listRecentGlobal(10).map(::toEscalationDto)
        return AdminDashboardResponse(
            totalShops = stats.totalShops,
            totalCalls = stats.totalCalls,
            callsThisMonth = stats.callsThisMonth,
            completedCalls = stats.completedCalls,
            recoveryRate = ApiFormats.recoveryRate(stats.totalCalls, stats.completedCalls),
            avgDurationSeconds = stats.avgDurationSeconds,
            openEscalations = stats.openEscalations,
            recentCalls = recentCalls,
            recentEscalations = recentEscalations,
        )
    }

    @GetMapping("/shops")
    fun listShops(
        @RequestAttribute("adminUsername") @Suppress("UNUSED_PARAMETER") username: String,
        @RequestParam(defaultValue = "100") limit: Int,
    ): AdminListShopsResponse =
        AdminListShopsResponse(
            shops =
                shopRepository.listAll(limit).map { shop ->
                    AdminShopItemDto(
                        id = shop.id,
                        shopDomain = shop.shopDomain,
                        installedAt = shop.installedAt?.let(ApiFormats::rfc3339),
                        callCount = shop.callCount,
                    )
                },
        )

    @GetMapping("/calls")
    fun listCalls(
        @RequestAttribute("adminUsername") @Suppress("UNUSED_PARAMETER") username: String,
        @RequestParam(defaultValue = "50") limit: Int,
    ): AdminListCallsResponse =
        AdminListCallsResponse(
            calls = callRepository.listRecentGlobal(limit).map(::toCallDto),
        )

    @GetMapping("/escalations")
    fun listEscalations(
        @RequestAttribute("adminUsername") @Suppress("UNUSED_PARAMETER") username: String,
        @RequestParam(defaultValue = "50") limit: Int,
    ): AdminListEscalationsResponse =
        AdminListEscalationsResponse(
            escalations = escalationRepository.listRecentGlobal(limit).map(::toEscalationDto),
        )

    @PostMapping("/demo-invites")
    fun sendDemoInvite(
        @RequestAttribute("adminUsername") @Suppress("UNUSED_PARAMETER") username: String,
        @RequestBody body: AdminDemoInviteRequest,
    ): AdminDemoInviteResponse {
        val result =
            voiceDemoInviteService.invite(
                email = body.email,
                source = VoiceDemoInviteService.SOURCE_ADMIN,
            )
        return AdminDemoInviteResponse(message = result.message, email = body.email.trim().lowercase())
    }

    @GetMapping("/demo-requests")
    fun listDemoRequests(
        @RequestAttribute("adminUsername") @Suppress("UNUSED_PARAMETER") username: String,
        @RequestParam(defaultValue = "50") limit: Int,
    ): AdminListDemoRequestsResponse =
        AdminListDemoRequestsResponse(
            requests =
                demoRequestRepository.listRecent(limit).map { row ->
                    AdminDemoRequestItemDto(
                        id = row.id,
                        email = row.email,
                        fullName = row.fullName,
                        company = row.company,
                        shopDomain = row.shopDomain,
                        monthlyVolume = row.monthlyVolume,
                        message = row.message,
                        source = row.source,
                        status = row.status,
                        demoShopId = row.demoShopId,
                        createdAt = ApiFormats.rfc3339(row.createdAt),
                    )
                },
            newCount = demoRequestRepository.countNew(),
        )

    private fun toCallDto(row: com.vedanova.platform.persistence.AdminCallRow) =
        AdminCallItemDto(
            shopId = row.shopId,
            shopDomain = row.shopDomain,
            orderId = row.orderId,
            status = row.status,
            outcome = row.outcome,
            workflowId = row.workflowId,
            durationSeconds = row.durationSeconds,
            updatedAt = ApiFormats.callUpdatedAt(row.updatedAt),
        )

    private fun toEscalationDto(row: com.vedanova.platform.persistence.AdminEscalationRow) =
        AdminEscalationItemDto(
            id = row.id,
            shopId = row.shopId,
            shopDomain = row.shopDomain,
            orderId = row.orderId,
            reason = row.reason,
            status = row.status,
            assignee = row.assignee,
            createdAt = ApiFormats.rfc3339(row.createdAt),
            updatedAt = ApiFormats.rfc3339(row.updatedAt),
        )
}

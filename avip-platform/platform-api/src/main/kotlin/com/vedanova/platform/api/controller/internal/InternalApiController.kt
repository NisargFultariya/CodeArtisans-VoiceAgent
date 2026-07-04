package com.vedanova.platform.api.controller.internal

import com.vedanova.platform.api.dto.AnalyticsResponse
import com.vedanova.platform.api.dto.CallItemDto
import com.vedanova.platform.api.dto.EscalationItemDto
import com.vedanova.platform.api.dto.ConsentStatusResponse
import com.vedanova.platform.api.dto.GetPreferencesResponse
import com.vedanova.platform.api.dto.GetPromptResponse
import com.vedanova.platform.api.dto.ListCallsResponse
import com.vedanova.platform.api.dto.ListEscalationsResponse
import com.vedanova.platform.api.dto.OkResponse
import com.vedanova.platform.api.dto.PreferencesBody
import com.vedanova.platform.api.dto.PromptBody
import com.vedanova.platform.api.dto.PutPreferencesResponse
import com.vedanova.platform.api.dto.PutPromptResponse
import com.vedanova.platform.api.dto.RecordConsentRequest
import com.vedanova.platform.api.dto.TriggerCallRequest
import com.vedanova.platform.api.dto.TriggerCallResponse
import com.vedanova.platform.api.dto.UpsertShopRequest
import com.vedanova.platform.api.dto.UpsertShopResponse
import com.vedanova.platform.api.dto.ResolveEscalationRequest
import com.vedanova.platform.api.service.CallTriggerService
import com.vedanova.platform.api.service.ShopInternalService
import com.vedanova.platform.persistence.AnalyticsRepository
import com.vedanova.platform.persistence.CallRepository
import com.vedanova.platform.persistence.ComplianceRepository
import com.vedanova.platform.persistence.EscalationRepository
import com.vedanova.platform.persistence.PreferencesRepository
import com.vedanova.platform.persistence.PromptRepository
import com.vedanova.platform.persistence.ShopPreferences
import com.vedanova.platform.api.support.ApiFormats
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException

@RestController
@RequestMapping("/internal")
class InternalApiController(
    private val shopInternalService: ShopInternalService,
    private val callTriggerService: CallTriggerService,
    private val callRepository: CallRepository,
    private val preferencesRepository: PreferencesRepository,
    private val promptRepository: PromptRepository,
    private val analyticsRepository: AnalyticsRepository,
    private val escalationRepository: EscalationRepository,
    private val complianceRepository: ComplianceRepository,
) {
    @PostMapping("/shops/upsert")
    fun upsertShop(@RequestBody body: UpsertShopRequest): UpsertShopResponse {
        val shop = shopInternalService.upsertFromOAuth(body.shopDomain, body.accessToken, body.scopes)
        shopInternalService.registerShopWebhooks(shop.id)
        return UpsertShopResponse(id = shop.id, shopDomain = shop.shopDomain)
    }

    @GetMapping("/calls")
    fun listCalls(
        @RequestParam shopDomain: String?,
        @RequestParam(defaultValue = "30") limit: Int,
    ): ListCallsResponse {
        val shop = shopInternalService.findShop(shopDomain.orEmpty())
        if (shop == null) {
            return ListCallsResponse()
        }
        val calls =
            try {
                callRepository.listRecentByShop(shop.id, limit)
            } catch (ex: Exception) {
                throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "list calls failed", ex)
            }
        return ListCallsResponse(
            calls =
                calls.map { row ->
                    CallItemDto(
                        orderId = row.orderId,
                        status = row.status,
                        updatedAt = ApiFormats.callUpdatedAt(row.updatedAt),
                        outcome = row.outcome,
                        workflowId = row.workflowId,
                        durationSeconds = row.durationSeconds,
                    )
                },
        )
    }

    @PostMapping("/calls/trigger")
    fun triggerCall(@RequestBody body: TriggerCallRequest): TriggerCallResponse = callTriggerService.trigger(body)

    @GetMapping("/preferences")
    fun getPreferences(@RequestParam shopDomain: String?): GetPreferencesResponse {
        val shop = shopInternalService.requireShop(shopDomain.orEmpty())
        val prefs =
            try {
                preferencesRepository.get(shop.id) ?: defaultPreferences(shop.id)
            } catch (ex: Exception) {
                throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "get preferences failed", ex)
            }
        return GetPreferencesResponse(
            preferences = prefs.toBody(),
            updatedAt = if (prefs.updatedAt.epochSecond > 0) ApiFormats.rfc3339(prefs.updatedAt) else null,
        )
    }

    @PutMapping("/preferences")
    fun putPreferences(
        @RequestParam shopDomain: String?,
        @RequestBody body: PreferencesBody,
    ): PutPreferencesResponse {
        val shop = shopInternalService.requireShop(shopDomain.orEmpty())
        val lang = body.defaultLanguage.trim().ifEmpty { "hi-IN" }
        val saved =
            try {
                preferencesRepository.upsert(
                    ShopPreferences(
                        shopId = shop.id,
                        defaultLanguage = lang,
                        autoWebhook = body.autoWebhook,
                        escalationEmailEnabled = body.escalationEmailEnabled,
                    ),
                )
            } catch (ex: Exception) {
                throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "save preferences failed", ex)
            }
        return PutPreferencesResponse(
            preferences = saved.toBody(),
            updatedAt = ApiFormats.rfc3339(saved.updatedAt),
        )
    }

    @GetMapping("/prompt")
    fun getPrompt(@RequestParam shopDomain: String?): GetPromptResponse {
        val shop = shopInternalService.requireShop(shopDomain.orEmpty())
        val prompt =
            try {
                promptRepository.getDefault(shop.id)
            } catch (ex: Exception) {
                throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "get prompt failed", ex)
            }
        if (prompt == null) {
            return GetPromptResponse(prompt = PromptBody(systemPrompt = ApiFormats.DEFAULT_SYSTEM_PROMPT))
        }
        return GetPromptResponse(
            prompt = PromptBody(systemPrompt = prompt.systemPrompt),
            updatedAt = ApiFormats.rfc3339(prompt.updatedAt),
        )
    }

    @PutMapping("/prompt")
    fun putPrompt(
        @RequestParam shopDomain: String?,
        @RequestBody body: PromptBody,
    ): PutPromptResponse {
        val shop = shopInternalService.requireShop(shopDomain.orEmpty())
        val text = body.systemPrompt.trim()
        if (text.isEmpty()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "systemPrompt required")
        }
        val saved =
            try {
                promptRepository.upsertDefault(shop.id, text)
            } catch (ex: Exception) {
                throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "save prompt failed", ex)
            }
        return PutPromptResponse(
            prompt = PromptBody(systemPrompt = saved.systemPrompt),
            updatedAt = ApiFormats.rfc3339(saved.updatedAt),
        )
    }

    @GetMapping("/analytics")
    fun analytics(@RequestParam shopDomain: String?): AnalyticsResponse {
        val shop = shopInternalService.requireShop(shopDomain.orEmpty())
        val stats =
            try {
                analyticsRepository.shopAnalytics(shop.id)
            } catch (ex: Exception) {
                throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "analytics failed", ex)
            }
        return AnalyticsResponse(
            callsThisMonth = stats.callsThisMonth,
            totalCalls = stats.totalCalls,
            completedCalls = stats.completedCalls,
            avgDurationSeconds = stats.avgDurationSeconds,
            openEscalations = stats.openEscalations,
            recoveryRate = ApiFormats.recoveryRate(stats.totalCalls, stats.completedCalls),
        )
    }

    @GetMapping("/escalations")
    fun listEscalations(@RequestParam shopDomain: String?): ListEscalationsResponse {
        val shop = shopInternalService.requireShop(shopDomain.orEmpty())
        val rows =
            try {
                escalationRepository.listByShop(shop.id, 50)
            } catch (ex: Exception) {
                throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "list escalations failed", ex)
            }
        return ListEscalationsResponse(
            escalations =
                rows.map { row ->
                    EscalationItemDto(
                        id = row.id,
                        orderId = row.orderId,
                        reason = row.reason,
                        status = row.status,
                        assignee = row.assignee,
                        createdAt = ApiFormats.rfc3339(row.createdAt),
                        updatedAt = ApiFormats.rfc3339(row.updatedAt),
                    )
                },
        )
    }

    @PostMapping("/escalations/{id}/resolve")
    fun resolveEscalation(
        @RequestParam shopDomain: String?,
        @PathVariable id: String,
        @RequestBody body: ResolveEscalationRequest,
    ): OkResponse {
        val shop = shopInternalService.requireShop(shopDomain.orEmpty())
        if (id.isBlank()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "id required")
        }
        try {
            escalationRepository.resolve(shop.id, id, body.assignee)
        } catch (ex: Exception) {
            throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "resolve escalation failed", ex)
        }
        return OkResponse()
    }

    @PostMapping("/compliance/consent")
    fun recordConsent(@RequestBody body: RecordConsentRequest): ConsentStatusResponse {
        val shop = shopInternalService.requireShop(body.shopDomain.trim())
        val orderId = CallTriggerService.normalizeOrderId(body.orderId.trim())
        if (orderId.isEmpty()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "orderId required")
        }
        val row =
            try {
                complianceRepository.recordConsent(
                    shopId = shop.id,
                    orderId = orderId,
                    customerPhone = body.customerPhone.trim().ifEmpty { null },
                    source = body.source.trim().ifEmpty { "checkout" },
                )
            } catch (ex: Exception) {
                throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "record consent failed", ex)
            }
        return ConsentStatusResponse(
            granted = true,
            grantedAt = ApiFormats.rfc3339(row.grantedAt),
            source = row.consentSource,
        )
    }

    @GetMapping("/compliance/consent")
    fun getConsent(
        @RequestParam shopDomain: String?,
        @RequestParam orderId: String?,
    ): ConsentStatusResponse {
        val shop = shopInternalService.requireShop(shopDomain.orEmpty())
        val normalizedOrderId = CallTriggerService.normalizeOrderId(orderId.orEmpty().trim())
        if (normalizedOrderId.isEmpty()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "orderId required")
        }
        val row = complianceRepository.getConsent(shop.id, normalizedOrderId)
        if (row == null) {
            return ConsentStatusResponse(granted = false)
        }
        return ConsentStatusResponse(
            granted = true,
            grantedAt = ApiFormats.rfc3339(row.grantedAt),
            source = row.consentSource,
        )
    }

    private fun defaultPreferences(shopId: String) =
        ShopPreferences(shopId = shopId)

    private fun ShopPreferences.toBody() =
        PreferencesBody(
            defaultLanguage = defaultLanguage,
            autoWebhook = autoWebhook,
            escalationEmailEnabled = escalationEmailEnabled,
        )
}

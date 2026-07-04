package com.vedanova.platform.api.service

import com.vedanova.platform.api.dto.CreateDemoRequestBody
import com.vedanova.platform.api.dto.CreateDemoRequestResponse
import com.vedanova.platform.persistence.DemoRequestRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import java.util.UUID

@Service
class DemoRequestService(
    private val demoRequestRepository: DemoRequestRepository,
    private val shopInternalService: ShopInternalService,
) {
    fun create(body: CreateDemoRequestBody): CreateDemoRequestResponse {
        val email = body.email.trim().lowercase()
        if (email.isEmpty() || !email.contains('@')) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "valid email required")
        }

        val source = body.source.trim().ifEmpty { SOURCE_BOOK_DEMO }
        if (source !in ALLOWED_SOURCES) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid source")
        }

        val shopDomain = normalizeShopDomain(body.shopDomain?.trim().orEmpty())
        val fullName = body.fullName?.trim()?.ifEmpty { null }
        val company = body.company?.trim()?.ifEmpty { null }
        val monthlyVolume = body.monthlyVolume?.trim()?.ifEmpty { null }
        val message = body.message?.trim()?.ifEmpty { null }

        when (source) {
            SOURCE_BOOK_DEMO -> {
                if (shopDomain.isEmpty()) {
                    throw ResponseStatusException(HttpStatus.BAD_REQUEST, "shopDomain required")
                }
            }
            SOURCE_CONTACT -> {
                if (message.isNullOrEmpty()) {
                    throw ResponseStatusException(HttpStatus.BAD_REQUEST, "message required")
                }
            }
        }

        val demoShop =
            shopDomain.takeIf { it.isNotEmpty() }?.let { domain ->
                shopInternalService.getOrCreateDevShop(domain)
            }

        val row =
            demoRequestRepository.insert(
                id = UUID.randomUUID().toString().replace("-", ""),
                email = email,
                fullName = fullName,
                company = company,
                shopDomain = shopDomain.ifEmpty { null },
                monthlyVolume = monthlyVolume,
                message = message,
                source = source,
                demoShopId = demoShop?.id,
            )

        val messageText =
            when (source) {
                SOURCE_BOOK_DEMO ->
                    "Thanks — we'll reach out within one business day to schedule your walkthrough."
                else ->
                    "Thanks — we'll get back to you within one business day."
            }

        return CreateDemoRequestResponse(
            requestId = row.id,
            demoShopDomain = demoShop?.shopDomain ?: shopDomain.ifEmpty { null },
            message = messageText,
        )
    }

    fun normalizeShopDomain(input: String): String {
        if (input.isEmpty()) return ""
        val trimmed = input.trim().lowercase().removePrefix("https://").removePrefix("http://")
        val host = trimmed.substringBefore('/').substringBefore('?')
        if (host.endsWith(".myshopify.com")) return host
        if (host.contains('.')) return host
        return "$host.myshopify.com"
    }

    companion object {
        const val SOURCE_BOOK_DEMO = "book-demo"
        const val SOURCE_CONTACT = "contact"
        private val ALLOWED_SOURCES = setOf(SOURCE_BOOK_DEMO, SOURCE_CONTACT)
    }
}

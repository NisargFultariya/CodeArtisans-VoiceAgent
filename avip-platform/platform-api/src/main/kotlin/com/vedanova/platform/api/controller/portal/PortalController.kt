package com.vedanova.platform.api.controller.portal

import com.vedanova.platform.api.dto.PortalListShopsResponse
import com.vedanova.platform.api.dto.PortalLoginRequest
import com.vedanova.platform.api.dto.PortalLoginResponse
import com.vedanova.platform.api.dto.PortalMeResponse
import com.vedanova.platform.api.dto.PortalShopItemDto
import com.vedanova.platform.api.service.PortalAuthService
import com.vedanova.platform.api.service.PortalLoginService
import com.vedanova.platform.api.service.PortalSession
import com.vedanova.platform.persistence.IdentityRepository
import com.vedanova.platform.persistence.ShopRepository
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestAttribute
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException

@RestController
@RequestMapping("/portal/api")
class PortalApiController(
    private val portalLoginService: PortalLoginService,
    private val identityRepository: IdentityRepository,
    private val shopRepository: ShopRepository,
) {
    @PostMapping("/auth/request-login")
    fun requestLogin(@RequestBody body: PortalLoginRequest): PortalLoginResponse {
        val result =
            portalLoginService.requestLogin(
                email = body.email,
                fullName = body.fullName,
                accountName = body.accountName,
            )
        return PortalLoginResponse(message = result.message, email = result.email)
    }

    @GetMapping("/auth/me")
    fun me(@RequestAttribute("portalSession") session: PortalSession): PortalMeResponse {
        val user =
            identityRepository.findUserById(session.userId)
                ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "user not found")
        val account =
            identityRepository.findAccountById(session.accountId)
                ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "account not found")
        return PortalMeResponse(
            email = user.email,
            fullName = user.fullName,
            accountId = account.id,
            accountName = account.name,
            role = session.role,
        )
    }

    @GetMapping("/shops")
    fun listShops(@RequestAttribute("portalSession") session: PortalSession): PortalListShopsResponse {
        val shops =
            shopRepository.listForAccount(session.accountId).map { shop ->
                PortalShopItemDto(id = shop.id, shopDomain = shop.shopDomain)
            }
        return PortalListShopsResponse(shops = shops)
    }
}

@Controller
class PortalAccessController(
    private val portalLoginService: PortalLoginService,
    private val portalAuthService: PortalAuthService,
) {
    @GetMapping("/portal/grant-access")
    @ResponseBody
    fun grantAccess(@RequestParam("access") access: String): ResponseEntity<Void> {
        val grant = portalLoginService.exchangeMagicLink(access)
        val (sessionToken, expiresAt) =
            portalAuthService.issueSession(
                userId = grant.user.id,
                accountId = grant.account.id,
                role = grant.membership.role,
            )
        return ResponseEntity
            .noContent()
            .header(HttpHeaders.SET_COOKIE, portalAuthService.sessionCookie(sessionToken, expiresAt))
            .build()
    }

    @PostMapping("/portal/api/auth/logout")
    @ResponseBody
    fun logout(): ResponseEntity<Void> =
        ResponseEntity
            .noContent()
            .header(HttpHeaders.SET_COOKIE, portalAuthService.clearSessionCookie())
            .build()
}

object PortalSessionSupport {
    fun extractSessionToken(
        request: HttpServletRequest,
        cookieName: String,
    ): String? =
        request.cookies
            ?.firstOrNull { it.name == cookieName }
            ?.value
            ?.trim()
            ?.ifEmpty { null }
}

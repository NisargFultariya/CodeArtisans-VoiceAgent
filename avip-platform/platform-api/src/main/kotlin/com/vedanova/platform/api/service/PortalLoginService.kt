package com.vedanova.platform.api.service

import com.vedanova.platform.config.AvipProperties
import com.vedanova.platform.identity.PortalTokenHasher
import com.vedanova.platform.persistence.IdentityRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import java.time.Instant

@Service
class PortalLoginService(
    private val avipProperties: AvipProperties,
    private val identityRepository: IdentityRepository,
    private val accountProvisioningService: AccountProvisioningService,
    private val portalTokenHasher: PortalTokenHasher,
    private val portalMailService: PortalMailService,
) {
    fun requestLogin(
        email: String,
        fullName: String? = null,
        accountName: String? = null,
    ): PortalLoginRequestResult {
        val normalized = email.trim()
        if (normalized.isBlank() || !normalized.contains('@')) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "valid email required")
        }

        val derivedAccountName = accountName?.trim()?.takeIf { it.isNotBlank() } ?: deriveAccountName(normalized)
        val (account, user) =
            accountProvisioningService.provisionAccountForEmail(
                email = normalized,
                accountName = derivedAccountName,
                fullName = fullName?.trim()?.takeIf { it.isNotBlank() },
            )
        val membership =
            identityRepository.findMembership(account.id, user.id)
                ?: throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "membership missing")

        val expiresAt = Instant.now().plusSeconds(avipProperties.portal.loginTokenTtlMinutes * 60)
        val rawToken = portalTokenHasher.generateRawToken()
        identityRepository.insertLoginToken(
            userId = user.id,
            tokenHash = portalTokenHasher.hash(rawToken),
            purpose = "portal_login",
            expiresAt = expiresAt,
        )
        portalMailService.sendMagicLink(user.email, rawToken, expiresAt)

        return PortalLoginRequestResult(
            email = user.email,
            accountId = account.id,
            role = membership.role,
            message = "Check your inbox for a sign-in link.",
        )
    }

    fun exchangeMagicLink(rawToken: String): PortalGrantResult {
        val token = rawToken.trim()
        if (token.isBlank()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "access token required")
        }
        val loginToken =
            identityRepository.findActiveLoginToken(portalTokenHasher.hash(token))
                ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid or expired link")
        if (!identityRepository.consumeLoginToken(loginToken.id)) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid or expired link")
        }

        val user =
            identityRepository.findUserById(loginToken.userId)
                ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid or expired link")
        identityRepository.markEmailVerified(user.id)

        val membership =
            identityRepository.listMembershipsForUser(user.id).firstOrNull()
                ?: throw ResponseStatusException(HttpStatus.FORBIDDEN, "no account membership")

        val account =
            identityRepository.findAccountById(membership.accountId)
                ?: throw ResponseStatusException(HttpStatus.FORBIDDEN, "account not found")

        return PortalGrantResult(
            user = user,
            account = account,
            membership = membership,
        )
    }

    private fun deriveAccountName(email: String): String {
        val local = email.substringBefore('@').replace('.', ' ').replace('_', ' ').trim()
        return local.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }.ifBlank { "My account" }
    }
}

data class PortalLoginRequestResult(
    val email: String,
    val accountId: String,
    val role: String,
    val message: String,
)

data class PortalGrantResult(
    val user: com.vedanova.platform.persistence.User,
    val account: com.vedanova.platform.persistence.Account,
    val membership: com.vedanova.platform.persistence.AccountMembership,
)

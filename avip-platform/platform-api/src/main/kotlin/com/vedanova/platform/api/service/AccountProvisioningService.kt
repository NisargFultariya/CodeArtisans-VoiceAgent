package com.vedanova.platform.api.service

import com.vedanova.platform.persistence.Account
import com.vedanova.platform.persistence.IdentityRepository
import com.vedanova.platform.persistence.Shop
import com.vedanova.platform.persistence.ShopRepository
import com.vedanova.platform.persistence.User
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class AccountProvisioningService(
    private val identityRepository: IdentityRepository,
    private val shopRepository: ShopRepository,
) {
    /**
     * Creates an account + owner membership for a new merchant, or returns the user's primary account.
     */
    fun provisionAccountForEmail(
        email: String,
        accountName: String,
        fullName: String? = null,
    ): Pair<Account, User> {
        val existingUser = identityRepository.findUserByEmail(email)
        if (existingUser != null) {
            val primaryAccount = primaryAccountForUser(existingUser.id)
            if (primaryAccount != null) {
                return primaryAccount to existingUser
            }
        }

        val user =
            existingUser
                ?: identityRepository.createUser(email = email, fullName = fullName)
        val account =
            identityRepository.createAccount(
                name = accountName,
                billingEmail = email,
            )
        identityRepository.addMembership(
            accountId = account.id,
            userId = user.id,
            role = "owner",
            acceptedAt = Instant.now(),
        )
        return account to user
    }

    /** Links a shop installation to the user's primary billing account. */
    fun linkShopToUserAccount(
        shopId: String,
        userId: String,
    ): Shop? {
        val accountId =
            primaryAccountForUser(userId)?.id
                ?: return null
        return shopRepository.linkToAccount(shopId, accountId)
    }

    private fun primaryAccountForUser(userId: String): Account? {
        val memberships = identityRepository.listMembershipsForUser(userId)
        val owner =
            memberships.firstOrNull { it.role == "owner" }
                ?: memberships.firstOrNull()
                ?: return null
        return identityRepository.findAccountById(owner.accountId)
    }
}

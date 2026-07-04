package com.vedanova.platform.api.service

import com.vedanova.platform.persistence.Account
import com.vedanova.platform.persistence.AccountMembership
import com.vedanova.platform.persistence.IdentityRepository
import com.vedanova.platform.persistence.Shop
import com.vedanova.platform.persistence.ShopRepository
import com.vedanova.platform.persistence.User
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import java.time.Instant

class AccountProvisioningServiceTest {
    private val identityRepository: IdentityRepository = mock()
    private val shopRepository: ShopRepository = mock()
    private val service = AccountProvisioningService(identityRepository, shopRepository)

    private val now = Instant.parse("2026-06-19T12:00:00Z")

    @Test
    fun `provisionAccountForEmail creates account owner and user`() {
        whenever(identityRepository.findUserByEmail("owner@acme.com")).thenReturn(null)
        whenever(identityRepository.createUser("owner@acme.com", "Ada")).thenReturn(user("u1", "owner@acme.com"))
        whenever(identityRepository.createAccount("Acme Brands", "owner@acme.com")).thenReturn(account("a1", "Acme Brands"))

        val (account, user) =
            service.provisionAccountForEmail(
                email = "owner@acme.com",
                accountName = "Acme Brands",
                fullName = "Ada",
            )

        assertEquals("a1", account.id)
        assertEquals("u1", user.id)
        verify(identityRepository).createAccount("Acme Brands", "owner@acme.com")
    }

    @Test
    fun `provisionAccountForEmail returns existing primary account`() {
        whenever(identityRepository.findUserByEmail("owner@acme.com")).thenReturn(user("u1", "owner@acme.com"))
        whenever(identityRepository.listMembershipsForUser("u1")).thenReturn(listOf(membership("a1", "u1", "owner")))
        whenever(identityRepository.findAccountById("a1")).thenReturn(account("a1", "Acme Brands"))

        val (account, user) =
            service.provisionAccountForEmail(
                email = "owner@acme.com",
                accountName = "Ignored",
            )

        assertEquals("a1", account.id)
        assertEquals("u1", user.id)
        verify(identityRepository, never()).createAccount(any(), any(), any(), any())
    }

    @Test
    fun `linkShopToUserAccount links shop to owner account`() {
        whenever(identityRepository.listMembershipsForUser("u1")).thenReturn(listOf(membership("a1", "u1", "owner")))
        whenever(identityRepository.findAccountById("a1")).thenReturn(account("a1", "Acme"))
        whenever(shopRepository.linkToAccount("s1", "a1")).thenReturn(
            Shop(id = "s1", shopDomain = "acme.myshopify.com", accountId = "a1"),
        )

        val shop = service.linkShopToUserAccount("s1", "u1")

        assertEquals("a1", shop?.accountId)
    }

    private fun account(
        id: String,
        name: String,
    ) = Account(
        id = id,
        name = name,
        createdAt = now,
        updatedAt = now,
    )

    private fun user(
        id: String,
        email: String,
    ) = User(
        id = id,
        email = email,
        createdAt = now,
        updatedAt = now,
    )

    private fun membership(
        accountId: String,
        userId: String,
        role: String,
    ) = AccountMembership(
        accountId = accountId,
        userId = userId,
        role = role,
        createdAt = now,
        updatedAt = now,
    )
}

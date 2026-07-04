package com.vedanova.platform.compliance

import com.vedanova.platform.contracts.DialComplianceInput
import com.vedanova.platform.persistence.ComplianceRepository
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever

class ComplianceServiceTest {
    private val complianceRepository: ComplianceRepository = mock()
    private val auditRepository = mock<com.vedanova.platform.persistence.AuditRepository>()
    private val service = ComplianceService(complianceRepository, auditRepository)

    @Test
    fun `blocks NDR-3 attempts`() {
        val result =
            service.checkDial(
                DialComplianceInput(
                    shopId = "shop",
                    orderId = "order",
                    customerPhone = "+919999999999",
                    attemptNumber = 3,
                ),
            )
        assertFalse(result.allowed)
        assertTrue(result.reason.contains("NDR-3"))
    }

    @Test
    fun `blocks when consent missing`() {
        whenever(complianceRepository.isDnd("+919999999999")).thenReturn(false)
        whenever(complianceRepository.hasConsent("shop", "order")).thenReturn(false)
        val result =
            service.checkDial(
                DialComplianceInput(
                    shopId = "shop",
                    orderId = "order",
                    customerPhone = "+919999999999",
                    attemptNumber = 1,
                ),
            )
        assertFalse(result.allowed)
        assertTrue(result.reason.contains("consent"))
    }

    @Test
    fun `allows when consent present and NDR-1`() {
        whenever(complianceRepository.isDnd("+919999999999")).thenReturn(false)
        whenever(complianceRepository.hasConsent("shop", "order")).thenReturn(true)
        val result =
            service.checkDial(
                DialComplianceInput(
                    shopId = "shop",
                    orderId = "order",
                    customerPhone = "+919999999999",
                    attemptNumber = 1,
                ),
            )
        assertTrue(result.allowed)
        assertTrue(result.ndrStage == NdrStage.NDR1)
    }
}

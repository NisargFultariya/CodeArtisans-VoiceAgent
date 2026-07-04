package com.vedanova.platform.compliance

import com.vedanova.platform.contracts.DialComplianceInput
import com.vedanova.platform.contracts.DialComplianceResult
import com.vedanova.platform.persistence.AuditRepository
import com.vedanova.platform.persistence.ComplianceRepository
import org.springframework.stereotype.Service

@Service
class ComplianceService(
    private val complianceRepository: ComplianceRepository,
    private val auditRepository: AuditRepository,
) {
    fun checkDial(input: DialComplianceInput): DialComplianceResult {
        val stage = NdrStage.fromAttemptNumber(input.attemptNumber.coerceAtLeast(1))
        if (!NdrStage.allowsAiDial(stage)) {
            auditRepository.log(
                shopId = input.shopId,
                eventType = "dial.blocked.ndr3",
                payload = """{"orderId":"${input.orderId}","stage":"$stage"}""",
            )
            return DialComplianceResult(
                allowed = false,
                reason = "NDR-3: escalate to human agent",
                ndrStage = stage,
            )
        }
        if (complianceRepository.isDnd(input.customerPhone)) {
            auditRepository.log(
                shopId = input.shopId,
                eventType = "dial.blocked.dnd",
                payload = """{"orderId":"${input.orderId}"}""",
            )
            return DialComplianceResult(
                allowed = false,
                reason = "Customer number is on DND list",
                ndrStage = stage,
            )
        }
        if (!complianceRepository.hasConsent(input.shopId, input.orderId)) {
            auditRepository.log(
                shopId = input.shopId,
                eventType = "dial.blocked.no_consent",
                payload = """{"orderId":"${input.orderId}"}""",
            )
            return DialComplianceResult(
                allowed = false,
                reason = "No checkout consent on file",
                ndrStage = stage,
            )
        }
        return DialComplianceResult(allowed = true, ndrStage = stage)
    }
}

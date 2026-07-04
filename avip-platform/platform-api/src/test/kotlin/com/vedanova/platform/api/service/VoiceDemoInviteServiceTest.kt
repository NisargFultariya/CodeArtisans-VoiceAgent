package com.vedanova.platform.api.service

import com.vedanova.platform.config.AvipProperties
import com.vedanova.platform.config.MailProperties
import com.vedanova.platform.config.VoiceDemoProperties
import com.vedanova.platform.demo.VoiceDemoTokenService
import com.vedanova.platform.persistence.DemoRequestRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import java.time.Instant

class VoiceDemoInviteServiceTest {
    private val demoRequestRepository: DemoRequestRepository = mock()
    private val voiceDemoTokenService: VoiceDemoTokenService = mock()
    private val voiceDemoMailService: VoiceDemoMailService = mock()
    private val avipProperties =
        AvipProperties(
            voiceDemo = VoiceDemoProperties(tokenTtlHours = 72, tokenSecret = "secret"),
            mail = MailProperties(enabled = true),
        )
    private val service =
        VoiceDemoInviteService(
            demoRequestRepository,
            voiceDemoTokenService,
            voiceDemoMailService,
            avipProperties,
        )

    @Test
    fun `invite stores lead sends email and returns check inbox message`() {
        whenever(voiceDemoTokenService.issue(any(), eq("user@example.com"), any()))
            .thenReturn("magic-token")

        val response =
            service.invite(
                email = "user@example.com",
                source = VoiceDemoInviteService.SOURCE_USER,
            )

        assertEquals("Check your email — we sent a link to open the voice demo.", response.message)
        verify(voiceDemoMailService).sendMagicLink(eq("user@example.com"), eq("magic-token"), any())
        verify(demoRequestRepository).insert(
            id = any(),
            email = eq("user@example.com"),
            fullName = eq(null),
            company = eq(null),
            shopDomain = eq(null),
            monthlyVolume = eq(null),
            message = eq(null),
            source = eq(VoiceDemoInviteService.SOURCE_USER),
            demoShopId = eq(null),
        )
    }
}

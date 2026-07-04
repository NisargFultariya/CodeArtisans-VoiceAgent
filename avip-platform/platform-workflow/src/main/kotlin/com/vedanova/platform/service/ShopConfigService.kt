package com.vedanova.platform.service

import com.vedanova.platform.contracts.ShopConfig
import com.vedanova.platform.persistence.PreferencesRepository
import com.vedanova.platform.persistence.PromptRepository
import com.vedanova.platform.persistence.ShopRepository
import org.springframework.stereotype.Service

@Service
class ShopConfigService(
    private val shopRepository: ShopRepository,
    private val promptRepository: PromptRepository,
    private val preferencesRepository: PreferencesRepository,
) {
    fun loadConfig(shopId: String): ShopConfig {
        val shop =
            shopRepository.getById(shopId)
                ?: throw IllegalStateException("shop not found: $shopId")
        val prompt =
            promptRepository.getDefault(shopId)?.systemPrompt?.takeIf { it.isNotBlank() }
                ?: DEFAULT_PROMPT
        val prefs = preferencesRepository.get(shopId)
        val lang = prefs?.defaultLanguage?.takeIf { it.isNotBlank() } ?: "hi-IN"
        return ShopConfig(
            shopId = shop.id,
            shopDomain = shop.shopDomain,
            systemPrompt = prompt,
            defaultLanguage = lang,
        )
    }

    companion object {
        const val DEFAULT_PROMPT =
            "You are an RTO recovery agent. Speak clearly, ask why delivery failed, and confirm the reason briefly."
    }
}

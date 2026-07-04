package com.vedanova.platform.contracts

object CallObjective {
    const val GET_REASON = "get_reason"
    const val RESCHEDULE = "reschedule"
    const val CONFIRM_ADDRESS = "confirm_address"
    const val ESCALATE_ONLY = "escalate_only"
}

object CallOverridesLogic {
    fun apply(
        shop: ShopConfig,
        order: ShopifyOrderContext,
        overrides: CallOverrides,
    ): Pair<ShopConfig, ShopifyOrderContext> {
        var systemPrompt = shop.systemPrompt
        var language = order.language
        var phone = order.customerPhone

        val customPrompt = overrides.systemPrompt.trim()
        val objective = overrides.objective.trim()
        if (customPrompt.isNotEmpty()) {
            systemPrompt = objectivePrompt(objective, customPrompt)
        } else if (objective.isNotEmpty()) {
            systemPrompt = objectivePrompt(objective, systemPrompt)
        }
        if (overrides.language.trim().isNotEmpty()) {
            language = overrides.language.trim()
        } else if (shop.defaultLanguage.isNotEmpty() && language.isEmpty()) {
            language = shop.defaultLanguage
        }
        if (overrides.customerPhone.trim().isNotEmpty()) {
            phone = overrides.customerPhone.trim()
        }

        return shop.copy(systemPrompt = systemPrompt) to
            order.copy(language = language, customerPhone = phone)
    }

    fun objectivePrompt(objective: String, base: String): String {
        val trimmedBase = base.trim()
        val guide =
            mapOf(
                CallObjective.GET_REASON to
                    "Primary goal: learn why delivery failed or was refused. Capture a clear reason in one sentence.",
                CallObjective.RESCHEDULE to
                    "Primary goal: agree a new delivery date and time window with the customer. Confirm before closing.",
                CallObjective.CONFIRM_ADDRESS to
                    "Primary goal: verify shipping address and phone number. Correct any mistakes.",
                CallObjective.ESCALATE_ONLY to
                    "Primary goal: inform the customer a human agent will follow up. Do not negotiate; stay brief.",
            )
        val extra = guide[objective.trim()].orEmpty()
        if (extra.isEmpty()) return trimmedBase
        if (trimmedBase.isEmpty()) return extra
        return "$trimmedBase\n\n$extra"
    }
}

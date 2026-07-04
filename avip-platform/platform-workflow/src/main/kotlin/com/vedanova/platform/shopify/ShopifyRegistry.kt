package com.vedanova.platform.shopify

import tools.jackson.core.type.TypeReference
import tools.jackson.databind.JsonNode
import tools.jackson.databind.ObjectMapper
import com.vedanova.platform.config.AvipProperties
import com.vedanova.platform.contracts.OrderAddress
import com.vedanova.platform.contracts.RTOAttempt
import com.vedanova.platform.contracts.ShopifyOrderContext
import com.vedanova.platform.crypto.TokenEncryption
import com.vedanova.platform.persistence.ShopRepository
import org.springframework.stereotype.Component
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Duration

@Component
class ShopifyRegistry(
    private val shopRepository: ShopRepository,
    private val avipProperties: AvipProperties,
    private val objectMapper: ObjectMapper,
) {
    fun clientForShop(shopId: String): ShopifyClient {
        val shop =
            shopRepository.getById(shopId)
                ?: throw IllegalStateException("shop not found: $shopId")
        val token =
            shop.accessTokenEncrypted?.takeIf { it.isNotBlank() }?.let { encrypted ->
                val secret = TokenEncryption.encryptionSecret(avipProperties.tokenEncryptionKey)
                TokenEncryption.decrypt(encrypted, secret)
            } ?: System.getenv("SHOPIFY_ACCESS_TOKEN")?.takeIf { it.isNotBlank() }
                ?: throw IllegalStateException("no access token for shop ${shop.shopDomain}")
        return ShopifyClient(
            shopDomain = shop.shopDomain,
            accessToken = token,
            apiVersion = avipProperties.shopifyApiVersion,
            objectMapper = objectMapper,
        )
    }
}

class ShopifyClient(
    shopDomain: String,
    private val accessToken: String,
    private val apiVersion: String,
    private val objectMapper: ObjectMapper,
) {
    private val domain =
        shopDomain
            .removePrefix("https://")
            .removePrefix("http://")
            .trimEnd('/')
    private val http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(30)).build()

    fun getOrder(orderId: String, defaultLang: String): ShopifyOrderContext {
        val cleanId = ShopifyWriteback.normalizeOrderId(orderId)
        val payload = request("GET", "/orders/$cleanId.json")
        val order = payload.get("order") ?: throw IllegalStateException("order missing in response")
        val attemptsRaw = getMetafield(cleanId, "attempts")
        val attempts: List<RTOAttempt> =
            if (attemptsRaw.isNullOrBlank()) {
                emptyList()
            } else {
                objectMapper.readValue(attemptsRaw, object : TypeReference<List<RTOAttempt>>() {})
            }
        return mapOrder(order, attempts, defaultLang)
    }

    fun recordRtoAttempt(orderId: String, attempt: RTOAttempt) {
        val cleanId = ShopifyWriteback.normalizeOrderId(orderId)
        val existing = getMetafield(cleanId, "attempts")
        val attempts: MutableList<RTOAttempt> =
            if (existing.isNullOrBlank()) {
                mutableListOf()
            } else {
                objectMapper.readValue(existing, object : TypeReference<MutableList<RTOAttempt>>() {})
            }
        attempts.add(attempt)
        setMetafield(cleanId, "attempts", objectMapper.writeValueAsString(attempts), "json")
    }

    fun addOrderNote(orderId: String, note: String) {
        val cleanId = ShopifyWriteback.normalizeOrderId(orderId)
        request("POST", "/orders/$cleanId/notes.json", mapOf("note" to note))
    }

    private fun mapOrder(
        order: JsonNode,
        attempts: List<RTOAttempt>,
        defaultLang: String,
    ): ShopifyOrderContext {
        val customer = order.path("customer")
        val shipping = order.path("shipping_address")
        val billing = order.path("billing_address")
        val addrNode = if (!shipping.isMissingNode && !shipping.isNull) shipping else billing
        val first = customer.path("first_name").asText("").trim()
        val last = customer.path("last_name").asText("").trim()
        val name = "$first $last".trim().ifBlank { "Customer" }
        var phone = customer.path("phone").asText("")
        if (phone.isBlank() && !billing.isMissingNode) {
            phone = billing.path("phone").asText("")
        }
        val failureReason = attempts.lastOrNull()?.reason.orEmpty()
        return ShopifyOrderContext(
            orderId = fmtId(order.get("id")),
            orderName = order.path("name").asText(""),
            customerId = fmtId(customer.get("id")),
            customerName = name,
            customerPhone = phone,
            customerEmail = customer.path("email").asText(""),
            address =
                OrderAddress(
                    line1 = addrNode.path("address1").asText(""),
                    line2 = addrNode.path("address2").asText(""),
                    city = addrNode.path("city").asText(""),
                    state = addrNode.path("province").asText(""),
                    postalCode = addrNode.path("zip").asText(""),
                ),
            language = defaultLang,
            previousAttempts = attempts,
            attemptNumber = attempts.size + 1,
            failureReason = failureReason,
            createdAt = order.path("created_at").asText(""),
            updatedAt = order.path("updated_at").asText(""),
        )
    }

    private fun fmtId(node: JsonNode?): String =
        when {
            node == null || node.isNull -> ""
            node.isTextual -> node.asText()
            node.isNumber -> node.asLong().toString()
            else -> node.toString()
        }

    private fun getMetafield(orderId: String, key: String): String? {
        val payload = request("GET", "/orders/$orderId/metafields.json?namespace=rto&key=$key")
        val metafields = payload.path("metafields")
        if (!metafields.isArray || metafields.isEmpty) return null
        return metafields[0].path("value").asText(null)
    }

    private fun setMetafield(orderId: String, key: String, value: String, type: String) {
        request(
            "POST",
            "/orders/$orderId/metafields.json",
            mapOf("metafield" to mapOf("namespace" to "rto", "key" to key, "value" to value, "type" to type)),
        )
    }

    private fun request(method: String, path: String, body: Any? = null): JsonNode {
        val url = "https://$domain/admin/api/$apiVersion$path"
        val builder =
            HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(30))
                .header("X-Shopify-Access-Token", accessToken)
                .header("Content-Type", "application/json")
        if (body != null) {
            builder.method(method, HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
        } else {
            builder.method(method, HttpRequest.BodyPublishers.noBody())
        }
        val response = http.send(builder.build(), HttpResponse.BodyHandlers.ofString())
        if (response.statusCode() !in 200..299) {
            throw IllegalStateException("shopify API $method $path: ${response.body().trim()}")
        }
        if (response.body().isBlank()) return objectMapper.createObjectNode()
        return objectMapper.readTree(response.body())
    }
}

package com.lumos.server.service

import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.engine.cio.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.*

@Serializable data class DemoChatRequest(val message: String, val model: String = "openai/gpt-4o-mini")
@Serializable data class DemoChatResponse(
    val reply: String, val model: String,
    val tokensIn: Int, val tokensOut: Int, val latencyMs: Long,
)

object DemoService {
    private val client = HttpClient(CIO) {
        install(ContentNegotiation) { json() }
    }

    suspend fun chat(apiKey: String, request: DemoChatRequest): DemoChatResponse {
        val start = System.currentTimeMillis()
        val response = client.post("https://openrouter.ai/api/v1/chat/completions") {
            header("Authorization", "Bearer $apiKey")
            header("Content-Type", "application/json")
            setBody(buildJsonObject {
                put("model", request.model)
                putJsonArray("messages") {
                    addJsonObject {
                        put("role", "user")
                        put("content", request.message)
                    }
                }
            }.toString())
        }
        val latency = System.currentTimeMillis() - start
        val body = response.body<JsonObject>()
        val reply = body["choices"]!!.jsonArray[0].jsonObject["message"]!!.jsonObject["content"]!!.jsonPrimitive.content
        val usage = body["usage"]?.jsonObject
        return DemoChatResponse(
            reply = reply,
            model = request.model,
            tokensIn = usage?.get("prompt_tokens")?.jsonPrimitive?.int ?: 0,
            tokensOut = usage?.get("completion_tokens")?.jsonPrimitive?.int ?: 0,
            latencyMs = latency,
        )
    }
}

package com.lumos.demo

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.lumos.Lumos
import com.lumos.Feedback
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

data class ChatMessage(
    val id: String = java.util.UUID.randomUUID().toString(),
    val role: String,
    val text: String,
    val traceId: String? = null,
)

@Serializable data class DemoChatRequest(val message: String)
@Serializable data class DemoChatResponse(
    val reply: String, val model: String,
    val tokensIn: Int, val tokensOut: Int, val latencyMs: Long,
)

class ChatViewModel : ViewModel() {
    private val _messages = MutableStateFlow<List<ChatMessage>>(emptyList())
    val messages: StateFlow<List<ChatMessage>> = _messages

    private val _loading = MutableStateFlow(false)
    val loading: StateFlow<Boolean> = _loading

    private val http = OkHttpClient()
    private val json = Json { ignoreUnknownKeys = true }
    private val SERVER = BuildConfig.SERVER_URL
    private val API_KEY = BuildConfig.LUMOS_API_KEY

    fun send(text: String) {
        viewModelScope.launch {
            _messages.value = _messages.value + ChatMessage(role = "user", text = text)
            _loading.value = true
            try {
                val trace = Lumos.startTrace("demo-chat")
                trace.logPrompt(text)

                val result = withContext(Dispatchers.IO) {
                    runCatching {
                        val serializeSpan = trace.startSpan("serialize_request")
                        val body = Json.encodeToString(DemoChatRequest.serializer(), DemoChatRequest(text))
                            .toRequestBody("application/json".toMediaType())
                        serializeSpan.end()

                        val httpSpan = trace.startSpan("http_round_trip")
                        val req = Request.Builder()
                            .url("$SERVER/v0/demo/chat")
                            .addHeader("X-Lumos-Key", API_KEY)
                            .post(body)
                            .build()
                        val raw = http.newCall(req).execute().use { resp ->
                            val bodyStr = resp.body?.string() ?: ""
                            if (!resp.isSuccessful) throw Exception("Server error ${resp.code}: $bodyStr")
                            bodyStr
                        }
                        httpSpan.end()

                        val parseSpan = trace.startSpan("parse_response")
                        val parsed = json.decodeFromString<DemoChatResponse>(raw)
                        parseSpan.end()

                        parsed
                    }
                }

                result.onSuccess { r ->
                    trace.logResponse(r.reply, r.model, r.tokensIn, r.tokensOut, r.latencyMs)
                    trace.end()
                    Lumos.endTrace(trace)
                    _messages.value = _messages.value + ChatMessage(
                        role = "ai", text = r.reply, traceId = trace.id
                    )
                }.onFailure { err ->
                    trace.logError(err)
                    trace.end()
                    Lumos.endTrace(trace)
                    _messages.value = _messages.value + ChatMessage(
                        role = "ai", text = "Error: ${err.message}"
                    )
                }
            } finally {
                _loading.value = false
            }
        }
    }

    fun thumbsUp(traceId: String) { Lumos.feedback(traceId, Feedback.ThumbsUp) }
    fun thumbsDown(traceId: String) { Lumos.feedback(traceId, Feedback.ThumbsDown) }
}

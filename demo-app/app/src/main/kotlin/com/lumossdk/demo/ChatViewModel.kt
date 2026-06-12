package com.lumossdk.demo

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.lumossdk.AgentLens
import com.lumossdk.Feedback
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
    private val SERVER = "http://YOUR_VPS_IP:8080"

    fun send(text: String) {
        viewModelScope.launch {
            _messages.value = _messages.value + ChatMessage(role = "user", text = text)
            _loading.value = true

            val trace = AgentLens.startTrace("demo-chat")
            trace.logPrompt(text)

            val result = withContext(Dispatchers.IO) {
                runCatching {
                    val body = Json.encodeToString(DemoChatRequest.serializer(), DemoChatRequest(text))
                    val req = Request.Builder().url("$SERVER/v0/demo/chat")
                        .post(body.toRequestBody("application/json".toMediaType()))
                        .build()
                    val resp = http.newCall(req).execute()
                    json.decodeFromString<DemoChatResponse>(resp.body!!.string())
                }
            }

            result.onSuccess { r ->
                trace.logResponse(r.reply, r.model, r.tokensIn, r.tokensOut, r.latencyMs)
                trace.end()
                AgentLens.endTrace(trace)
                _messages.value = _messages.value + ChatMessage(
                    role = "ai", text = r.reply, traceId = trace.id
                )
            }.onFailure {
                trace.logError(it)
                trace.end()
                AgentLens.endTrace(trace)
                _messages.value = _messages.value + ChatMessage(role = "ai", text = "Error: ${it.message}")
            }
            _loading.value = false
        }
    }

    fun thumbsUp(traceId: String) { AgentLens.feedback(traceId, Feedback.ThumbsUp) }
    fun thumbsDown(traceId: String) { AgentLens.feedback(traceId, Feedback.ThumbsDown) }
}

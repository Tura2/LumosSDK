package com.lumossdk

import android.content.Context
import com.lumossdk.db.LumosDatabase
import com.lumossdk.db.PendingEvent
import com.lumossdk.internal.DeviceInfo
import com.lumossdk.internal.SessionManager
import com.lumossdk.schema.*
import com.lumossdk.upload.UploadWorker
import kotlinx.coroutines.*
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.time.Instant
import java.util.UUID

object AgentLens {
    private lateinit var ctx: Context
    private lateinit var config: AgentLensConfig
    private var listener: AgentLensListener? = null
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    fun init(context: Context, block: AgentLensConfig.() -> Unit): AgentLens {
        ctx = context.applicationContext
        config = AgentLensConfig().apply(block)
        return this
    }

    fun startTrace(feature: String): Trace = Trace(feature = feature)

    fun feedback(traceId: String, feedback: Feedback) {
        val kind = when (feedback) {
            is Feedback.ThumbsUp -> "THUMBS_UP"
            is Feedback.ThumbsDown -> "THUMBS_DOWN"
        }
        val payload = FeedbackPayload(traceId = traceId, kind = kind)
        enqueue("FEEDBACK", Json.encodeToString(payload))
    }

    fun endTrace(trace: Trace) {
        if (!trace.ended) trace.end()
        val payload = TracePayload(
            traceId = trace.id,
            feature = trace.feature,
            input = trace.input,
            output = trace.output,
            model = trace.model,
            tokensIn = trace.tokensIn,
            tokensOut = trace.tokensOut,
            latencyMs = trace.latencyMs,
            status = trace.status.name,
        )
        enqueue("TRACE", Json.encodeToString(payload))
        trace.spans.forEach { span ->
            val spanPayload = SpanPayload(
                traceId = trace.id,
                spanId = span.spanId,
                name = span.name,
                durationMs = span.durationMs,
            )
            enqueue("SPAN", Json.encodeToString(spanPayload))
        }
        triggerUpload()
    }

    fun setListener(l: AgentLensListener) { listener = l }

    suspend fun flush() = withContext(Dispatchers.IO) { triggerUpload() }

    fun shutdown() { scope.cancel() }

    private fun enqueue(type: String, payloadJson: String) {
        val envelope = EventEnvelope(
            eventId = UUID.randomUUID().toString(),
            type = type,
            timestamp = Instant.now().toString(),
            sessionId = SessionManager.currentSessionId(),
            appPackage = ctx.packageName,
            appVersion = DeviceInfo.appVersion(ctx),
            sdkVersion = "0.1.0",
            deviceModel = DeviceInfo.model(),
            androidVersion = DeviceInfo.androidVersion(),
            payload = payloadJson,
        )
        scope.launch {
            LumosDatabase.get(ctx).eventDao().insert(
                PendingEvent(envelope.eventId, payloadJson = Json.encodeToString(envelope))
            )
        }
    }

    private fun triggerUpload() {
        UploadWorker.enqueue(ctx, config.serverUrl, config.apiKey)
    }
}

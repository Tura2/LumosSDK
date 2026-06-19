package com.lumos

import android.content.Context
import com.lumos.db.LumosDatabase
import com.lumos.db.PendingEvent
import com.lumos.internal.DeviceInfo
import com.lumos.internal.SessionManager
import com.lumos.schema.*
import com.lumos.upload.UploadWorker
import kotlinx.coroutines.*
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.time.Instant
import java.util.UUID

object Lumos {
    private lateinit var ctx: Context
    private lateinit var config: LumosConfig
    private var listener: LumosListener? = null
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    fun init(context: Context, block: LumosConfig.() -> Unit): Lumos {
        ctx = context.applicationContext
        config = LumosConfig().apply(block)
        return this
    }

    fun startTrace(feature: String): Trace = Trace(feature = feature)

    fun feedback(traceId: String, feedback: Feedback) {
        val kind = when (feedback) {
            is Feedback.ThumbsUp -> "THUMBS_UP"
            is Feedback.ThumbsDown -> "THUMBS_DOWN"
        }
        val envelope = buildEnvelope("FEEDBACK", Json.encodeToString(FeedbackPayload(traceId = traceId, kind = kind)))
        scope.launch {
            LumosDatabase.get(ctx).eventDao().insert(PendingEvent(eventId = envelope.eventId, payloadJson = Json.encodeToString(envelope)))
            triggerUpload()
        }
    }

    fun endTrace(trace: Trace) {
        if (!trace.ended) trace.end()
        val tracePayload = TracePayload(
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
        val envelopes = buildList {
            add(buildEnvelope("TRACE", Json.encodeToString(tracePayload)))
            trace.spans.forEach { span ->
                add(buildEnvelope("SPAN", Json.encodeToString(SpanPayload(
                    traceId = trace.id,
                    spanId = span.spanId,
                    name = span.name,
                    durationMs = span.durationMs,
                ))))
            }
        }
        scope.launch {
            val dao = LumosDatabase.get(ctx).eventDao()
            envelopes.forEach { dao.insert(PendingEvent(eventId = it.eventId, payloadJson = Json.encodeToString(it))) }
            triggerUpload()
        }
    }

    fun setListener(l: LumosListener) { listener = l }

    suspend fun flush() = withContext(Dispatchers.IO) { triggerUpload() }

    fun shutdown() { scope.cancel() }

    private fun buildEnvelope(type: String, payloadJson: String) = EventEnvelope(
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

    private fun triggerUpload() {
        UploadWorker.enqueue(ctx, config.serverUrl, config.apiKey)
    }
}

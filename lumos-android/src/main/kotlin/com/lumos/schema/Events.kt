package com.lumos.schema

import kotlinx.serialization.Serializable

@Serializable
data class EventEnvelope(
    val eventId: String,
    val type: String,           // "TRACE", "SPAN", "FEEDBACK"
    val timestamp: String,      // ISO-8601
    val sessionId: String,
    val appPackage: String,
    val appVersion: String,
    val sdkVersion: String,
    val deviceModel: String,
    val androidVersion: Int,
    val payload: String,        // JSON-encoded payload
)

@Serializable
data class TracePayload(
    val traceId: String,
    val feature: String,
    val input: String,
    val output: String? = null,
    val model: String? = null,
    val tokensIn: Int? = null,
    val tokensOut: Int? = null,
    val latencyMs: Long? = null,
    val status: String,
)

@Serializable
data class SpanPayload(
    val traceId: String,
    val spanId: String,
    val name: String,
    val durationMs: Long,
)

@Serializable
data class FeedbackPayload(
    val traceId: String,
    val kind: String,           // "THUMBS_UP", "THUMBS_DOWN"
)

package com.lumossdk.server.service

import com.lumossdk.server.db.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.LocalDateTime
import java.time.temporal.ChronoUnit
import java.util.UUID

@Serializable
data class IncomingEnvelope(
    val eventId: String,
    val type: String,
    val timestamp: String,
    val sessionId: String,
    val appPackage: String,
    val appVersion: String,
    val sdkVersion: String,
    val deviceModel: String,
    val androidVersion: Int,
    val payload: String,
)

@Serializable data class TracePayload(
    val traceId: String, val feature: String,
    val input: String, val output: String? = null,
    val model: String? = null, val tokensIn: Int? = null,
    val tokensOut: Int? = null, val latencyMs: Long? = null,
    val status: String,
)

@Serializable data class SpanPayload(
    val traceId: String, val spanId: String, val name: String, val durationMs: Long,
)

@Serializable data class FeedbackPayload(val traceId: String, val kind: String)

object IngestionService {
    private val json = Json { ignoreUnknownKeys = true }

    fun ingest(appId: String, events: List<IncomingEnvelope>) = transaction {
        events.forEach { env ->
            if (IngestedEvents.select { IngestedEvents.eventId eq env.eventId }.count() > 0L) return@forEach
            IngestedEvents.insert { it[eventId] = env.eventId }

            val now = LocalDateTime.now()
            val hourBucket = now.truncatedTo(ChronoUnit.HOURS)

            when (env.type) {
                "TRACE" -> {
                    val p = json.decodeFromString<TracePayload>(env.payload)
                    Traces.insert {
                        it[traceId] = p.traceId; it[Traces.appId] = appId
                        it[feature] = p.feature; it[sessionId] = env.sessionId
                        it[input] = p.input; it[output] = p.output
                        it[model] = p.model; it[tokensIn] = p.tokensIn
                        it[tokensOut] = p.tokensOut; it[latencyMs] = p.latencyMs
                        it[status] = p.status; it[startedAt] = now
                    }
                    val isOk = p.status == "OK"
                    val isError = p.status == "ERROR"
                    StatsHourly.upsert(StatsHourly.appId, StatsHourly.feature, StatsHourly.hourBucket) {
                        it[StatsHourly.appId] = appId; it[StatsHourly.feature] = p.feature
                        it[StatsHourly.hourBucket] = hourBucket
                        it[tracesCount] = 1; it[okCount] = if (isOk) 1 else 0
                        it[errorCount] = if (isError) 1 else 0
                        it[tokensInSum] = (p.tokensIn ?: 0).toLong()
                        it[tokensOutSum] = (p.tokensOut ?: 0).toLong()
                        it[latencySum] = p.latencyMs ?: 0
                    }
                }
                "SPAN" -> {
                    val p = json.decodeFromString<SpanPayload>(env.payload)
                    Spans.insert {
                        it[spanId] = p.spanId; it[traceId] = p.traceId
                        it[name] = p.name; it[durationMs] = p.durationMs; it[startedAt] = now
                    }
                }
                "FEEDBACK" -> {
                    val p = json.decodeFromString<FeedbackPayload>(env.payload)
                    FeedbackTable.insert {
                        it[id] = UUID.randomUUID().toString(); it[traceId] = p.traceId
                        it[kind] = p.kind; it[createdAt] = now
                    }
                    val isUp = p.kind == "THUMBS_UP"
                    val traceRow = Traces.select { Traces.traceId eq p.traceId }.singleOrNull()
                    traceRow?.let { row ->
                        StatsHourly.upsert(StatsHourly.appId, StatsHourly.feature, StatsHourly.hourBucket) {
                            it[StatsHourly.appId] = appId; it[feature] = row[Traces.feature]
                            it[StatsHourly.hourBucket] = hourBucket
                            it[thumbsUp] = if (isUp) 1 else 0
                            it[thumbsDown] = if (!isUp) 1 else 0
                        }
                    }
                }
            }
        }
    }
}

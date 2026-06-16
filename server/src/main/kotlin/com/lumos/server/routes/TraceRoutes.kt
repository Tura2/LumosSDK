package com.lumos.server.routes

import com.lumos.server.db.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction

fun Routing.traceRoutes() {
    authenticate("jwt") {
        get("/api/apps/{appId}/traces") {
            val appId = call.parameters["appId"]!!
            val traces = transaction {
                Traces.select { Traces.appId eq appId }
                    .orderBy(Traces.startedAt, org.jetbrains.exposed.sql.SortOrder.DESC)
                    .limit(50).map {
                        mapOf(
                            "traceId" to it[Traces.traceId],
                            "feature" to it[Traces.feature],
                            "status" to it[Traces.status],
                            "latencyMs" to it[Traces.latencyMs],
                            "tokensIn" to it[Traces.tokensIn],
                            "tokensOut" to it[Traces.tokensOut],
                            "startedAt" to it[Traces.startedAt].toString(),
                        )
                    }
            }
            call.respond(traces)
        }

        get("/api/traces/{traceId}") {
            val traceId = call.parameters["traceId"]!!
            val trace = transaction {
                Traces.select { Traces.traceId eq traceId }.singleOrNull()?.let { row ->
                    val spans = Spans.select { Spans.traceId eq traceId }
                        .map { mapOf("name" to it[Spans.name], "durationMs" to it[Spans.durationMs]) }
                    val feedback = FeedbackTable.select { FeedbackTable.traceId eq traceId }
                        .map { it[FeedbackTable.kind] }
                    mapOf(
                        "traceId" to row[Traces.traceId],
                        "feature" to row[Traces.feature],
                        "input" to row[Traces.input],
                        "output" to row[Traces.output],
                        "model" to row[Traces.model],
                        "tokensIn" to row[Traces.tokensIn],
                        "tokensOut" to row[Traces.tokensOut],
                        "latencyMs" to row[Traces.latencyMs],
                        "status" to row[Traces.status],
                        "startedAt" to row[Traces.startedAt].toString(),
                        "spans" to spans,
                        "feedback" to feedback,
                    )
                }
            } ?: return@get call.respond(HttpStatusCode.NotFound)
            call.respond(trace)
        }
    }
}

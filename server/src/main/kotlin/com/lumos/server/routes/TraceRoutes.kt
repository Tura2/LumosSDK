package com.lumos.server.routes

import com.lumos.server.db.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction

fun Routing.traceRoutes() {
    authenticate("jwt") {
        get("/api/apps/{appId}/traces") {
            val accountId = call.principal<JWTPrincipal>()!!.getClaim("accountId", String::class)!!
            val appId = call.parameters["appId"]!!
            val owns = transaction { Apps.select { (Apps.id eq appId) and (Apps.accountId eq accountId) }.count() > 0 }
            if (!owns) return@get call.respond(HttpStatusCode.Forbidden)
            val traces = transaction {
                Traces.select { Traces.appId eq appId }
                    .orderBy(Traces.startedAt, SortOrder.DESC)
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
            val accountId = call.principal<JWTPrincipal>()!!.getClaim("accountId", String::class)!!
            val traceId = call.parameters["traceId"]!!
            val trace = transaction {
                (Traces innerJoin Apps)
                    .select { (Traces.traceId eq traceId) and (Apps.accountId eq accountId) }
                    .singleOrNull()?.let { row ->
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

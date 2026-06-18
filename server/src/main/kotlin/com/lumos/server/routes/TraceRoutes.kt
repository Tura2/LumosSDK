package com.lumos.server.routes

import com.lumos.server.db.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction

@Serializable
data class DeviceDto(
    val deviceModel: String,
    val androidVersion: Int? = null,
    val sdkVersion: String? = null,
    val appVersion: String? = null,
)

@Serializable
data class TraceListItem(
    val traceId: String, val feature: String, val status: String,
    val model: String? = null, val latencyMs: Long? = null,
    val tokensIn: Int? = null, val tokensOut: Int? = null,
    val startedAt: String, val device: DeviceDto? = null,
)

@Serializable data class SpanDto(val name: String, val durationMs: Long)

@Serializable
data class TraceDetailDto(
    val traceId: String, val feature: String, val status: String,
    val input: String, val output: String? = null, val model: String? = null,
    val tokensIn: Int? = null, val tokensOut: Int? = null, val latencyMs: Long? = null,
    val startedAt: String, val spans: List<SpanDto>, val feedback: List<String>,
    val device: DeviceDto? = null,
)

private fun deviceOf(model: String?, android: Int?, sdk: String?, appVer: String?): DeviceDto? =
    if (model == null) null else DeviceDto(model, android, sdk, appVer)

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
                        TraceListItem(
                            traceId = it[Traces.traceId],
                            feature = it[Traces.feature],
                            status = it[Traces.status],
                            model = it[Traces.model],
                            latencyMs = it[Traces.latencyMs],
                            tokensIn = it[Traces.tokensIn],
                            tokensOut = it[Traces.tokensOut],
                            startedAt = it[Traces.startedAt].toString(),
                            device = deviceOf(
                                it[Traces.deviceModel], it[Traces.androidVersion],
                                it[Traces.sdkVersion], it[Traces.appVersion],
                            ),
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
                            .map { SpanDto(it[Spans.name], it[Spans.durationMs]) }
                        val feedback = FeedbackTable.select { FeedbackTable.traceId eq traceId }
                            .map { it[FeedbackTable.kind] }
                        TraceDetailDto(
                            traceId = row[Traces.traceId],
                            feature = row[Traces.feature],
                            status = row[Traces.status],
                            input = row[Traces.input],
                            output = row[Traces.output],
                            model = row[Traces.model],
                            tokensIn = row[Traces.tokensIn],
                            tokensOut = row[Traces.tokensOut],
                            latencyMs = row[Traces.latencyMs],
                            startedAt = row[Traces.startedAt].toString(),
                            spans = spans,
                            feedback = feedback,
                            device = deviceOf(
                                row[Traces.deviceModel], row[Traces.androidVersion],
                                row[Traces.sdkVersion], row[Traces.appVersion],
                            ),
                        )
                    }
            } ?: return@get call.respond(HttpStatusCode.NotFound)
            call.respond(trace)
        }
    }
}

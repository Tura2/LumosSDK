package com.lumos.server.routes

import com.lumos.server.db.Apps
import com.lumos.server.db.Traces
import com.lumos.server.dto.SessionTraceDto
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import java.util.UUID

@Serializable
data class SessionSummary(
    val sessionId: String,
    val traceCount: Int,
    val firstSeen: String,
    val lastSeen: String,
    val errorCount: Int,
    val features: List<String>,
)

fun Routing.sessionRoutes() {
    authenticate("jwt") {
        get("/api/apps/{appId}/sessions") {
            val accountId = call.principal<JWTPrincipal>()!!.getClaim("accountId", String::class)!!
            val appId = call.parameters["appId"]!!
            if (!ownsApp(accountId, appId)) return@get call.respond(HttpStatusCode.Forbidden)

            // Validate UUID format to prevent SQL injection in the raw exec below
            try { UUID.fromString(appId) } catch (_: IllegalArgumentException) {
                return@get call.respond(HttpStatusCode.BadRequest)
            }

            val sessions = transaction {
                exec(
                    """
                    SELECT session_id,
                           COUNT(*) AS trace_count,
                           MIN(started_at) AS first_seen,
                           MAX(started_at) AS last_seen,
                           SUM(CASE WHEN status = 'ERROR' THEN 1 ELSE 0 END) AS error_count,
                           GROUP_CONCAT(DISTINCT feature) AS features
                    FROM traces
                    WHERE app_id = '$appId'
                    GROUP BY session_id
                    ORDER BY MAX(started_at) DESC
                    """.trimIndent()
                ) { rs ->
                    buildList {
                        while (rs.next()) {
                            add(
                                SessionSummary(
                                    sessionId = rs.getString("session_id"),
                                    traceCount = rs.getInt("trace_count"),
                                    firstSeen = rs.getString("first_seen"),
                                    lastSeen = rs.getString("last_seen"),
                                    errorCount = rs.getInt("error_count"),
                                    features = rs.getString("features")
                                        ?.split(",")?.map { it.trim() }?.distinct() ?: emptyList(),
                                )
                            )
                        }
                    }
                } ?: emptyList()
            }
            call.respond(sessions)
        }

        get("/api/apps/{appId}/sessions/{sessionId}/traces") {
            val accountId = call.principal<JWTPrincipal>()!!.getClaim("accountId", String::class)!!
            val appId = call.parameters["appId"]!!
            val sessionId = call.parameters["sessionId"]!!
            if (!ownsApp(accountId, appId)) return@get call.respond(HttpStatusCode.Forbidden)

            val traces = transaction {
                Traces.select { (Traces.appId eq appId) and (Traces.sessionId eq sessionId) }
                    .orderBy(Traces.startedAt)
                    .map { row ->
                        SessionTraceDto(
                            traceId = row[Traces.traceId],
                            feature = row[Traces.feature],
                            status = row[Traces.status],
                            model = row[Traces.model] ?: "",
                            latencyMs = row[Traces.latencyMs]?.toString() ?: "",
                            startedAt = row[Traces.startedAt].toString(),
                        )
                    }
            }
            call.respond(traces)
        }
    }
}

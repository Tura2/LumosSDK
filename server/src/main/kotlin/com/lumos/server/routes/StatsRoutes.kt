package com.lumos.server.routes

import com.lumos.server.db.Apps
import com.lumos.server.service.StatsService
import com.lumos.server.service.Totals
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
import java.time.LocalDateTime

@Serializable
data class WindowDto(
    val traces: Long, val ok: Long, val errors: Long,
    val latencySum: Long, val tokensIn: Long, val tokensOut: Long,
)

@Serializable data class TrendDto(val current: WindowDto, val previous: WindowDto)

@Serializable
data class StatsDto(
    val traces: Long, val ok: Long, val errors: Long,
    val tokensIn: Long, val tokensOut: Long, val latencySum: Long,
    val thumbsUp: Long, val thumbsDown: Long, val trend: TrendDto,
)

private fun windowDto(t: Totals) = WindowDto(t.traces, t.ok, t.errors, t.latencySum, t.tokensIn, t.tokensOut)

fun Routing.statsRoutes() {
    authenticate("jwt") {
        get("/api/apps/{appId}/stats") {
            val accountId = call.principal<JWTPrincipal>()!!.getClaim("accountId", String::class)!!
            val appId = call.parameters["appId"]!!
            if (!ownsApp(accountId, appId)) return@get call.respond(HttpStatusCode.Forbidden)

            val now = LocalDateTime.now()
            val all = StatsService.totals(appId)
            val current = StatsService.windowTotals(appId, now.minusDays(7), now)
            val previous = StatsService.windowTotals(appId, now.minusDays(14), now.minusDays(7))
            call.respond(
                StatsDto(
                    traces = all.traces, ok = all.ok, errors = all.errors,
                    tokensIn = all.tokensIn, tokensOut = all.tokensOut, latencySum = all.latencySum,
                    thumbsUp = all.thumbsUp, thumbsDown = all.thumbsDown,
                    trend = TrendDto(current = windowDto(current), previous = windowDto(previous)),
                )
            )
        }

        get("/api/apps/{appId}/stats/hourly") {
            val accountId = call.principal<JWTPrincipal>()!!.getClaim("accountId", String::class)!!
            val appId = call.parameters["appId"]!!
            if (!ownsApp(accountId, appId)) return@get call.respond(HttpStatusCode.Forbidden)
            call.respond(StatsService.hourly(appId, LocalDateTime.now()))
        }
    }
}

private fun ownsApp(accountId: String, appId: String): Boolean = transaction {
    Apps.select { (Apps.id eq appId) and (Apps.accountId eq accountId) }.count() > 0
}

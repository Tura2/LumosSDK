package com.lumos.server.routes

import com.lumos.server.db.Apps
import com.lumos.server.db.StatsHourly
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction

fun Routing.statsRoutes() {
    authenticate("jwt") {
        get("/api/apps/{appId}/stats") {
            val accountId = call.principal<JWTPrincipal>()!!.getClaim("accountId", String::class)!!
            val appId = call.parameters["appId"]!!
            val owns = transaction { Apps.select { (Apps.id eq appId) and (Apps.accountId eq accountId) }.count() > 0 }
            if (!owns) return@get call.respond(HttpStatusCode.Forbidden)
            val stats = transaction {
                StatsHourly.select { StatsHourly.appId eq appId }.fold(
                    mutableMapOf<String, Long>(
                        "traces" to 0L, "ok" to 0L, "errors" to 0L,
                        "tokensIn" to 0L, "tokensOut" to 0L,
                        "latencySum" to 0L, "thumbsUp" to 0L, "thumbsDown" to 0L,
                    )
                ) { acc, row ->
                    acc["traces"] = acc["traces"]!! + row[StatsHourly.tracesCount]
                    acc["ok"] = acc["ok"]!! + row[StatsHourly.okCount]
                    acc["errors"] = acc["errors"]!! + row[StatsHourly.errorCount]
                    acc["tokensIn"] = acc["tokensIn"]!! + row[StatsHourly.tokensInSum]
                    acc["tokensOut"] = acc["tokensOut"]!! + row[StatsHourly.tokensOutSum]
                    acc["latencySum"] = acc["latencySum"]!! + row[StatsHourly.latencySum]
                    acc["thumbsUp"] = acc["thumbsUp"]!! + row[StatsHourly.thumbsUp]
                    acc["thumbsDown"] = acc["thumbsDown"]!! + row[StatsHourly.thumbsDown]
                    acc
                }
            }
            call.respond(stats)
        }
    }
}

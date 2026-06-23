package com.lumos.server.routes

import com.lumos.server.db.Accounts
import com.lumos.server.db.Apps
import com.lumos.server.db.ApiKeys
import com.lumos.server.db.Traces
import com.lumos.server.db.Spans
import com.lumos.server.db.FeedbackTable
import com.lumos.server.db.StatsHourly
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction

@Serializable data class UpdateAccountRequest(
    val name: String? = null,
    val email: String? = null,
)

fun Routing.accountRoutes() {
    authenticate("jwt") {
        get("/api/account") {
            val accountId = call.principal<JWTPrincipal>()!!.getClaim("accountId", String::class)!!
            val account = transaction {
                Accounts.select { Accounts.id eq accountId }.singleOrNull()?.let { row ->
                    mapOf(
                        "id" to row[Accounts.id],
                        "email" to row[Accounts.email],
                        "name" to (row[Accounts.name] ?: ""),
                    )
                }
            } ?: return@get call.respond(HttpStatusCode.NotFound)
            call.respond(account)
        }

        patch("/api/account") {
            val accountId = call.principal<JWTPrincipal>()!!.getClaim("accountId", String::class)!!
            val req = call.receive<UpdateAccountRequest>()
            val updated = transaction {
                Accounts.update({ Accounts.id eq accountId }) {
                    if (req.name != null) it[name] = req.name
                    if (req.email != null) it[email] = req.email
                }
                Accounts.select { Accounts.id eq accountId }.singleOrNull()?.let { row ->
                    mapOf(
                        "id" to row[Accounts.id],
                        "email" to row[Accounts.email],
                        "name" to (row[Accounts.name] ?: ""),
                    )
                }
            } ?: return@patch call.respond(HttpStatusCode.NotFound)
            call.respond(updated)
        }

        delete("/api/account") {
            val accountId = call.principal<JWTPrincipal>()!!.getClaim("accountId", String::class)!!
            transaction {
                val appIds = Apps.select { Apps.accountId eq accountId }.map { it[Apps.id] }
                appIds.forEach { appId ->
                    val traceIds = Traces.select { Traces.appId eq appId }.map { it[Traces.traceId] }
                    traceIds.forEach { tid ->
                        Spans.deleteWhere { Spans.traceId eq tid }
                        FeedbackTable.deleteWhere { FeedbackTable.traceId eq tid }
                    }
                    Traces.deleteWhere { Traces.appId eq appId }
                    StatsHourly.deleteWhere { StatsHourly.appId eq appId }
                    ApiKeys.deleteWhere { ApiKeys.appId eq appId }
                }
                Apps.deleteWhere { Apps.accountId eq accountId }
                Accounts.deleteWhere { Accounts.id eq accountId }
            }
            call.respond(HttpStatusCode.NoContent)
        }
    }
}

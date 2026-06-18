package com.lumos.server.routes

import com.lumos.server.db.Apps
import com.lumos.server.service.AppService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update
import java.time.LocalDateTime
import java.util.UUID

@Serializable data class CreateAppRequest(val name: String, val packageName: String)
@Serializable data class UpdateAppRequest(val name: String? = null, val packageName: String? = null)

fun Routing.appRoutes() {
    authenticate("jwt") {
        get("/api/apps") {
            val accountId = call.principal<JWTPrincipal>()!!.getClaim("accountId", String::class)!!
            val apps = transaction {
                Apps.select { Apps.accountId eq accountId }.map {
                    mapOf("id" to it[Apps.id], "name" to it[Apps.name], "packageName" to it[Apps.packageName])
                }
            }
            call.respond(apps)
        }

        post("/api/apps") {
            val accountId = call.principal<JWTPrincipal>()!!.getClaim("accountId", String::class)!!
            val req = call.receive<CreateAppRequest>()
            val appId = UUID.randomUUID().toString()
            transaction {
                Apps.insert {
                    it[id] = appId
                    it[Apps.accountId] = accountId
                    it[name] = req.name
                    it[packageName] = req.packageName
                    it[createdAt] = LocalDateTime.now()
                }
            }
            call.respond(HttpStatusCode.Created, mapOf("id" to appId))
        }

        patch("/api/apps/{appId}") {
            val accountId = call.principal<JWTPrincipal>()!!.getClaim("accountId", String::class)!!
            val appId = call.parameters["appId"]!!
            val owns = transaction { Apps.select { (Apps.id eq appId) and (Apps.accountId eq accountId) }.count() > 0 }
            if (!owns) return@patch call.respond(HttpStatusCode.Forbidden)
            val req = call.receive<UpdateAppRequest>()
            val updated = transaction {
                Apps.update({ Apps.id eq appId }) {
                    if (req.name != null) it[name] = req.name
                    if (req.packageName != null) it[packageName] = req.packageName
                }
                Apps.select { Apps.id eq appId }.singleOrNull()?.let { row ->
                    mapOf("id" to row[Apps.id], "name" to row[Apps.name], "packageName" to row[Apps.packageName])
                }
            } ?: return@patch call.respond(HttpStatusCode.NotFound)
            call.respond(updated)
        }

        delete("/api/apps/{appId}") {
            val accountId = call.principal<JWTPrincipal>()!!.getClaim("accountId", String::class)!!
            val appId = call.parameters["appId"]!!
            val owns = transaction { Apps.select { (Apps.id eq appId) and (Apps.accountId eq accountId) }.count() > 0 }
            if (!owns) return@delete call.respond(HttpStatusCode.Forbidden)
            AppService.delete(appId)
            call.respond(HttpStatusCode.NoContent)
        }
    }
}

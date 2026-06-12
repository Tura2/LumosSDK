package com.lumossdk.server.routes

import com.lumossdk.server.db.Apps
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.LocalDateTime
import java.util.UUID

@Serializable data class CreateAppRequest(val name: String, val packageName: String)

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
    }
}

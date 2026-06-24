package com.lumos.server.routes

import com.lumos.server.db.ApiKeys
import com.lumos.server.db.Apps
import com.lumos.server.dto.CreatedKeyDto
import com.lumos.server.service.KeyService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction

@Serializable data class CreateKeyRequest(val name: String)

fun Routing.keyRoutes() {
    authenticate("jwt") {
        get("/api/apps/{appId}/keys") {
            val accountId = call.principal<JWTPrincipal>()!!.getClaim("accountId", String::class)!!
            val appId = call.parameters["appId"]!!
            val owns = transaction { Apps.select { (Apps.id eq appId) and (Apps.accountId eq accountId) }.count() > 0 }
            if (!owns) return@get call.respond(HttpStatusCode.Forbidden)
            call.respond(KeyService.listForApp(appId))
        }

        post("/api/apps/{appId}/keys") {
            val accountId = call.principal<JWTPrincipal>()!!.getClaim("accountId", String::class)!!
            val appId = call.parameters["appId"]!!
            val owns = transaction { Apps.select { (Apps.id eq appId) and (Apps.accountId eq accountId) }.count() > 0 }
            if (!owns) return@post call.respond(HttpStatusCode.Forbidden)
            val req = call.receive<CreateKeyRequest>()
            val (keyId, secret) = KeyService.create(appId, req.name)
            call.respond(HttpStatusCode.Created, CreatedKeyDto(id = keyId, secret = secret))
        }

        delete("/api/apps/{appId}/keys/{keyId}") {
            val accountId = call.principal<JWTPrincipal>()!!.getClaim("accountId", String::class)!!
            val appId = call.parameters["appId"]!!
            val keyId = call.parameters["keyId"]!!
            val owns = transaction {
                (ApiKeys innerJoin Apps)
                    .select { (ApiKeys.id eq keyId) and (Apps.id eq appId) and (Apps.accountId eq accountId) }
                    .count() > 0
            }
            if (!owns) return@delete call.respond(HttpStatusCode.Forbidden)
            if (KeyService.delete(keyId)) call.respond(HttpStatusCode.NoContent)
            else call.respond(HttpStatusCode.NotFound)
        }

        delete("/api/keys/{keyId}") {
            val accountId = call.principal<JWTPrincipal>()!!.getClaim("accountId", String::class)!!
            val keyId = call.parameters["keyId"]!!
            val owns = transaction {
                (ApiKeys innerJoin Apps)
                    .select { (ApiKeys.id eq keyId) and (Apps.accountId eq accountId) }
                    .count() > 0
            }
            if (!owns) return@delete call.respond(HttpStatusCode.Forbidden)
            if (KeyService.revoke(keyId)) call.respond(HttpStatusCode.NoContent)
            else call.respond(HttpStatusCode.NotFound)
        }
    }
}

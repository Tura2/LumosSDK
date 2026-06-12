package com.lumossdk.server.routes

import com.lumossdk.server.service.KeyService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable

@Serializable data class CreateKeyRequest(val name: String)

fun Routing.keyRoutes() {
    authenticate("jwt") {
        get("/api/apps/{appId}/keys") {
            val appId = call.parameters["appId"]!!
            call.respond(KeyService.listForApp(appId))
        }

        post("/api/apps/{appId}/keys") {
            val appId = call.parameters["appId"]!!
            val req = call.receive<CreateKeyRequest>()
            val (keyId, secret) = KeyService.create(appId, req.name)
            call.respond(HttpStatusCode.Created, mapOf("id" to keyId, "secret" to secret))
        }

        delete("/api/keys/{keyId}") {
            val keyId = call.parameters["keyId"]!!
            if (KeyService.revoke(keyId)) call.respond(HttpStatusCode.NoContent)
            else call.respond(HttpStatusCode.NotFound)
        }
    }
}

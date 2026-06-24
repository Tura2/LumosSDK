package com.lumos.server.routes

import com.lumos.server.dto.*
import com.lumos.server.service.IngestionService
import com.lumos.server.service.IncomingEnvelope
import com.lumos.server.service.KeyService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.json.Json

fun Routing.eventRoutes() {
    post("/v0/events") {
        val apiKey = call.request.header("X-Lumos-Key")
            ?: return@post call.respond(HttpStatusCode.Unauthorized)
        val appId = KeyService.verify(apiKey)
            ?: return@post call.respond(HttpStatusCode.Unauthorized)
        val body = call.receiveText()
        val events = Json.decodeFromString<List<IncomingEnvelope>>(body)
        IngestionService.ingest(appId, events)
        call.respond(HttpStatusCode.OK, IngestResponse(accepted = events.size))
    }

    get("/v0/config") {
        val apiKey = call.request.header("X-Lumos-Key")
            ?: return@get call.respond(HttpStatusCode.Unauthorized)
        KeyService.verify(apiKey)
            ?: return@get call.respond(HttpStatusCode.Unauthorized)
        call.respond(ConfigResponse(active = true))
    }
}

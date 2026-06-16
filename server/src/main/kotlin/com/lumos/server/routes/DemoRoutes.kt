package com.lumos.server.routes

import com.lumos.server.service.DemoChatRequest
import com.lumos.server.service.DemoService
import com.lumos.server.service.KeyService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Routing.demoRoutes() {
    post("/v0/demo/chat") {
        val apiKey = call.request.header("X-Lumos-Key")
            ?: return@post call.respond(HttpStatusCode.Unauthorized)
        KeyService.verify(apiKey)
            ?: return@post call.respond(HttpStatusCode.Unauthorized)
        val openRouterKey = call.application.environment.config
            .property("openrouter.apiKey").getString()
        val req = call.receive<DemoChatRequest>()
        val result = DemoService.chat(openRouterKey, req)
        call.respond(result)
    }
}

package com.lumossdk.server.routes

import com.lumossdk.server.service.DemoChatRequest
import com.lumossdk.server.service.DemoService
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Routing.demoRoutes() {
    post("/v0/demo/chat") {
        val apiKey = call.application.environment.config
            .property("openrouter.apiKey").getString()
        val req = call.receive<DemoChatRequest>()
        val result = DemoService.chat(apiKey, req)
        call.respond(result)
    }
}

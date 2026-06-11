package com.lumossdk.server

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.lumossdk.server.db.DatabaseFactory
import com.lumossdk.server.routes.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.routing.*

fun main(args: Array<String>) = EngineMain.main(args)

fun Application.module() {
    DatabaseFactory.init()
    install(ContentNegotiation) { json() }
    install(CORS) {
        anyHost()
        allowHeader("Authorization")
        allowHeader("Content-Type")
        allowHeader("X-Lumos-Key")
        allowMethod(io.ktor.http.HttpMethod.Delete)
    }
    install(Authentication) {
        jwt("jwt") {
            val secret = environment.config.property("jwt.secret").getString()
            val issuer = environment.config.property("jwt.issuer").getString()
            val audience = environment.config.property("jwt.audience").getString()
            verifier(JWT.require(Algorithm.HMAC256(secret)).withIssuer(issuer).withAudience(audience).build())
            validate { cred ->
                if (cred.payload.getClaim("accountId").asString() != null) JWTPrincipal(cred.payload) else null
            }
        }
    }
    routing {
        eventRoutes()
        demoRoutes()
        authRoutes()
        appRoutes()
        keyRoutes()
        statsRoutes()
        traceRoutes()
    }
}

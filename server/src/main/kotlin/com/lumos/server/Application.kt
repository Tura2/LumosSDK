package com.lumos.server

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.lumos.server.db.DatabaseFactory
import com.lumos.server.routes.*
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
    val jwtSecret = environment.config.property("jwt.secret").getString()
    val jwtIssuer = environment.config.property("jwt.issuer").getString()
    val jwtAudience = environment.config.property("jwt.audience").getString()
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
            verifier(JWT.require(Algorithm.HMAC256(jwtSecret)).withIssuer(jwtIssuer).withAudience(jwtAudience).build())
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

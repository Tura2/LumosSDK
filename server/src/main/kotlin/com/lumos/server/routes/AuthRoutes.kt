package com.lumos.server.routes

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.lumos.server.db.Accounts
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.mindrot.jbcrypt.BCrypt
import java.time.LocalDateTime
import java.util.Date
import java.util.UUID

@Serializable data class AuthRequest(val email: String, val password: String)
@Serializable data class AuthResponse(val token: String, val email: String)

fun Routing.authRoutes() {
    post("/api/auth/register") {
        val req = call.receive<AuthRequest>()
        if (req.email.isBlank() || !req.email.contains("@")) {
            return@post call.respond(HttpStatusCode.BadRequest, "Invalid email")
        }
        if (req.password.length < 8) {
            return@post call.respond(HttpStatusCode.BadRequest, "Password must be at least 8 characters")
        }
        val existing = transaction { Accounts.select { Accounts.email eq req.email }.count() }
        if (existing > 0) return@post call.respond(HttpStatusCode.Conflict, "Email already registered")
        val accountId = UUID.randomUUID().toString()
        transaction {
            Accounts.insert {
                it[id] = accountId
                it[email] = req.email
                it[passwordHash] = BCrypt.hashpw(req.password, BCrypt.gensalt())
                it[createdAt] = LocalDateTime.now()
            }
        }
        call.respond(AuthResponse(generateToken(call, accountId), req.email))
    }

    post("/api/auth/login") {
        val req = call.receive<AuthRequest>()
        val row = transaction {
            Accounts.select { Accounts.email eq req.email }.singleOrNull()
        } ?: return@post call.respond(HttpStatusCode.Unauthorized, "Invalid credentials")

        if (!BCrypt.checkpw(req.password, row[Accounts.passwordHash])) {
            return@post call.respond(HttpStatusCode.Unauthorized, "Invalid credentials")
        }
        call.respond(AuthResponse(generateToken(call, row[Accounts.id]), req.email))
    }
}

private fun generateToken(call: ApplicationCall, accountId: String): String {
    val secret = call.application.environment.config.property("jwt.secret").getString()
    val issuer = call.application.environment.config.property("jwt.issuer").getString()
    val audience = call.application.environment.config.property("jwt.audience").getString()
    return JWT.create()
        .withIssuer(issuer)
        .withAudience(audience)
        .withClaim("accountId", accountId)
        .withExpiresAt(Date(System.currentTimeMillis() + 24 * 60 * 60 * 1000))
        .sign(Algorithm.HMAC256(secret))
}

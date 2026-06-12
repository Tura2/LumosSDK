package com.lumossdk.server.service

import com.lumossdk.server.db.ApiKeys
import com.lumossdk.server.db.Apps
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import java.security.MessageDigest
import java.time.LocalDateTime
import java.util.UUID

object KeyService {
    fun hash(key: String): String {
        val bytes = MessageDigest.getInstance("SHA-256").digest(key.toByteArray())
        return bytes.joinToString("") { "%02x".format(it) }
    }

    fun create(appId: String, name: String): Pair<String, String> {
        val secret = "lms_" + UUID.randomUUID().toString().replace("-", "")
        val keyId = UUID.randomUUID().toString()
        transaction {
            ApiKeys.insert {
                it[id] = keyId
                it[ApiKeys.appId] = appId
                it[ApiKeys.name] = name
                it[keyHash] = hash(secret)
                it[createdAt] = LocalDateTime.now()
            }
        }
        return Pair(keyId, secret)
    }

    fun verify(rawKey: String): String? = transaction {
        val h = hash(rawKey)
        ApiKeys.select { (ApiKeys.keyHash eq h) and (ApiKeys.revokedAt.isNull()) }
            .singleOrNull()
            ?.let { row ->
                ApiKeys.update({ ApiKeys.id eq row[ApiKeys.id] }) {
                    it[lastUsedAt] = LocalDateTime.now()
                }
                row[ApiKeys.appId]
            }
    }

    fun revoke(keyId: String): Boolean = transaction {
        ApiKeys.update({ ApiKeys.id eq keyId }) {
            it[revokedAt] = LocalDateTime.now()
        } > 0
    }

    fun listForApp(appId: String): List<Map<String, Any?>> = transaction {
        ApiKeys.select { ApiKeys.appId eq appId }.map { row ->
            mapOf(
                "id" to row[ApiKeys.id],
                "name" to row[ApiKeys.name],
                "createdAt" to row[ApiKeys.createdAt].toString(),
                "lastUsedAt" to row[ApiKeys.lastUsedAt]?.toString(),
                "revoked" to (row[ApiKeys.revokedAt] != null),
            )
        }
    }
}

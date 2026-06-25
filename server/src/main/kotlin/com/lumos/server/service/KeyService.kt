package com.lumos.server.service

import com.lumos.server.db.ApiKeys
import com.lumos.server.db.Apps
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import java.security.MessageDigest
import java.time.LocalDateTime
import java.util.UUID

@Serializable
data class KeyDto(
    val id: String, val name: String, val createdAt: String,
    val lastUsedAt: String? = null, val revoked: Boolean,
    val keySuffix: String? = null,
)

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
                it[keySuffix] = secret.takeLast(4)
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

    fun delete(keyId: String): Boolean = transaction {
        ApiKeys.deleteWhere { ApiKeys.id eq keyId } > 0
    }

    fun revoke(keyId: String): Boolean = transaction {
        ApiKeys.update({ ApiKeys.id eq keyId }) {
            it[revokedAt] = LocalDateTime.now()
        } > 0
    }

    fun listForApp(appId: String): List<KeyDto> = transaction {
        ApiKeys.select { ApiKeys.appId eq appId }.map { row ->
            KeyDto(
                id = row[ApiKeys.id],
                name = row[ApiKeys.name],
                createdAt = row[ApiKeys.createdAt].toString(),
                lastUsedAt = row[ApiKeys.lastUsedAt]?.toString(),
                revoked = row[ApiKeys.revokedAt] != null,
                keySuffix = row[ApiKeys.keySuffix],
            )
        }
    }
}

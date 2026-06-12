package com.lumossdk.server

import com.lumossdk.server.db.Accounts
import com.lumossdk.server.db.Apps
import com.lumossdk.server.db.DatabaseFactory
import com.lumossdk.server.service.KeyService
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.transactions.transaction
import org.junit.BeforeClass
import org.junit.Test
import java.time.LocalDateTime
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull

class KeyServiceTest {
    companion object {
        private lateinit var testAppId: String

        @BeforeClass @JvmStatic fun setup() {
            DatabaseFactory.init("jdbc:sqlite::memory:")
            val accountId = "test-account-1"
            testAppId = "test-app-1"
            transaction {
                Accounts.insert {
                    it[id] = accountId
                    it[email] = "test@example.com"
                    it[passwordHash] = "hash"
                    it[createdAt] = LocalDateTime.now()
                }
                Apps.insert {
                    it[id] = testAppId
                    it[Apps.accountId] = accountId
                    it[name] = "Test App"
                    it[packageName] = "com.test"
                    it[createdAt] = LocalDateTime.now()
                }
            }
        }
    }

    @Test fun `create and verify key`() {
        val (_, secret) = KeyService.create(testAppId, "test key")
        val resolvedAppId = KeyService.verify(secret)
        assertEquals(testAppId, resolvedAppId)
    }

    @Test fun `revoked key fails verification`() {
        val (keyId, secret) = KeyService.create(testAppId, "revoke me")
        KeyService.revoke(keyId)
        assertNull(KeyService.verify(secret))
    }

    @Test fun `wrong key fails verification`() {
        assertNull(KeyService.verify("lms_wrongkey"))
    }
}

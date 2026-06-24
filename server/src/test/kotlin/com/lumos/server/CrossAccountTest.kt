package com.lumos.server

import com.lumos.server.db.Accounts
import com.lumos.server.db.Apps
import com.lumos.server.db.DatabaseFactory
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.junit.BeforeClass
import org.junit.Test
import java.time.LocalDateTime
import java.util.UUID
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class CrossAccountTest {
    companion object {
        private var accountA = ""
        private var accountB = ""
        private var appOwnedByA = ""

        @BeforeClass @JvmStatic
        fun setup() {
            DatabaseFactory.init("jdbc:sqlite::memory:")
            accountA = UUID.randomUUID().toString()
            accountB = UUID.randomUUID().toString()
            appOwnedByA = UUID.randomUUID().toString()
            transaction {
                Accounts.insert {
                    it[id] = accountA; it[email] = "a@test.com"
                    it[passwordHash] = "h"; it[createdAt] = LocalDateTime.now()
                }
                Accounts.insert {
                    it[id] = accountB; it[email] = "b@test.com"
                    it[passwordHash] = "h"; it[createdAt] = LocalDateTime.now()
                }
                Apps.insert {
                    it[id] = appOwnedByA; it[accountId] = accountA
                    it[name] = "A's App"; it[packageName] = "com.a"
                    it[createdAt] = LocalDateTime.now()
                }
            }
        }
    }

    @Test
    fun `account A owns the app`() {
        val owns = transaction {
            Apps.select { (Apps.id eq appOwnedByA) and (Apps.accountId eq accountA) }.count() > 0
        }
        assertTrue(owns, "Account A should own app")
    }

    @Test
    fun `account B does not own account A's app`() {
        val owns = transaction {
            Apps.select { (Apps.id eq appOwnedByA) and (Apps.accountId eq accountB) }.count() > 0
        }
        assertFalse(owns, "Account B must not access account A's app")
    }
}

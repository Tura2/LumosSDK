package com.lumos.server

import com.lumos.server.db.Accounts
import com.lumos.server.db.Apps
import com.lumos.server.db.ApiKeys
import com.lumos.server.db.FeedbackTable
import com.lumos.server.db.Spans
import com.lumos.server.db.StatsHourly
import com.lumos.server.db.Traces
import com.lumos.server.db.DatabaseFactory
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.update
import org.jetbrains.exposed.sql.transactions.transaction
import org.junit.BeforeClass
import org.junit.Test
import java.time.LocalDateTime
import java.util.UUID
import kotlin.test.assertEquals

class AccountRoutesTest {
    companion object {
        private var testAccountId = ""

        @BeforeClass
        @JvmStatic
        fun setup() {
            DatabaseFactory.init("jdbc:sqlite::memory:")
            testAccountId = UUID.randomUUID().toString()
            transaction {
                Accounts.insert {
                    it[id] = testAccountId
                    it[email] = "account-test@lumos.dev"
                    it[passwordHash] = "hash"
                    it[createdAt] = LocalDateTime.now()
                }
            }
        }
    }

    @Test
    fun `PATCH account updates name`() {
        transaction {
            Accounts.update({ Accounts.id eq testAccountId }) {
                it[name] = "Acme Corp"
            }
        }
        val updated = transaction {
            Accounts.select { Accounts.id eq testAccountId }.single()
        }
        assertEquals("Acme Corp", updated[Accounts.name])
    }

    @Test
    fun `DELETE account cascade removes all data`() {
        val deleteAccountId = UUID.randomUUID().toString()
        val deleteAppId = UUID.randomUUID().toString()
        val deleteTraceId = UUID.randomUUID().toString()

        transaction {
            Accounts.insert {
                it[id] = deleteAccountId
                it[email] = "delete-me@lumos.dev"
                it[passwordHash] = "hash"
                it[createdAt] = LocalDateTime.now()
            }
            Apps.insert {
                it[id] = deleteAppId
                it[accountId] = deleteAccountId
                it[name] = "Test App"
                it[packageName] = "com.test"
                it[createdAt] = LocalDateTime.now()
            }
            Traces.insert {
                it[traceId] = deleteTraceId
                it[appId] = deleteAppId
                it[feature] = "chat"
                it[sessionId] = UUID.randomUUID().toString()
                it[input] = "hello"
                it[status] = "OK"
                it[startedAt] = LocalDateTime.now()
            }
        }

        // Cascade delete (mirrors AccountRoutes.kt DELETE /api/account logic)
        transaction {
            val appIds = Apps.select { Apps.accountId eq deleteAccountId }.map { it[Apps.id] }
            appIds.forEach { appId ->
                val traceIds = Traces.select { Traces.appId eq appId }.map { it[Traces.traceId] }
                traceIds.forEach { tid ->
                    Spans.deleteWhere { Spans.traceId eq tid }
                    FeedbackTable.deleteWhere { FeedbackTable.traceId eq tid }
                }
                Traces.deleteWhere { Traces.appId eq appId }
                StatsHourly.deleteWhere { StatsHourly.appId eq appId }
                ApiKeys.deleteWhere { ApiKeys.appId eq appId }
            }
            Apps.deleteWhere { Apps.accountId eq deleteAccountId }
            Accounts.deleteWhere { Accounts.id eq deleteAccountId }
        }

        val accountCount = transaction { Accounts.select { Accounts.id eq deleteAccountId }.count() }
        val appCount = transaction { Apps.select { Apps.id eq deleteAppId }.count() }
        val traceCount = transaction { Traces.select { Traces.traceId eq deleteTraceId }.count() }
        assertEquals(0, accountCount)
        assertEquals(0, appCount)
        assertEquals(0, traceCount)
    }
}

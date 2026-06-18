package com.lumos.server

import com.lumos.server.db.*
import com.lumos.server.service.IncomingEnvelope
import com.lumos.server.service.IngestionService
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.junit.BeforeClass
import org.junit.Test
import java.time.LocalDateTime
import kotlin.test.assertEquals

class IngestionDeviceTest {
    companion object {
        const val APP = "dev-app-1"
        @BeforeClass @JvmStatic fun setup() {
            DatabaseFactory.init("jdbc:sqlite::memory:")
            transaction {
                Accounts.insert {
                    it[id] = "acc-1"; it[email] = "dev@example.com"
                    it[passwordHash] = "h"; it[createdAt] = LocalDateTime.now()
                }
                Apps.insert {
                    it[id] = APP; it[accountId] = "acc-1"
                    it[name] = "Dev App"; it[packageName] = "com.dev"
                    it[createdAt] = LocalDateTime.now()
                }
            }
        }
    }

    @Test fun `ingest persists device fields on trace`() {
        val payload = """{"traceId":"t-dev-1","feature":"chat","input":"hi","status":"OK","model":"gpt-4o","tokensIn":10,"tokensOut":20,"latencyMs":100}"""
        val env = IncomingEnvelope(
            eventId = "e-dev-1", type = "TRACE", timestamp = "2026-06-18T10:00:00",
            sessionId = "s-1", appPackage = "com.dev", appVersion = "2.4.1",
            sdkVersion = "1.2.3", deviceModel = "Google Pixel 7", androidVersion = 34,
            payload = payload,
        )
        IngestionService.ingest(APP, listOf(env))

        val row = transaction { Traces.select { Traces.traceId eq "t-dev-1" }.single() }
        assertEquals("Google Pixel 7", row[Traces.deviceModel])
        assertEquals(34, row[Traces.androidVersion])
        assertEquals("1.2.3", row[Traces.sdkVersion])
        assertEquals("2.4.1", row[Traces.appVersion])
    }
}

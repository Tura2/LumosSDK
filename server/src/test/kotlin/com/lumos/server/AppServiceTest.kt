package com.lumos.server

import com.lumos.server.db.*
import com.lumos.server.service.AppService
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.junit.BeforeClass
import org.junit.Test
import java.time.LocalDateTime
import kotlin.test.assertEquals

class AppServiceTest {
    companion object {
        const val APP = "del-app-1"
        @BeforeClass @JvmStatic fun setup() {
            DatabaseFactory.init("jdbc:sqlite::memory:")
            transaction {
                Accounts.insert { it[id] = "acc-d"; it[email] = "d@e.com"; it[passwordHash] = "h"; it[createdAt] = LocalDateTime.now() }
                Apps.insert { it[id] = APP; it[accountId] = "acc-d"; it[name] = "D"; it[packageName] = "c.d"; it[createdAt] = LocalDateTime.now() }
                Traces.insert {
                    it[traceId] = "tr-d"; it[appId] = APP; it[feature] = "f"; it[sessionId] = "s"
                    it[input] = "i"; it[status] = "OK"; it[startedAt] = LocalDateTime.now()
                }
                Spans.insert { it[spanId] = "sp-d"; it[traceId] = "tr-d"; it[name] = "n"; it[durationMs] = 1; it[startedAt] = LocalDateTime.now() }
                FeedbackTable.insert { it[id] = "fb-d"; it[traceId] = "tr-d"; it[kind] = "THUMBS_UP"; it[createdAt] = LocalDateTime.now() }
                ApiKeys.insert { it[id] = "k-d"; it[appId] = APP; it[name] = "k"; it[keyHash] = "hh"; it[createdAt] = LocalDateTime.now() }
                StatsHourly.insert { it[appId] = APP; it[feature] = "f"; it[hourBucket] = LocalDateTime.now(); it[tracesCount] = 1 }
            }
        }
    }

    @Test fun `delete removes app and all related rows`() {
        AppService.delete(APP)
        transaction {
            assertEquals(0L, Apps.select { Apps.id eq APP }.count())
            assertEquals(0L, Traces.select { Traces.appId eq APP }.count())
            assertEquals(0L, Spans.select { Spans.traceId eq "tr-d" }.count())
            assertEquals(0L, FeedbackTable.select { FeedbackTable.traceId eq "tr-d" }.count())
            assertEquals(0L, ApiKeys.select { ApiKeys.appId eq APP }.count())
            assertEquals(0L, StatsHourly.select { StatsHourly.appId eq APP }.count())
        }
    }
}

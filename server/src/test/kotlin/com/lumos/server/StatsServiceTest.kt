package com.lumos.server

import com.lumos.server.db.StatsHourly
import com.lumos.server.db.DatabaseFactory
import com.lumos.server.service.StatsService
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.transactions.transaction
import org.junit.BeforeClass
import org.junit.Test
import java.time.LocalDateTime
import java.time.temporal.ChronoUnit
import kotlin.test.assertEquals

class StatsServiceTest {
    companion object {
        const val APP = "stats-app-1"
        val NOW: LocalDateTime = LocalDateTime.of(2026, 6, 18, 12, 0)

        @BeforeClass @JvmStatic fun setup() {
            DatabaseFactory.init("jdbc:sqlite::memory:")
            transaction {
                // current-week bucket: 1 day ago
                insertBucket(NOW.minusDays(1), traces = 10, ok = 9, errors = 1, latency = 1000)
                // prior-week bucket: 8 days ago
                insertBucket(NOW.minusDays(8), traces = 4, ok = 4, errors = 0, latency = 400)
                // hourly bucket: 2 hours ago
                insertBucket(NOW.minusHours(2).truncatedTo(ChronoUnit.HOURS), traces = 3)
            }
        }

        private fun insertBucket(
            bucket: LocalDateTime, traces: Int = 0, ok: Int = 0,
            errors: Int = 0, latency: Long = 0,
        ) {
            StatsHourly.insert {
                it[appId] = APP
                it[feature] = "f-${bucket.hashCode()}"
                it[hourBucket] = bucket.truncatedTo(ChronoUnit.HOURS)
                it[tracesCount] = traces
                it[okCount] = ok
                it[errorCount] = errors
                it[latencySum] = latency
            }
        }
    }

    @Test fun `totals sums all buckets`() {
        val t = StatsService.totals(APP)
        assertEquals(17L, t.traces) // 10 + 4 + 3
    }

    @Test fun `windowTotals isolates last 7 days`() {
        val current = StatsService.windowTotals(APP, NOW.minusDays(7), NOW)
        val previous = StatsService.windowTotals(APP, NOW.minusDays(14), NOW.minusDays(7))
        assertEquals(13L, current.traces)  // 10 (1d) + 3 (2h)
        assertEquals(4L, previous.traces)  // 4 (8d)
    }

    @Test fun `hourly returns 24 buckets with the right call count`() {
        val h = StatsService.hourly(APP, NOW)
        assertEquals(24, h.size)
        assertEquals(3L, h.sumOf { it.calls })
    }
}

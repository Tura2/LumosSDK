package com.lumos.server.service

import com.lumos.server.db.StatsHourly
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.LocalDateTime
import java.time.temporal.ChronoUnit

@Serializable
data class HourlyPoint(val hour: String, val calls: Long)

data class Totals(
    val traces: Long = 0, val ok: Long = 0, val errors: Long = 0,
    val tokensIn: Long = 0, val tokensOut: Long = 0, val latencySum: Long = 0,
    val thumbsUp: Long = 0, val thumbsDown: Long = 0,
)

object StatsService {
    fun totals(appId: String): Totals = transaction {
        StatsHourly.select { StatsHourly.appId eq appId }.fold(Totals()) { a, r -> accumulate(a, r) }
    }

    fun windowTotals(appId: String, fromInclusive: LocalDateTime, toExclusive: LocalDateTime): Totals = transaction {
        StatsHourly.select {
            (StatsHourly.appId eq appId) and
            (StatsHourly.hourBucket greaterEq fromInclusive) and
            (StatsHourly.hourBucket less toExclusive)
        }.fold(Totals()) { a, r -> accumulate(a, r) }
    }

    fun hourly(appId: String, now: LocalDateTime): List<HourlyPoint> {
        val currentHour = now.truncatedTo(ChronoUnit.HOURS)
        val from = currentHour.minusHours(23)
        val perBucket: Map<LocalDateTime, Long> = transaction {
            StatsHourly.select {
                (StatsHourly.appId eq appId) and (StatsHourly.hourBucket greaterEq from)
            }.groupingBy { it[StatsHourly.hourBucket] }
                .fold(0L) { acc, r -> acc + r[StatsHourly.tracesCount] }
        }
        return (0..23).map { i ->
            val bucket = from.plusHours(i.toLong())
            HourlyPoint(hour = "%02dh".format(bucket.hour), calls = perBucket[bucket] ?: 0L)
        }
    }

    private fun accumulate(a: Totals, r: org.jetbrains.exposed.sql.ResultRow) = Totals(
        traces = a.traces + r[StatsHourly.tracesCount],
        ok = a.ok + r[StatsHourly.okCount],
        errors = a.errors + r[StatsHourly.errorCount],
        tokensIn = a.tokensIn + r[StatsHourly.tokensInSum],
        tokensOut = a.tokensOut + r[StatsHourly.tokensOutSum],
        latencySum = a.latencySum + r[StatsHourly.latencySum],
        thumbsUp = a.thumbsUp + r[StatsHourly.thumbsUp],
        thumbsDown = a.thumbsDown + r[StatsHourly.thumbsDown],
    )
}

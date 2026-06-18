package com.lumos.server.service

import com.lumos.server.db.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.inList
import org.jetbrains.exposed.sql.transactions.transaction

object AppService {
    fun delete(appId: String) = transaction {
        val traceIds = Traces.select { Traces.appId eq appId }.map { it[Traces.traceId] }
        if (traceIds.isNotEmpty()) {
            FeedbackTable.deleteWhere { FeedbackTable.traceId inList traceIds }
            Spans.deleteWhere { Spans.traceId inList traceIds }
        }
        Traces.deleteWhere { Traces.appId eq appId }
        ApiKeys.deleteWhere { ApiKeys.appId eq appId }
        StatsHourly.deleteWhere { StatsHourly.appId eq appId }
        Apps.deleteWhere { Apps.id eq appId }
        Unit
    }
}

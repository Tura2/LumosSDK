package com.lumos.server.db

import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.transactions.transaction

object DatabaseFactory {
    fun init(url: String = "jdbc:sqlite:lumos.db") {
        Database.connect(url, driver = "org.sqlite.JDBC")
        transaction {
            SchemaUtils.createMissingTablesAndColumns(
                Accounts, Apps, ApiKeys, Traces, Spans,
                FeedbackTable, IngestedEvents, StatsHourly
            )
        }
    }
}

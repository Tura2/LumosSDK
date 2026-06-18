package com.lumos.server.db

import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.transactions.transaction
import java.io.PrintWriter
import java.sql.Connection
import java.sql.DriverManager
import java.util.logging.Logger
import javax.sql.DataSource

/**
 * Single-connection DataSource for SQLite in-memory testing.
 * Each DriverManager.getConnection("jdbc:sqlite::memory:") creates a brand-new
 * empty database; wrapping one persistent Connection ensures every Exposed
 * transaction sees the same in-memory DB.
 */
private class SingleConnectionDataSource(url: String) : DataSource {
    private val conn: Connection = DriverManager.getConnection(url)
    // Prevent Exposed from closing the connection between transactions
    private val wrapper = object : Connection by conn {
        override fun close() { /* no-op: keep alive */ }
    }
    override fun getConnection(): Connection = wrapper
    override fun getConnection(username: String?, password: String?): Connection = wrapper
    override fun getLogWriter(): PrintWriter? = null
    override fun setLogWriter(out: PrintWriter?) {}
    override fun getLoginTimeout(): Int = 0
    override fun setLoginTimeout(seconds: Int) {}
    override fun getParentLogger(): Logger = Logger.getLogger(Logger.GLOBAL_LOGGER_NAME)
    override fun isWrapperFor(iface: Class<*>?): Boolean = false
    override fun <T : Any?> unwrap(iface: Class<T>?): T = throw UnsupportedOperationException()
}

object DatabaseFactory {
    fun init(url: String = "jdbc:sqlite:lumos.db") {
        if (url.contains(":memory:")) {
            Database.connect(SingleConnectionDataSource(url))
        } else {
            Database.connect(url, driver = "org.sqlite.JDBC")
        }
        transaction {
            SchemaUtils.createMissingTablesAndColumns(
                Accounts, Apps, ApiKeys, Traces, Spans,
                FeedbackTable, IngestedEvents, StatsHourly
            )
        }
    }
}

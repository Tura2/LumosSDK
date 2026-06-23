package com.lumos.server

import com.lumos.server.db.Accounts
import com.lumos.server.db.Apps
import com.lumos.server.db.Traces
import com.lumos.server.db.DatabaseFactory
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.junit.BeforeClass
import org.junit.Test
import java.time.LocalDateTime
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class SessionRoutesTest {
    companion object {
        private var testAppId = ""
        private var testSessionId = ""
        private var testOtherSessionId = ""

        @BeforeClass
        @JvmStatic
        fun setup() {
            DatabaseFactory.init("jdbc:sqlite::memory:")
            val accountId = UUID.randomUUID().toString()
            val localAppId = UUID.randomUUID().toString()
            val localSessionId = UUID.randomUUID().toString()
            val localOtherSessionId = UUID.randomUUID().toString()
            testAppId = localAppId
            testSessionId = localSessionId
            testOtherSessionId = localOtherSessionId
            transaction {
                Accounts.insert {
                    it[id] = accountId
                    it[email] = "session-test@lumos.dev"
                    it[passwordHash] = "hash"
                    it[createdAt] = LocalDateTime.now()
                }
                Apps.insert {
                    it[id] = localAppId
                    it[Apps.accountId] = accountId
                    it[name] = "Test"
                    it[packageName] = "com.test"
                    it[createdAt] = LocalDateTime.now()
                }
                // 3 traces for localSessionId: 2 OK, 1 ERROR
                repeat(3) { i ->
                    Traces.insert {
                        it[traceId] = UUID.randomUUID().toString()
                        it[appId] = localAppId
                        it[feature] = "chat"
                        it[sessionId] = localSessionId
                        it[input] = "msg $i"
                        it[status] = if (i == 2) "ERROR" else "OK"
                        it[startedAt] = LocalDateTime.now().plusSeconds(i.toLong())
                    }
                }
                // 1 trace for otherSessionId
                Traces.insert {
                    it[traceId] = UUID.randomUUID().toString()
                    it[appId] = localAppId
                    it[feature] = "search"
                    it[sessionId] = localOtherSessionId
                    it[input] = "query"
                    it[status] = "OK"
                    it[startedAt] = LocalDateTime.now().plusSeconds(10)
                }
            }
        }
    }

    @Test
    fun `sessions query returns aggregated session list`() {
        data class SessionRow(
            val sessionId: String,
            val traceCount: Int,
            val errorCount: Int,
            val features: String,
        )

        val localAppId = testAppId
        val sessions = transaction {
            exec(
                """
                SELECT session_id,
                       COUNT(*) AS trace_count,
                       MIN(started_at) AS first_seen,
                       MAX(started_at) AS last_seen,
                       SUM(CASE WHEN status = 'ERROR' THEN 1 ELSE 0 END) AS error_count,
                       GROUP_CONCAT(DISTINCT feature) AS features
                FROM traces
                WHERE app_id = '$localAppId'
                GROUP BY session_id
                ORDER BY MAX(started_at) DESC
                """.trimIndent()
            ) { rs ->
                buildList {
                    while (rs.next()) {
                        add(
                            SessionRow(
                                sessionId = rs.getString("session_id"),
                                traceCount = rs.getInt("trace_count"),
                                errorCount = rs.getInt("error_count"),
                                features = rs.getString("features") ?: "",
                            )
                        )
                    }
                }
            } ?: emptyList()
        }

        assertEquals(2, sessions.size)
        val primary = sessions.find { it.sessionId == testSessionId }!!
        assertEquals(3, primary.traceCount)
        assertEquals(1, primary.errorCount)
        assertTrue(primary.features.contains("chat"))
    }

    @Test
    fun `session traces query returns traces filtered by sessionId`() {
        val targetAppId = testAppId
        val targetSessionId = testSessionId
        val traces = transaction {
            Traces.select { (Traces.appId eq targetAppId) and (Traces.sessionId eq targetSessionId) }
                .orderBy(Traces.startedAt)
                .toList()
        }
        assertEquals(3, traces.size)
        assertTrue(traces.all { it[Traces.sessionId] == targetSessionId })
        val errors = traces.count { it[Traces.status] == "ERROR" }
        assertEquals(1, errors)
    }
}

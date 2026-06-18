package com.lumos.server.db

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.datetime

object Accounts : Table("accounts") {
    val id = varchar("id", 36)
    val email = varchar("email", 255).uniqueIndex()
    val passwordHash = varchar("password_hash", 255)
    val createdAt = datetime("created_at")
    override val primaryKey = PrimaryKey(id)
}

object Apps : Table("apps") {
    val id = varchar("id", 36)
    val accountId = varchar("account_id", 36).references(Accounts.id)
    val name = varchar("name", 100)
    val packageName = varchar("package_name", 255)
    val createdAt = datetime("created_at")
    override val primaryKey = PrimaryKey(id)
}

object ApiKeys : Table("api_keys") {
    val id = varchar("id", 36)
    val appId = varchar("app_id", 36).references(Apps.id)
    val name = varchar("name", 100)
    val keyHash = varchar("key_hash", 64).uniqueIndex()
    val createdAt = datetime("created_at")
    val lastUsedAt = datetime("last_used_at").nullable()
    val revokedAt = datetime("revoked_at").nullable()
    override val primaryKey = PrimaryKey(id)
}

object Traces : Table("traces") {
    val traceId = varchar("trace_id", 36)
    val appId = varchar("app_id", 36).references(Apps.id)
    val feature = varchar("feature", 100)
    val sessionId = varchar("session_id", 36)
    val input = text("input")
    val output = text("output").nullable()
    val model = varchar("model", 100).nullable()
    val tokensIn = integer("tokens_in").nullable()
    val tokensOut = integer("tokens_out").nullable()
    val latencyMs = long("latency_ms").nullable()
    val status = varchar("status", 20)
    val startedAt = datetime("started_at")
    val deviceModel = varchar("device_model", 200).nullable()
    val androidVersion = integer("android_version").nullable()
    val sdkVersion = varchar("sdk_version", 50).nullable()
    val appVersion = varchar("app_version", 50).nullable()
    override val primaryKey = PrimaryKey(traceId)
}

object Spans : Table("spans") {
    val spanId = varchar("span_id", 36)
    val traceId = varchar("trace_id", 36).references(Traces.traceId)
    val name = varchar("name", 100)
    val durationMs = long("duration_ms")
    val startedAt = datetime("started_at")
    override val primaryKey = PrimaryKey(spanId)
}

object FeedbackTable : Table("feedback") {
    val id = varchar("id", 36)
    val traceId = varchar("trace_id", 36).references(Traces.traceId)
    val kind = varchar("kind", 20)
    val createdAt = datetime("created_at")
    override val primaryKey = PrimaryKey(id)
}

object IngestedEvents : Table("ingested_events") {
    val eventId = varchar("event_id", 36)
    override val primaryKey = PrimaryKey(eventId)
}

object StatsHourly : Table("stats_hourly") {
    val appId = varchar("app_id", 36)
    val feature = varchar("feature", 100)
    val hourBucket = datetime("hour_bucket")
    val tracesCount = integer("traces_count").default(0)
    val okCount = integer("ok_count").default(0)
    val errorCount = integer("error_count").default(0)
    val tokensInSum = long("tokens_in_sum").default(0)
    val tokensOutSum = long("tokens_out_sum").default(0)
    val latencySum = long("latency_sum_ms").default(0)
    val thumbsUp = integer("thumbs_up").default(0)
    val thumbsDown = integer("thumbs_down").default(0)
    override val primaryKey = PrimaryKey(appId, feature, hourBucket)
}

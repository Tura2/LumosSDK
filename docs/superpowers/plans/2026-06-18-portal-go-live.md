# Portal Go-Live Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Lumos portal production-ready: real auth flow, multi-app management (create/rename/delete/select), real Android device data end-to-end, real dashboard data (hourly + week-over-week), and removal of all fabricated/mock data.

**Architecture:** Ktor + Exposed + SQLite backend gains device columns on `traces`, a `StatsService` for aggregation (all-time, windowed for WoW, hourly), an `AppService` for cascade delete, and `PATCH`/`DELETE` app routes. The React + Vite portal gains an `AuthContext`/`RequireAuth` guard, an `AppContext` for the selected app, an Apps management page, a NavBar app switcher, and real data wiring. The mock-fallback layer is deleted.

**Tech Stack:** Kotlin/Ktor, Exposed ORM, SQLite, JUnit (in-memory SQLite tests); React 19, TypeScript, Vite, axios, react-router-dom 7, recharts, lucide-react.

## Global Constraints

- Backend DB auto-migrates via `SchemaUtils.createMissingTablesAndColumns` in `DatabaseFactory.init()` — all new columns MUST be `.nullable()` (SQLite can't add NOT NULL columns to existing tables without defaults).
- All new authenticated routes MUST verify app ownership: the app's `accountId` must equal the JWT `accountId` claim; respond `403 Forbidden` otherwise.
- Backend tests use `DatabaseFactory.init("jdbc:sqlite::memory:")` in a `@BeforeClass` and exercise services/DB directly (matching `KeyServiceTest`), not authenticated HTTP.
- Frontend has no test runner; the gate for every frontend task is `npx tsc -b` exiting 0, plus the manual check stated in the task.
- Auth token is stored in `localStorage` under key `lumos_token`. Selected app id is stored under `lumos_current_app`.
- API base resolves from `import.meta.env.VITE_API_URL ?? 'http://localhost:8080'`.
- Run backend commands from `server/`, frontend commands from `portal/`.
- **Gradle:** the repo has no Gradle wrapper. The executor must have Gradle installed (use `gradle` in place of `./gradlew` in every backend command if no wrapper is present), or generate one first with `gradle wrapper`.
- **kotlinx serialization rule (critical for go-live):** this server uses `ktor-serialization-kotlinx-json`. A `Map<String, Any?>` with mixed value types has **no serializer for `Any`** and throws a 500 at response time. Every JSON response object/array MUST be a `@Serializable` data class (or homogeneous map like `Map<String,String>`/`Map<String,Long>`). Do NOT respond with `Map<String, Any?>`. This fixes a latent bug: the existing key-list, trace-list, and trace-detail endpoints currently respond `Map<String, Any?>` and would 500 against a real client (it's only masked today by the portal's mock fallback).
- Commit after every task. Do not skip the "run test / typecheck" steps.

---

## File Structure

**Backend (create):**
- `server/src/main/kotlin/com/lumos/server/service/StatsService.kt` — all-time totals, windowed totals (WoW), hourly buckets.
- `server/src/main/kotlin/com/lumos/server/service/AppService.kt` — cascade delete of an app and its data.
- `server/src/test/kotlin/com/lumos/server/IngestionDeviceTest.kt`
- `server/src/test/kotlin/com/lumos/server/StatsServiceTest.kt`
- `server/src/test/kotlin/com/lumos/server/AppServiceTest.kt`

**Backend (modify):**
- `db/Tables.kt` — device columns on `Traces`.
- `service/IngestionService.kt` — persist device fields.
- `routes/TraceRoutes.kt` — return `model` + `device`.
- `routes/StatsRoutes.kt` — use `StatsService`; add `/stats/hourly`; add WoW `trend`.
- `routes/AppRoutes.kt` — `PATCH` + `DELETE`.

**Frontend (create):**
- `portal/src/auth/AuthContext.tsx` — token state + login/logout helpers.
- `portal/src/auth/RequireAuth.tsx` — guard + AppLayout host.
- `portal/src/app/AppContext.tsx` — apps list + selected app.
- `portal/src/pages/Apps.tsx` — manage apps.
- `portal/src/pages/Onboarding.tsx` — create-first-app screen.
- `portal/src/components/StatusBadge.tsx`
- `portal/src/components/PageHeader.tsx`
- `portal/src/lib/format.ts` — formatting + pricing + OS-label helpers.
- `portal/public/favicon.svg` and `portal/public/lumos-mark.svg` (lightweight logo).

**Frontend (modify):**
- `App.tsx`, `api/client.ts`, `components/NavBar.tsx`, `components/Skeleton.tsx`, `theme.ts`,
  `pages/Dashboard.tsx`, `pages/TraceExplorer.tsx`, `pages/TraceDetail.tsx`, `pages/ApiKeys.tsx`, `pages/Login.tsx`, `index.html`.

**Frontend (delete):**
- `portal/src/api/mockData.ts`.

---

# Phase 1 — Backend

### Task 1: Persist device data on traces

**Files:**
- Modify: `server/src/main/kotlin/com/lumos/server/db/Tables.kt` (object `Traces`)
- Modify: `server/src/main/kotlin/com/lumos/server/service/IngestionService.kt`
- Test: `server/src/test/kotlin/com/lumos/server/IngestionDeviceTest.kt`

**Interfaces:**
- Consumes: `IngestionService.ingest(appId: String, events: List<IncomingEnvelope>)` (existing).
- Produces: `Traces.deviceModel`, `Traces.androidVersion`, `Traces.sdkVersion`, `Traces.appVersion` columns (all nullable).

- [ ] **Step 1: Add device columns to the `Traces` table**

In `db/Tables.kt`, inside `object Traces`, add after `val startedAt = datetime("started_at")`:

```kotlin
    val deviceModel = varchar("device_model", 200).nullable()
    val androidVersion = integer("android_version").nullable()
    val sdkVersion = varchar("sdk_version", 50).nullable()
    val appVersion = varchar("app_version", 50).nullable()
```

- [ ] **Step 2: Write the failing test**

Create `server/src/test/kotlin/com/lumos/server/IngestionDeviceTest.kt`:

```kotlin
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `./gradlew test --tests "com.lumos.server.IngestionDeviceTest"`
Expected: FAIL — device columns are not written yet (assertion fails / null).

- [ ] **Step 4: Persist device fields in `IngestionService`**

In `service/IngestionService.kt`, inside the `"TRACE" ->` branch's `Traces.insert { ... }`, add to the insert body (after `it[startedAt] = now`):

```kotlin
                        it[Traces.deviceModel] = env.deviceModel
                        it[Traces.androidVersion] = env.androidVersion
                        it[Traces.sdkVersion] = env.sdkVersion
                        it[Traces.appVersion] = env.appVersion
```

- [ ] **Step 5: Run test to verify it passes**

Run: `./gradlew test --tests "com.lumos.server.IngestionDeviceTest"`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add server/src/main/kotlin/com/lumos/server/db/Tables.kt \
        server/src/main/kotlin/com/lumos/server/service/IngestionService.kt \
        server/src/test/kotlin/com/lumos/server/IngestionDeviceTest.kt
git commit -m "feat(server): persist device fields on traces"
```

---

### Task 2: Serializable trace + key responses (model + device, kotlinx-safe)

This task replaces the `Map<String, Any?>` responses on the trace and key endpoints with `@Serializable` DTOs (required by the kotlinx rule in Global Constraints) and adds `model` + `device`.

**Files:**
- Modify: `server/src/main/kotlin/com/lumos/server/routes/TraceRoutes.kt`
- Modify: `server/src/main/kotlin/com/lumos/server/service/KeyService.kt`

**Interfaces:**
- Produces:
  - `DeviceDto(deviceModel: String, androidVersion: Int?, sdkVersion: String?, appVersion: String?)`
  - List item DTO `TraceListItem(traceId, feature, status, model?, latencyMs?, tokensIn?, tokensOut?, startedAt, device: DeviceDto?)`
  - Detail DTO `TraceDetailDto(...)` with `spans: List<SpanDto>`, `feedback: List<String>`, `device: DeviceDto?`
  - `KeyService.listForApp(appId): List<KeyDto>` where `KeyDto(id, name, createdAt, lastUsedAt?, revoked)`.

- [ ] **Step 1: Rewrite `routes/TraceRoutes.kt` with DTOs**

Replace the entire file with:

```kotlin
package com.lumos.server.routes

import com.lumos.server.db.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction

@Serializable
data class DeviceDto(
    val deviceModel: String,
    val androidVersion: Int? = null,
    val sdkVersion: String? = null,
    val appVersion: String? = null,
)

@Serializable
data class TraceListItem(
    val traceId: String, val feature: String, val status: String,
    val model: String? = null, val latencyMs: Long? = null,
    val tokensIn: Int? = null, val tokensOut: Int? = null,
    val startedAt: String, val device: DeviceDto? = null,
)

@Serializable data class SpanDto(val name: String, val durationMs: Long)

@Serializable
data class TraceDetailDto(
    val traceId: String, val feature: String, val status: String,
    val input: String, val output: String? = null, val model: String? = null,
    val tokensIn: Int? = null, val tokensOut: Int? = null, val latencyMs: Long? = null,
    val startedAt: String, val spans: List<SpanDto>, val feedback: List<String>,
    val device: DeviceDto? = null,
)

private fun deviceOf(model: String?, android: Int?, sdk: String?, appVer: String?): DeviceDto? =
    if (model == null) null else DeviceDto(model, android, sdk, appVer)

fun Routing.traceRoutes() {
    authenticate("jwt") {
        get("/api/apps/{appId}/traces") {
            val accountId = call.principal<JWTPrincipal>()!!.getClaim("accountId", String::class)!!
            val appId = call.parameters["appId"]!!
            val owns = transaction { Apps.select { (Apps.id eq appId) and (Apps.accountId eq accountId) }.count() > 0 }
            if (!owns) return@get call.respond(HttpStatusCode.Forbidden)
            val traces = transaction {
                Traces.select { Traces.appId eq appId }
                    .orderBy(Traces.startedAt, SortOrder.DESC)
                    .limit(50).map {
                        TraceListItem(
                            traceId = it[Traces.traceId],
                            feature = it[Traces.feature],
                            status = it[Traces.status],
                            model = it[Traces.model],
                            latencyMs = it[Traces.latencyMs],
                            tokensIn = it[Traces.tokensIn],
                            tokensOut = it[Traces.tokensOut],
                            startedAt = it[Traces.startedAt].toString(),
                            device = deviceOf(
                                it[Traces.deviceModel], it[Traces.androidVersion],
                                it[Traces.sdkVersion], it[Traces.appVersion],
                            ),
                        )
                    }
            }
            call.respond(traces)
        }

        get("/api/traces/{traceId}") {
            val accountId = call.principal<JWTPrincipal>()!!.getClaim("accountId", String::class)!!
            val traceId = call.parameters["traceId"]!!
            val trace = transaction {
                (Traces innerJoin Apps)
                    .select { (Traces.traceId eq traceId) and (Apps.accountId eq accountId) }
                    .singleOrNull()?.let { row ->
                        val spans = Spans.select { Spans.traceId eq traceId }
                            .map { SpanDto(it[Spans.name], it[Spans.durationMs]) }
                        val feedback = FeedbackTable.select { FeedbackTable.traceId eq traceId }
                            .map { it[FeedbackTable.kind] }
                        TraceDetailDto(
                            traceId = row[Traces.traceId],
                            feature = row[Traces.feature],
                            status = row[Traces.status],
                            input = row[Traces.input],
                            output = row[Traces.output],
                            model = row[Traces.model],
                            tokensIn = row[Traces.tokensIn],
                            tokensOut = row[Traces.tokensOut],
                            latencyMs = row[Traces.latencyMs],
                            startedAt = row[Traces.startedAt].toString(),
                            spans = spans,
                            feedback = feedback,
                            device = deviceOf(
                                row[Traces.deviceModel], row[Traces.androidVersion],
                                row[Traces.sdkVersion], row[Traces.appVersion],
                            ),
                        )
                    }
            } ?: return@get call.respond(HttpStatusCode.NotFound)
            call.respond(trace)
        }
    }
}
```

- [ ] **Step 2: Make `KeyService.listForApp` return a serializable DTO**

In `service/KeyService.kt`, add the import `import kotlinx.serialization.Serializable` and a DTO at the top of the file (after the package/imports):

```kotlin
@Serializable
data class KeyDto(
    val id: String, val name: String, val createdAt: String,
    val lastUsedAt: String? = null, val revoked: Boolean,
)
```

Replace the `listForApp` function body to return `List<KeyDto>`:

```kotlin
    fun listForApp(appId: String): List<KeyDto> = transaction {
        ApiKeys.select { ApiKeys.appId eq appId }.map { row ->
            KeyDto(
                id = row[ApiKeys.id],
                name = row[ApiKeys.name],
                createdAt = row[ApiKeys.createdAt].toString(),
                lastUsedAt = row[ApiKeys.lastUsedAt]?.toString(),
                revoked = row[ApiKeys.revokedAt] != null,
            )
        }
    }
```

(The `KeyRoutes` `GET` handler already does `call.respond(KeyService.listForApp(appId))` — now it responds a serializable list, no route change needed.)

- [ ] **Step 3: Build (compile)**

Run: `gradle build -x test` (or `./gradlew build -x test` if a wrapper exists)
Expected: BUILD SUCCESSFUL.

- [ ] **Step 4: Commit**

```bash
git add server/src/main/kotlin/com/lumos/server/routes/TraceRoutes.kt \
        server/src/main/kotlin/com/lumos/server/service/KeyService.kt
git commit -m "feat(server): serializable trace + key DTOs with model and device"
```

---

### Task 3: StatsService (all-time, windowed, hourly)

**Files:**
- Create: `server/src/main/kotlin/com/lumos/server/service/StatsService.kt`
- Test: `server/src/test/kotlin/com/lumos/server/StatsServiceTest.kt`

**Interfaces:**
- Produces:
  - `data class Totals(traces, ok, errors, tokensIn, tokensOut, latencySum, thumbsUp, thumbsDown : Long)`
  - `StatsService.totals(appId: String): Totals` — sum of all `stats_hourly` rows for the app.
  - `StatsService.windowTotals(appId: String, fromInclusive: LocalDateTime, toExclusive: LocalDateTime): Totals`
  - `@Serializable data class HourlyPoint(hour: String, calls: Long)`
  - `StatsService.hourly(appId: String, now: LocalDateTime): List<HourlyPoint>` — 24 ordered entries.

- [ ] **Step 1: Write the failing test**

Create `server/src/test/kotlin/com/lumos/server/StatsServiceTest.kt`:

```kotlin
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./gradlew test --tests "com.lumos.server.StatsServiceTest"`
Expected: FAIL — `StatsService` does not exist (compile error).

- [ ] **Step 3: Implement `StatsService`**

Create `server/src/main/kotlin/com/lumos/server/service/StatsService.kt`:

```kotlin
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
```

> Note: `tracesCount`/`okCount`/`errorCount`/`thumbsUp`/`thumbsDown` are `Int` columns; `+` promotes to `Long` because the `Totals` fields are `Long`. `tokensInSum`/`tokensOutSum`/`latencySum` are already `Long`.

- [ ] **Step 4: Run test to verify it passes**

Run: `./gradlew test --tests "com.lumos.server.StatsServiceTest"`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add server/src/main/kotlin/com/lumos/server/service/StatsService.kt \
        server/src/test/kotlin/com/lumos/server/StatsServiceTest.kt
git commit -m "feat(server): add StatsService for totals, windows, hourly"
```

---

### Task 4: Wire stats routes (WoW trend + hourly)

**Files:**
- Modify: `server/src/main/kotlin/com/lumos/server/routes/StatsRoutes.kt`

**Interfaces:**
- Consumes: `StatsService.totals`, `StatsService.windowTotals`, `StatsService.hourly`, `Totals`, `HourlyPoint`.
- Produces (all `@Serializable`):
  - `WindowDto(traces, ok, errors, latencySum, tokensIn, tokensOut: Long)`
  - `TrendDto(current: WindowDto, previous: WindowDto)`
  - `StatsDto(traces, ok, errors, tokensIn, tokensOut, latencySum, thumbsUp, thumbsDown: Long, trend: TrendDto)`
  - `GET /api/apps/{appId}/stats` → `StatsDto`.
  - `GET /api/apps/{appId}/stats/hourly` → `List<HourlyPoint>`.

- [ ] **Step 1: Rewrite `routes/StatsRoutes.kt` with DTOs**

```kotlin
package com.lumos.server.routes

import com.lumos.server.db.Apps
import com.lumos.server.service.StatsService
import com.lumos.server.service.Totals
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.LocalDateTime

@Serializable
data class WindowDto(
    val traces: Long, val ok: Long, val errors: Long,
    val latencySum: Long, val tokensIn: Long, val tokensOut: Long,
)

@Serializable data class TrendDto(val current: WindowDto, val previous: WindowDto)

@Serializable
data class StatsDto(
    val traces: Long, val ok: Long, val errors: Long,
    val tokensIn: Long, val tokensOut: Long, val latencySum: Long,
    val thumbsUp: Long, val thumbsDown: Long, val trend: TrendDto,
)

private fun windowDto(t: Totals) = WindowDto(t.traces, t.ok, t.errors, t.latencySum, t.tokensIn, t.tokensOut)

fun Routing.statsRoutes() {
    authenticate("jwt") {
        get("/api/apps/{appId}/stats") {
            val accountId = call.principal<JWTPrincipal>()!!.getClaim("accountId", String::class)!!
            val appId = call.parameters["appId"]!!
            if (!ownsApp(accountId, appId)) return@get call.respond(HttpStatusCode.Forbidden)

            val now = LocalDateTime.now()
            val all = StatsService.totals(appId)
            val current = StatsService.windowTotals(appId, now.minusDays(7), now)
            val previous = StatsService.windowTotals(appId, now.minusDays(14), now.minusDays(7))
            call.respond(
                StatsDto(
                    traces = all.traces, ok = all.ok, errors = all.errors,
                    tokensIn = all.tokensIn, tokensOut = all.tokensOut, latencySum = all.latencySum,
                    thumbsUp = all.thumbsUp, thumbsDown = all.thumbsDown,
                    trend = TrendDto(current = windowDto(current), previous = windowDto(previous)),
                )
            )
        }

        get("/api/apps/{appId}/stats/hourly") {
            val accountId = call.principal<JWTPrincipal>()!!.getClaim("accountId", String::class)!!
            val appId = call.parameters["appId"]!!
            if (!ownsApp(accountId, appId)) return@get call.respond(HttpStatusCode.Forbidden)
            call.respond(StatsService.hourly(appId, LocalDateTime.now()))
        }
    }
}

private fun ownsApp(accountId: String, appId: String): Boolean = transaction {
    Apps.select { (Apps.id eq appId) and (Apps.accountId eq accountId) }.count() > 0
}
```

- [ ] **Step 2: Verify it compiles**

Run: `gradle build -x test` (or `./gradlew build -x test`)
Expected: BUILD SUCCESSFUL.

- [ ] **Step 3: Commit**

```bash
git add server/src/main/kotlin/com/lumos/server/routes/StatsRoutes.kt
git commit -m "feat(server): stats route returns WoW trend + add hourly endpoint"
```

---

### Task 5: AppService cascade delete

**Files:**
- Create: `server/src/main/kotlin/com/lumos/server/service/AppService.kt`
- Test: `server/src/test/kotlin/com/lumos/server/AppServiceTest.kt`

**Interfaces:**
- Produces: `AppService.delete(appId: String)` — deletes, in one transaction, the app's feedback, spans, traces, api keys, stats rows, then the app row.

- [ ] **Step 1: Write the failing test**

Create `server/src/test/kotlin/com/lumos/server/AppServiceTest.kt`:

```kotlin
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./gradlew test --tests "com.lumos.server.AppServiceTest"`
Expected: FAIL — `AppService` does not exist (compile error).

- [ ] **Step 3: Implement `AppService`**

Create `server/src/main/kotlin/com/lumos/server/service/AppService.kt`:

```kotlin
package com.lumos.server.service

import com.lumos.server.db.*
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction

object AppService {
    fun delete(appId: String) = transaction {
        val traceIds = Traces.select { Traces.appId eq appId }.map { it[Traces.traceId] }
        FeedbackTable.deleteWhere { FeedbackTable.traceId inList traceIds }
        Spans.deleteWhere { Spans.traceId inList traceIds }
        Traces.deleteWhere { Traces.appId eq appId }
        ApiKeys.deleteWhere { ApiKeys.appId eq appId }
        StatsHourly.deleteWhere { StatsHourly.appId eq appId }
        Apps.deleteWhere { Apps.id eq appId }
        Unit
    }
}
```

> `inList` with an empty list produces a valid `WHERE ... IN ()` no-op delete in Exposed — safe when an app has no traces.

- [ ] **Step 4: Run test to verify it passes**

Run: `./gradlew test --tests "com.lumos.server.AppServiceTest"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/main/kotlin/com/lumos/server/service/AppService.kt \
        server/src/test/kotlin/com/lumos/server/AppServiceTest.kt
git commit -m "feat(server): add AppService cascade delete"
```

---

### Task 6: App PATCH + DELETE routes

**Files:**
- Modify: `server/src/main/kotlin/com/lumos/server/routes/AppRoutes.kt`

**Interfaces:**
- Consumes: `AppService.delete(appId)`.
- Produces:
  - `PATCH /api/apps/{appId}` body `{ "name": String?, "packageName": String? }` → `200 {id,name,packageName}`; `403` if not owner; `404` if missing.
  - `DELETE /api/apps/{appId}` → `204`; `403` if not owner.

- [ ] **Step 1: Add request type and routes**

In `routes/AppRoutes.kt`, add the request DTO next to `CreateAppRequest`:

```kotlin
@Serializable data class UpdateAppRequest(val name: String? = null, val packageName: String? = null)
```

Add these imports to the file's import block:

```kotlin
import com.lumos.server.service.AppService
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.update
```

Inside `authenticate("jwt") { ... }` in `appRoutes()`, after the existing `post("/api/apps")` block, add:

```kotlin
        patch("/api/apps/{appId}") {
            val accountId = call.principal<JWTPrincipal>()!!.getClaim("accountId", String::class)!!
            val appId = call.parameters["appId"]!!
            val owns = transaction { Apps.select { (Apps.id eq appId) and (Apps.accountId eq accountId) }.count() > 0 }
            if (!owns) return@patch call.respond(HttpStatusCode.Forbidden)
            val req = call.receive<UpdateAppRequest>()
            val updated = transaction {
                Apps.update({ Apps.id eq appId }) {
                    if (req.name != null) it[name] = req.name
                    if (req.packageName != null) it[packageName] = req.packageName
                }
                Apps.select { Apps.id eq appId }.singleOrNull()?.let { row ->
                    mapOf("id" to row[Apps.id], "name" to row[Apps.name], "packageName" to row[Apps.packageName])
                }
            } ?: return@patch call.respond(HttpStatusCode.NotFound)
            call.respond(updated)
        }

        delete("/api/apps/{appId}") {
            val accountId = call.principal<JWTPrincipal>()!!.getClaim("accountId", String::class)!!
            val appId = call.parameters["appId"]!!
            val owns = transaction { Apps.select { (Apps.id eq appId) and (Apps.accountId eq accountId) }.count() > 0 }
            if (!owns) return@delete call.respond(HttpStatusCode.Forbidden)
            AppService.delete(appId)
            call.respond(HttpStatusCode.NoContent)
        }
```

> `patch` and `delete` route builders come from `io.ktor.server.routing.*`, already imported. The `and` import may already exist via the existing `select` usage — if the build reports a duplicate import, remove the redundant line.

- [ ] **Step 2: Build everything (full backend test suite)**

Run: `./gradlew build`
Expected: BUILD SUCCESSFUL, all tests pass (Event, Key, Ingestion, Stats, App).

- [ ] **Step 3: Manual smoke test (optional but recommended)**

Start the server (`./gradlew run` with `JWT_SECRET` set), then:

```bash
# register -> capture token
TOKEN=$(curl -s -XPOST localhost:8080/api/auth/register -H 'Content-Type: application/json' \
  -d '{"email":"smoke@test.com","password":"pw123456"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
# create app
APPID=$(curl -s -XPOST localhost:8080/api/apps -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"name":"Smoke","packageName":"com.smoke"}' | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
# rename, hourly, delete
curl -s -XPATCH localhost:8080/api/apps/$APPID -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"name":"Renamed"}'
curl -s localhost:8080/api/apps/$APPID/stats/hourly -H "Authorization: Bearer $TOKEN"
curl -s -XDELETE -o /dev/null -w "%{http_code}\n" localhost:8080/api/apps/$APPID -H "Authorization: Bearer $TOKEN"  # expect 204
```

- [ ] **Step 4: Commit**

```bash
git add server/src/main/kotlin/com/lumos/server/routes/AppRoutes.kt
git commit -m "feat(server): add PATCH and DELETE app routes"
```

---

# Phase 2 — Frontend

> The portal has no test runner. Each task's gate is `npx tsc -b` (exit 0) plus the stated manual check. Run the dev server with `npm run dev` and a running backend for manual checks.

### Task 7: Shared helpers + components (StatusBadge, PageHeader, format lib, Bone)

**Files:**
- Create: `portal/src/lib/format.ts`
- Create: `portal/src/components/StatusBadge.tsx`
- Create: `portal/src/components/PageHeader.tsx`
- Modify: `portal/src/components/Skeleton.tsx` (export `Bone`)
- Modify: `portal/src/theme.ts` (remove dead exports)

**Interfaces:**
- Produces:
  - `format.ts`: `formatTokens(n:number):string`, `formatDate(iso:string):string`, `androidOsLabel(api:number|null):string`, `estimateCost(model:string|null, tokensIn:number, tokensOut:number):number`.
  - `<StatusBadge status={string} size?={number} />`
  - `<PageHeader icon={ReactNode} title={string} subtitle={string} accent={string} titleGradient={string} />`
  - `Bone` exported from `components/Skeleton.tsx`.

- [ ] **Step 1: Create `portal/src/lib/format.ts`**

```typescript
export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return isToday ? `Today ${time}` : d.toLocaleDateString();
}

const ANDROID_VERSIONS: Record<number, string> = {
  35: 'Android 15', 34: 'Android 14', 33: 'Android 13', 32: 'Android 12L',
  31: 'Android 12', 30: 'Android 11', 29: 'Android 10', 28: 'Android 9',
};

export function androidOsLabel(api: number | null): string {
  if (api == null) return '—';
  return ANDROID_VERSIONS[api] ?? `API ${api}`;
}

const MODEL_PRICING: Record<string, { in: number; out: number }> = {
  // USD per 1M tokens
  'gpt-4o': { in: 5, out: 15 },
  'gpt-4o-mini': { in: 0.15, out: 0.6 },
  'claude-3-5-sonnet': { in: 3, out: 15 },
};
const DEFAULT_PRICING = { in: 5, out: 15 };

export function estimateCost(model: string | null, tokensIn: number, tokensOut: number): number {
  const p = (model && MODEL_PRICING[model]) || DEFAULT_PRICING;
  return (tokensIn / 1_000_000) * p.in + (tokensOut / 1_000_000) * p.out;
}
```

- [ ] **Step 2: Create `portal/src/components/StatusBadge.tsx`**

```tsx
import { CheckCircle, XCircle } from 'lucide-react';
import { T } from '../theme';

export default function StatusBadge({ status, size = 11 }: { status: string; size?: number }) {
  const ok = status === 'OK';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: ok ? 'rgba(0,232,135,0.12)' : 'rgba(255,69,99,0.12)',
      border: `1px solid ${ok ? 'rgba(0,232,135,0.25)' : 'rgba(255,69,99,0.25)'}`,
      borderRadius: 100, padding: '3px 10px',
      color: ok ? T.green : T.red, fontSize: 12, width: 'fit-content',
    }}>
      {ok ? <CheckCircle size={size} /> : <XCircle size={size} />}
      {status}
    </span>
  );
}
```

- [ ] **Step 3: Create `portal/src/components/PageHeader.tsx`**

```tsx
import { T } from '../theme';

export default function PageHeader({ icon, title, subtitle, accent, titleGradient }: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accent: string;           // rgba border/bg color for the icon tile
  titleGradient: string;    // CSS gradient for the title text
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${accent}1A`, border: `1px solid ${accent}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {icon}
        </div>
        <h1 style={{
          fontSize: 34, fontWeight: 700, letterSpacing: '-0.02em', fontFamily: T.fontD,
          background: titleGradient,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text', lineHeight: 1.1,
        }}>
          {title}
        </h1>
      </div>
      <p style={{ color: T.muted, fontSize: 14, paddingLeft: 48 }}>{subtitle}</p>
    </div>
  );
}
```

- [ ] **Step 4: Export `Bone` from `Skeleton.tsx`**

In `portal/src/components/Skeleton.tsx`, change the `Bone` declaration line:

```tsx
export function Bone({ width = '100%', height = 16, radius = 6 }: {
```

(add `export`; the rest of the function is unchanged).

- [ ] **Step 5: Remove dead exports from `theme.ts`**

In `portal/src/theme.ts`, delete the entire `cardGlow` export block (the `export const cardGlow: React.CSSProperties = { ... };`) and delete the `grad2:` line from the `T` object.

- [ ] **Step 6: Typecheck**

Run: `npx tsc -b`
Expected: exit 0. (New files are unused so far; that's fine — they're not dead exports, they're consumed in later tasks. `tsc` does not error on unused exports.)

- [ ] **Step 7: Commit**

```bash
git add portal/src/lib/format.ts portal/src/components/StatusBadge.tsx \
        portal/src/components/PageHeader.tsx portal/src/components/Skeleton.tsx portal/src/theme.ts
git commit -m "feat(portal): shared StatusBadge, PageHeader, format helpers; drop dead theme exports"
```

---

### Task 8: AuthContext + RequireAuth + remove mock fallback

**Files:**
- Create: `portal/src/auth/AuthContext.tsx`
- Create: `portal/src/auth/RequireAuth.tsx`
- Modify: `portal/src/api/client.ts`
- Delete: `portal/src/api/mockData.ts`

**Interfaces:**
- Produces:
  - `AuthProvider` (wraps app), `useAuth(): { token: string|null; setToken(t:string|null):void; logout():void }`.
  - `RequireAuth` — renders children when `token` present, else `<Navigate to="/login" replace>`.

- [ ] **Step 1: Create `portal/src/auth/AuthContext.tsx`**

```tsx
import { createContext, useContext, useState } from 'react';

interface AuthValue {
  token: string | null;
  setToken: (t: string | null) => void;
  logout: () => void;
}

const AuthCtx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem('lumos_token'));

  function setToken(t: string | null) {
    if (t) localStorage.setItem('lumos_token', t);
    else localStorage.removeItem('lumos_token');
    setTokenState(t);
  }

  function logout() {
    localStorage.removeItem('lumos_token');
    localStorage.removeItem('lumos_current_app');
    setTokenState(null);
  }

  return <AuthCtx.Provider value={{ token, setToken, logout }}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthValue {
  const v = useContext(AuthCtx);
  if (!v) throw new Error('useAuth must be used within AuthProvider');
  return v;
}
```

- [ ] **Step 2: Create `portal/src/auth/RequireAuth.tsx`**

```tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

- [ ] **Step 3: Remove the mock fallback from `client.ts`**

Replace the entire contents of `portal/src/api/client.ts` with:

```typescript
import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lumos_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem('lumos_token');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
```

- [ ] **Step 4: Delete the mock data file**

```bash
git rm portal/src/api/mockData.ts
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc -b`
Expected: exit 0. (No remaining references to `mockData` — `client.ts` no longer imports it; `mockData.ts` was imported nowhere else.)

- [ ] **Step 6: Commit**

```bash
git add portal/src/auth/AuthContext.tsx portal/src/auth/RequireAuth.tsx portal/src/api/client.ts
git commit -m "feat(portal): AuthContext + RequireAuth guard; remove mock fallback"
```

---

### Task 9: AppContext (apps + selected app)

**Files:**
- Create: `portal/src/app/AppContext.tsx`

**Interfaces:**
- Consumes: `api` from `../api/client`.
- Produces:
  - `App = { id: string; name: string; packageName: string }`
  - `AppProvider` (wraps authed area), `useApps(): { apps: App[]; currentApp: App|null; currentAppId: string|null; loading: boolean; setCurrentAppId(id:string):void; refresh(): Promise<void> }`.

- [ ] **Step 1: Create `portal/src/app/AppContext.tsx`**

```tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

export interface App { id: string; name: string; packageName: string }

interface AppsValue {
  apps: App[];
  currentApp: App | null;
  currentAppId: string | null;
  loading: boolean;
  setCurrentAppId: (id: string) => void;
  refresh: () => Promise<void>;
}

const AppsCtx = createContext<AppsValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [apps, setApps] = useState<App[]>([]);
  const [currentAppId, setCurrentAppIdState] = useState<string | null>(
    () => localStorage.getItem('lumos_current_app'),
  );
  const [loading, setLoading] = useState(true);

  function setCurrentAppId(id: string) {
    localStorage.setItem('lumos_current_app', id);
    setCurrentAppIdState(id);
  }

  async function refresh() {
    const r = await api.get<App[]>('/api/apps');
    const list = r.data;
    setApps(list);
    setCurrentAppIdState(prev => {
      const valid = prev && list.some(a => a.id === prev) ? prev : (list[0]?.id ?? null);
      if (valid) localStorage.setItem('lumos_current_app', valid);
      else localStorage.removeItem('lumos_current_app');
      return valid;
    });
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const currentApp = apps.find(a => a.id === currentAppId) ?? null;

  return (
    <AppsCtx.Provider value={{ apps, currentApp, currentAppId, loading, setCurrentAppId, refresh }}>
      {children}
    </AppsCtx.Provider>
  );
}

export function useApps(): AppsValue {
  const v = useContext(AppsCtx);
  if (!v) throw new Error('useApps must be used within AppProvider');
  return v;
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add portal/src/app/AppContext.tsx
git commit -m "feat(portal): AppContext for apps list + selected app"
```

---

### Task 10: Onboarding + Apps management page

**Files:**
- Create: `portal/src/pages/Onboarding.tsx`
- Create: `portal/src/pages/Apps.tsx`

**Interfaces:**
- Consumes: `useApps()`, `api`, `PageHeader`.
- Produces: default-exported `Onboarding` and `Apps` page components.

- [ ] **Step 1: Create `portal/src/pages/Onboarding.tsx`**

```tsx
import { useState } from 'react';
import { Rocket } from 'lucide-react';
import { api } from '../api/client';
import { useApps } from '../app/AppContext';
import { T, cardStyle } from '../theme';

export default function Onboarding() {
  const { refresh, setCurrentAppId } = useApps();
  const [name, setName] = useState('');
  const [pkg, setPkg] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function create() {
    if (!name.trim() || !pkg.trim()) { setError('Both fields are required'); return; }
    setBusy(true); setError('');
    try {
      const res = await api.post('/api/apps', { name, packageName: pkg });
      await refresh();
      setCurrentAppId(res.data.id);
    } catch {
      setError('Could not create app. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 460, margin: '8vh auto 0' }}>
      <div style={{ ...cardStyle, padding: 40 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, marginBottom: 20,
          background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Rocket size={20} color={T.cyan} strokeWidth={1.5} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: T.text, fontFamily: T.fontD, marginBottom: 8 }}>
          Create your first app
        </h1>
        <p style={{ color: T.muted, fontSize: 14, marginBottom: 24 }}>
          An app groups your traces and API keys. You can add more later.
        </p>
        {error && <p style={{ color: T.red, fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <input
          value={name} onChange={e => setName(e.target.value)}
          placeholder="App name (e.g. My Android App)"
          style={onbInput}
        />
        <input
          value={pkg} onChange={e => setPkg(e.target.value)}
          placeholder="Package name (e.g. com.acme.app)"
          style={{ ...onbInput, marginTop: 12 }}
        />
        <button onClick={create} disabled={busy} style={{
          width: '100%', marginTop: 20, padding: 12, border: 'none', borderRadius: 10,
          background: T.grad, color: '#fff', fontWeight: 700, fontSize: 15,
          cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1,
        }}>
          {busy ? 'Creating…' : 'Create app'}
        </button>
      </div>
    </div>
  );
}

const onbInput: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: `1px solid ${T.border}`, background: T.bg, color: T.text,
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};
```

- [ ] **Step 2: Create `portal/src/pages/Apps.tsx`**

```tsx
import { useState } from 'react';
import { Boxes, Plus, Trash2, Check, X } from 'lucide-react';
import { api } from '../api/client';
import { useApps, type App } from '../app/AppContext';
import PageHeader from '../components/PageHeader';
import { T, cardStyle, transition } from '../theme';

export default function Apps() {
  const { apps, currentAppId, setCurrentAppId, refresh } = useApps();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [pkg, setPkg] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  async function create() {
    if (!name.trim() || !pkg.trim()) return;
    const res = await api.post('/api/apps', { name, packageName: pkg });
    setName(''); setPkg(''); setShowForm(false);
    await refresh();
    setCurrentAppId(res.data.id);
  }

  async function saveRename(id: string) {
    if (editName.trim()) await api.patch(`/api/apps/${id}`, { name: editName });
    setEditingId(null);
    await refresh();
  }

  async function remove(app: App) {
    if (!window.confirm(`Delete "${app.name}" and all its traces and keys? This cannot be undone.`)) return;
    await api.delete(`/api/apps/${app.id}`);
    await refresh();
  }

  return (
    <div>
      <PageHeader
        icon={<Boxes size={16} color={T.cyan} strokeWidth={1.5} />}
        title="Apps" subtitle="Create and manage your apps"
        accent="#00D4FF"
        titleGradient="linear-gradient(135deg, #E8F2FF 0%, #00D4FF 100%)"
      />

      <button onClick={() => setShowForm(s => !s)} style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16,
        background: T.grad, border: 'none', color: '#fff', fontWeight: 700,
        padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontSize: 14,
      }}>
        <Plus size={16} /> New App
      </button>

      {showForm && (
        <div style={{ ...cardStyle, padding: 20, marginBottom: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="App name" style={appInput} />
          <input value={pkg} onChange={e => setPkg(e.target.value)} placeholder="com.acme.app" style={appInput} />
          <button onClick={create} style={primaryBtn}>Create</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {apps.map(app => (
          <div key={app.id} style={{
            ...cardStyle, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16,
            borderColor: app.id === currentAppId ? T.cyan : T.border,
          }}>
            <div style={{ flex: 1 }}>
              {editingId === app.id ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input value={editName} onChange={e => setEditName(e.target.value)} style={appInput} />
                  <button onClick={() => saveRename(app.id)} style={iconBtn}><Check size={16} color={T.green} /></button>
                  <button onClick={() => setEditingId(null)} style={iconBtn}><X size={16} color={T.muted} /></button>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 15, fontWeight: 600, color: T.text, fontFamily: T.fontD }}>{app.name}</p>
                  <p style={{ fontSize: 12, color: T.muted, fontFamily: T.fontM }}>{app.packageName}</p>
                </>
              )}
            </div>
            {app.id === currentAppId
              ? <span style={{ fontSize: 11, color: T.cyan, fontFamily: T.fontM }}>SELECTED</span>
              : <button onClick={() => setCurrentAppId(app.id)} style={ghostBtn}>Select</button>}
            <button onClick={() => { setEditingId(app.id); setEditName(app.name); }} style={ghostBtn}>Rename</button>
            <button onClick={() => remove(app)} style={iconBtn} title="Delete"><Trash2 size={16} color={T.red} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

const appInput: React.CSSProperties = {
  padding: '10px 14px', borderRadius: 10, border: `1px solid ${T.border}`,
  background: T.bg, color: T.text, fontSize: 14, outline: 'none', flex: 1, minWidth: 160,
};
const primaryBtn: React.CSSProperties = {
  background: T.grad, border: 'none', color: '#fff', fontWeight: 700,
  padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 14,
};
const ghostBtn: React.CSSProperties = {
  background: 'none', border: `1px solid ${T.border}`, color: T.muted,
  borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, transition,
};
const iconBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex',
};
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc -b`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add portal/src/pages/Onboarding.tsx portal/src/pages/Apps.tsx
git commit -m "feat(portal): onboarding + apps management page"
```

---

### Task 11: Wire providers, routes, and the guard into App.tsx

**Files:**
- Modify: `portal/src/App.tsx`

**Interfaces:**
- Consumes: `AuthProvider`, `RequireAuth`, `AppProvider`, `useApps`, `Login`, `Onboarding`, `Apps`, existing pages, `NavBar`.

- [ ] **Step 1: Replace `portal/src/App.tsx`**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import TraceExplorer from './pages/TraceExplorer';
import TraceDetail from './pages/TraceDetail';
import ApiKeys from './pages/ApiKeys';
import Apps from './pages/Apps';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import NavBar from './components/NavBar';
import { AuthProvider } from './auth/AuthContext';
import RequireAuth from './auth/RequireAuth';
import { AppProvider, useApps } from './app/AppContext';
import { T } from './theme';

function AppLayout({ children }: { children: React.ReactNode }) {
  const { apps, loading } = useApps();
  if (loading) return <div style={{ minHeight: '100vh', background: T.bg }} />;
  if (apps.length === 0) {
    return (
      <div style={{ minHeight: '100vh', width: '100%', background: T.bg }}>
        <Onboarding />
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <NavBar />
      <main style={{
        marginLeft: 240, flex: 1, overflowY: 'auto', padding: '32px 40px',
        minHeight: '100vh', background: T.bg, width: 'calc(100% - 240px)',
      }}>
        {children}
      </main>
    </div>
  );
}

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AppProvider>
        <AppLayout>{children}</AppLayout>
      </AppProvider>
    </RequireAuth>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"            element={<Login />} />
          <Route path="/"                 element={<Protected><Dashboard /></Protected>} />
          <Route path="/traces"           element={<Protected><TraceExplorer /></Protected>} />
          <Route path="/traces/:traceId"  element={<Protected><TraceDetail /></Protected>} />
          <Route path="/keys"             element={<Protected><ApiKeys /></Protected>} />
          <Route path="/apps"             element={<Protected><Apps /></Protected>} />
          <Route path="*"                 element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: exit 0.

> NOTE: pages still fetch `/api/apps` themselves and use local `PageHeader` functions; that's fine — they're rewired in Tasks 13–16. The app compiles and runs now: login → onboarding/app shell works.

- [ ] **Step 3: Manual check**

With backend running: visit `/` while logged out → redirected to `/login`. Register a new account → land on "Create your first app". Create one → app shell appears.

- [ ] **Step 4: Commit**

```bash
git add portal/src/App.tsx
git commit -m "feat(portal): auth guard, providers, login/onboarding/apps routes"
```

---

### Task 12: Login uses AuthContext; NavBar app switcher + working Sign Out

**Files:**
- Modify: `portal/src/pages/Login.tsx`
- Modify: `portal/src/components/NavBar.tsx`

**Interfaces:**
- Consumes: `useAuth()`, `useApps()`.

- [ ] **Step 1: Update `Login.tsx` to use `setToken`**

In `portal/src/pages/Login.tsx`:

Add import near the top:

```tsx
import { useAuth } from '../auth/AuthContext';
```

Inside the component, add after `const nav = useNavigate();`:

```tsx
  const { setToken } = useAuth();
```

In `handleSubmit`, replace `localStorage.setItem('lumos_token', res.data.token);` with:

```tsx
      setToken(res.data.token);
```

In `handleRegister`, replace `localStorage.setItem('lumos_token', res.data.token);` with:

```tsx
      setToken(res.data.token);
```

- [ ] **Step 2: Add the app switcher + Sign Out handler in `NavBar.tsx`**

In `portal/src/components/NavBar.tsx`:

Add imports:

```tsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useApps } from '../app/AppContext';
import { ChevronDown } from 'lucide-react';
```

Add `{ to: '/apps', label: 'Apps', icon: <Boxes size={18} strokeWidth={1.5} /> }` to the `links` array and import `Boxes` in the existing `lucide-react` import.

Inside `NavBar()`, add hooks at the top:

```tsx
  const nav = useNavigate();
  const { logout } = useAuth();
  const { apps, currentApp, setCurrentAppId } = useApps();
  const [switcherOpen, setSwitcherOpen] = useState(false);
```

Replace the hardcoded "Demo App" chip block (the `<div>` containing the green dot, "Demo App", and "Live · Mock data") with an app switcher:

```tsx
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setSwitcherOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
              background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.12)',
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.green, boxShadow: `0 0 6px ${T.green}`, flexShrink: 0 }} />
            <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: T.text, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentApp?.name ?? 'No app'}
              </p>
              <p style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>Live</p>
            </div>
            <ChevronDown size={14} color={T.muted} style={{ transform: switcherOpen ? 'rotate(180deg)' : 'none', transition }} />
          </button>
          {switcherOpen && (
            <div style={{
              position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0,
              background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
              padding: 6, zIndex: 200, boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            }}>
              {apps.map(a => (
                <button key={a.id}
                  onClick={() => { setCurrentAppId(a.id); setSwitcherOpen(false); }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px',
                    borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13,
                    background: a.id === currentApp?.id ? 'rgba(0,212,255,0.08)' : 'transparent',
                    color: a.id === currentApp?.id ? T.cyan : T.muted,
                  }}>
                  {a.name}
                </button>
              ))}
              <button onClick={() => { setSwitcherOpen(false); nav('/apps'); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, background: 'transparent', color: T.text }}>
                + New App
              </button>
            </div>
          )}
        </div>
```

Wire the Sign Out button: add to its `<button ...>` props:

```tsx
          onClick={() => { logout(); nav('/login'); }}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc -b`
Expected: exit 0.

- [ ] **Step 4: Manual check**

Log in → NavBar shows the current app name; the switcher lists apps and "+ New App"; "Apps" nav link opens `/apps`; Sign Out returns to `/login` and a refresh keeps you logged out.

- [ ] **Step 5: Commit**

```bash
git add portal/src/pages/Login.tsx portal/src/components/NavBar.tsx
git commit -m "feat(portal): login via AuthContext; NavBar app switcher + working sign out"
```

---

### Task 13: Dashboard — context app, real hourly, real WoW, shared components

**Files:**
- Modify: `portal/src/pages/Dashboard.tsx`

**Interfaces:**
- Consumes: `useApps()`, `StatsService` JSON (`trend.current`/`trend.previous`), `/stats/hourly`, `StatusBadge`, `PageHeader`, `format.ts`.

- [ ] **Step 1: Update imports and types**

In `portal/src/pages/Dashboard.tsx`, replace the local helper imports/usages:

- Remove the local `formatTokens` and `formatDate` function definitions.
- Add imports:

```tsx
import { useApps } from '../app/AppContext';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import { formatTokens, formatDate } from '../lib/format';
```

Extend the `Stats` interface to include the trend windows:

```tsx
interface TrendWindow { traces: number; ok: number; errors: number; latencySum: number; tokensIn: number; tokensOut: number }
interface Stats {
  traces: number; ok: number; errors: number;
  tokensIn: number; tokensOut: number; latencySum: number;
  thumbsUp: number; thumbsDown: number;
  trend?: { current: TrendWindow; previous: TrendWindow };
}
```

Add `model` to `TraceRow`:

```tsx
interface TraceRow {
  traceId: string; feature: string; status: string;
  model: string | null; latencyMs: number | null; startedAt: string;
}
```

- [ ] **Step 2: Replace data loading to use the selected app + real hourly**

Replace the `hourlyData` `useMemo` and the `useEffect` data load with:

```tsx
  const { currentAppId } = useApps();
  const [hourlyData, setHourlyData] = useState<{ hour: string; calls: number }[]>([]);

  useEffect(() => {
    if (!currentAppId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      api.get(`/api/apps/${currentAppId}/stats`),
      api.get(`/api/apps/${currentAppId}/traces`),
      api.get(`/api/apps/${currentAppId}/stats/hourly`),
    ]).then(([statsRes, tracesRes, hourlyRes]) => {
      setStats(statsRes.data);
      setTraces(tracesRes.data.slice(0, 5));
      setHourlyData(hourlyRes.data);
    }).finally(() => setLoading(false));
  }, [currentAppId]);
```

(Remove the now-unused `useMemo` import if no other `useMemo` remains.)

- [ ] **Step 3: Compute real WoW deltas; replace hardcoded trend strings**

After the existing derived values (`successRate`, `avgLatency`, etc.), add a delta helper and per-card trend captions:

```tsx
  const cur = stats.trend?.current;
  const prev = stats.trend?.previous;

  function pct(curr: number, before: number): string | undefined {
    if (!before) return undefined;
    const d = ((curr - before) / before) * 100;
    const arrow = d >= 0 ? '↑' : '↓';
    return `${arrow} ${Math.abs(d).toFixed(1)}% vs last week`;
  }

  const convTrend = cur && prev ? pct(cur.traces, prev.traces) : undefined;
  const curSucc = cur && cur.traces ? (cur.ok / cur.traces) * 100 : 0;
  const prevSucc = prev && prev.traces ? (prev.ok / prev.traces) * 100 : 0;
  const succTrend = prev && prev.traces
    ? `${curSucc - prevSucc >= 0 ? '↑' : '↓'} ${Math.abs(curSucc - prevSucc).toFixed(1)} pts vs last week`
    : undefined;
  const curLat = cur && cur.traces ? Math.round(cur.latencySum / cur.traces) : 0;
  const prevLat = prev && prev.traces ? Math.round(prev.latencySum / prev.traces) : 0;
  const latTrend = prev && prev.traces
    ? `${curLat - prevLat <= 0 ? '↓' : '↑'} ${Math.abs(curLat - prevLat)}ms vs last week`
    : undefined;
  const tokTrend = cur && prev ? pct(cur.tokensIn + cur.tokensOut, prev.tokensIn + prev.tokensOut) : undefined;
```

Then in the four `<StatsCard ... trend={...} />` usages, replace the hardcoded strings:
- Total Conversations: `trend={convTrend}`
- Success Rate: `trend={succTrend}`
- Avg Latency: `trend={latTrend}`
- Total Tokens: keep `trend={`avg ${avgPerConv} per conv.`}` (already real).

> `StatsCard`'s `trend` prop is optional and already guarded by `trend && (...)`, so `undefined` simply hides the caption when there's no prior-week data.

- [ ] **Step 4: Use `<PageHeader>` and `<StatusBadge>`**

Replace the local `<PageHeader />` function-component usage with the shared component. Delete the local `PageHeader` function at the bottom of the file and replace its call site (`<PageHeader />`) with:

```tsx
      <PageHeader
        icon={<Activity size={16} color={T.cyan} strokeWidth={1.5} />}
        title="Dashboard" subtitle="AI observability at a glance · real-time insights"
        accent="#00D4FF"
        titleGradient="linear-gradient(135deg, #E8F2FF 0%, #00D4FF 60%, #7B5FFF 100%)"
      />
```

In the recent-traces rows, replace the inline status `<span>…</span>` block with `<StatusBadge status={t.status} />`.

- [ ] **Step 5: Typecheck**

Run: `npx tsc -b`
Expected: exit 0. (If `useMemo` or `CheckCircle`/`XCircle` become unused, remove them from imports to satisfy `noUnusedLocals` if enabled.)

- [ ] **Step 6: Manual check**

Dashboard loads for the selected app; the hourly bars reflect real `/stats/hourly`; trend captions show only when prior-week data exists (none for a brand-new app — captions absent, no fake "↑12%").

- [ ] **Step 7: Commit**

```bash
git add portal/src/pages/Dashboard.tsx
git commit -m "feat(portal): dashboard uses selected app, real hourly + WoW trends"
```

---

### Task 14: TraceExplorer — context app, Android-only device, CSV fix, shared components

**Files:**
- Modify: `portal/src/pages/TraceExplorer.tsx`

**Interfaces:**
- Consumes: `useApps()`, `StatusBadge`, `PageHeader`, `androidOsLabel`, API `device` shape `{deviceModel, androidVersion, sdkVersion, appVersion}`.

- [ ] **Step 1: Update the device type and remove platform fakery**

In `portal/src/pages/TraceExplorer.tsx`:

Replace the `DeviceInfo` interface with the real shape:

```tsx
interface DeviceInfo {
  deviceModel: string; androidVersion: number; sdkVersion: string; appVersion: string;
}
```

Update `TraceRow` to use it (it already has `device?: DeviceInfo`). Remove the `platformColor` function and the `filterPlatform`/`setPlatform` state and its filter `<div>` (the Android/iOS/Web button group) entirely. Remove `filterPlatform` from the `filteredTraces` `useMemo` dependency list and its filter line.

Replace `PlatformBadge` with an Android device badge:

```tsx
import { Smartphone } from 'lucide-react'; // ensure imported

function DeviceBadge({ device }: { device?: DeviceInfo }) {
  if (!device) return <span style={{ color: '#6A7D9A', fontSize: 12 }}>—</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
      <Smartphone size={12} color="#3DDC84" strokeWidth={1.5} />
      <span style={{ color: '#3DDC84', fontFamily: "'JetBrains Mono', monospace" }}>{device.deviceModel}</span>
    </span>
  );
}
```

Replace `<PlatformBadge device={t.device} />` in the rows with `<DeviceBadge device={t.device} />`. Remove the now-unused `Monitor` import if present.

- [ ] **Step 2: Use the selected app for loading**

Add `import { useApps } from '../app/AppContext';`. Inside the component add `const { currentAppId } = useApps();`. Replace the `useEffect` that fetches `/api/apps` then traces with:

```tsx
  useEffect(() => {
    if (!currentAppId) { setLoading(false); return; }
    setLoading(true);
    api.get(`/api/apps/${currentAppId}/traces`)
      .then(r => setTraces(r.data))
      .finally(() => setLoading(false));
  }, [currentAppId, refreshKey]);
```

- [ ] **Step 3: Fix CSV export (filtered rows, no empty model column)**

In the Export CSV `onClick`, change the header array and replace `traces.map` with `filteredTraces.map`, and include the real `model` and Android device fields:

```tsx
              const csv = [
                ['Trace ID', 'Feature', 'Status', 'Model', 'Latency (ms)', 'Tokens In', 'Tokens Out', 'Device', 'Android API', 'SDK', 'App Version', 'Started At'].join(','),
                ...filteredTraces.map(t => [
                  t.traceId, t.feature, t.status, '',
                  t.latencyMs ?? '', t.tokensIn ?? '', t.tokensOut ?? '',
                  t.device?.deviceModel ?? '', t.device?.androidVersion ?? '',
                  t.device?.sdkVersion ?? '', t.device?.appVersion ?? '',
                  t.startedAt,
                ].join(',')),
              ].join('\n');
```

> The traces-list API does not return `model` per row in the CSV context here (the list query returns `model`, so you may instead use `t.model ?? ''` if you add `model` to this page's `TraceRow`). Keep `''` only if `model` is not on the row type. To include it: add `model: string | null;` to `TraceRow` and use `t.model ?? ''`.

Implement the included-model path: add `model: string | null;` to `TraceRow`, and set the CSV model cell to `t.model ?? ''`.

- [ ] **Step 4: Use `<StatusBadge>` and `<PageHeader>`**

Replace the page-header block (icon tile + gradient `<h1>Traces` + subtitle) with:

```tsx
      <PageHeader
        icon={<Activity size={16} color={T.purple} strokeWidth={1.5} />}
        title="Traces"
        subtitle={traces.length > 0 ? `${traces.length} conversations recorded` : 'No traces yet'}
        accent="#7B5FFF"
        titleGradient="linear-gradient(135deg, #E8F2FF 0%, #7B5FFF 100%)"
      />
```

But keep the right-side controls (TimeRangeSelector / refresh / export) — restructure so `PageHeader` sits in the left column and the controls stay in the existing flex row. (Wrap `PageHeader` and the controls in the existing `display:flex; justify-content:space-between` container, placing `PageHeader` where the old left `<div>` was.)

Replace the inline status `<span>` in data rows with `<StatusBadge status={t.status} />`. Add `import StatusBadge from '../components/StatusBadge';` and `import PageHeader from '../components/PageHeader';`.

Update the "Device" header label only (it already reads "Device") and the empty/clear-filters reset handler: remove `setPlatform('ALL')` from the "Clear filters" `onClick`.

- [ ] **Step 5: Typecheck**

Run: `npx tsc -b`
Expected: exit 0. Remove any now-unused imports (`Monitor`, `CheckCircle`, `XCircle`) the compiler flags.

- [ ] **Step 6: Manual check**

Traces page lists the selected app's traces; the Device column shows the Android device model; there are no iOS/Web filter buttons; CSV export downloads filtered rows with real model + device columns.

- [ ] **Step 7: Commit**

```bash
git add portal/src/pages/TraceExplorer.tsx
git commit -m "feat(portal): traces use selected app; Android-only device; CSV + shared components"
```

---

### Task 15: TraceDetail — real device fields, shared StatusBadge + Bone

**Files:**
- Modify: `portal/src/pages/TraceDetail.tsx`

**Interfaces:**
- Consumes: API `device` `{deviceModel, androidVersion, sdkVersion, appVersion}`, `androidOsLabel`, `StatusBadge`, shared `Bone`.

- [ ] **Step 1: Update the device type and rendering**

In `portal/src/pages/TraceDetail.tsx`:

Replace the `DeviceInfo` interface:

```tsx
interface DeviceInfo {
  deviceModel: string; androidVersion: number; sdkVersion: string; appVersion: string;
}
```

Add imports:

```tsx
import { Bone } from '../components/Skeleton';
import StatusBadge from '../components/StatusBadge';
import { androidOsLabel } from '../lib/format';
```

Delete the local `Bone` function definition (now imported).

In the "Device & Environment" card, replace the platform-based icon and the rows array with Android fields:

```tsx
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <Smartphone size={14} color="#3DDC84" strokeWidth={1.5} />
                <p style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: T.fontD, letterSpacing: '-0.01em' }}>
                  Device & Environment
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { label: 'Device',      value: trace.device.deviceModel,            color: T.text },
                  { label: 'OS',          value: androidOsLabel(trace.device.androidVersion), color: '#3DDC84' },
                  { label: 'SDK Version', value: `v${trace.device.sdkVersion}`,        color: T.purple },
                  { label: 'App Version', value: `v${trace.device.appVersion}`,        color: T.muted },
                ].map(({ label, value, color }, i, arr) => (
```

(the `.map` body — the row `<div>` with label/value spans — stays the same; only the array above changes). Remove the now-unused `Monitor` import if the compiler flags it.

Replace the inline status `<span>` in the header badges row with `<StatusBadge status={trace.status} size={12} />` (remove the local `isOK`-based status span; keep `isOK` only if still used elsewhere — it is used for nothing else after this, so remove the `const isOK = ...` line and the inline status span, and anywhere referencing `isOK` switch to `trace.status === 'OK'`).

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: exit 0.

- [ ] **Step 3: Manual check**

Open a trace with device data → Device & Environment shows Device model, OS (e.g. "Android 14"), SDK version, App version. Status badge renders.

- [ ] **Step 4: Commit**

```bash
git add portal/src/pages/TraceDetail.tsx
git commit -m "feat(portal): trace detail shows real Android device; shared StatusBadge + Bone"
```

---

### Task 16: ApiKeys — selected app, PageHeader, states

**Files:**
- Modify: `portal/src/pages/ApiKeys.tsx`

**Interfaces:**
- Consumes: `useApps()`, `PageHeader`.

- [ ] **Step 1: Use the selected app instead of fetching `/api/apps`**

In `portal/src/pages/ApiKeys.tsx`:

Add imports:

```tsx
import { useApps } from '../app/AppContext';
import PageHeader from '../components/PageHeader';
```

Replace the local `appId` state + the `useEffect` that fetches `/api/apps` with:

```tsx
  const { currentAppId } = useApps();
  const [loading, setLoading] = useState(true);

  const loadKeys = (id: string) =>
    api.get(`/api/apps/${id}/keys`).then(r => setKeys(r.data));

  useEffect(() => {
    if (!currentAppId) { setLoading(false); return; }
    setLoading(true);
    loadKeys(currentAppId).finally(() => setLoading(false));
  }, [currentAppId]);
```

Replace references to `appId` in `createKey`/`revoke` with `currentAppId`:

```tsx
  async function createKey() {
    if (!currentAppId || !keyName.trim()) return;
    const res = await api.post(`/api/apps/${currentAppId}/keys`, { name: keyName });
    setNewSecret(res.data.secret);
    setKeyName(''); setShowForm(false);
    loadKeys(currentAppId);
  }

  async function revoke(keyId: string) {
    await api.delete(`/api/keys/${keyId}`);
    if (currentAppId) loadKeys(currentAppId);
  }
```

- [ ] **Step 2: Use `<PageHeader>` and add empty state**

Replace the page-header block (icon tile + gradient `<h1>API Keys` + subtitle) — keep the "New Key" button in the same flex row — with:

```tsx
        <PageHeader
          icon={<Key size={16} color={T.amber} strokeWidth={1.5} />}
          title="API Keys" subtitle="Manage authentication keys for your app"
          accent="#FFB800"
          titleGradient="linear-gradient(135deg, #E8F2FF 0%, #FFB800 100%)"
        />
```

After the key-cards `<div>`, add an empty state shown when not loading and there are no keys:

```tsx
      {!loading && keys.length === 0 && (
        <div style={{ ...cardStyle, padding: 48, textAlign: 'center', color: T.muted, fontSize: 14 }}>
          No API keys yet. Create one to connect your app.
        </div>
      )}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc -b`
Expected: exit 0.

- [ ] **Step 4: Manual check**

API Keys page reads the selected app; creating a key reveals the secret; revoking updates the list; a new app shows the empty state.

- [ ] **Step 5: Commit**

```bash
git add portal/src/pages/ApiKeys.tsx
git commit -m "feat(portal): api keys use selected app; PageHeader + empty state"
```

---

### Task 17: Favicon + lightweight logo + final cleanup

**Files:**
- Create: `portal/public/favicon.svg`
- Create: `portal/public/lumos-mark.svg`
- Modify: `portal/index.html`
- Modify: `portal/src/components/NavBar.tsx`

- [ ] **Step 1: Create `portal/public/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#00D4FF"/>
      <stop offset="100%" stop-color="#7B5FFF"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="8" fill="url(#g)"/>
  <path d="M16 7l2.6 5.9L25 14l-5.2 1.4L16 25l-2.6-9.6L8 14l6.4-1.1L16 7z" fill="#fff"/>
</svg>
```

- [ ] **Step 2: Create `portal/public/lumos-mark.svg`** (same content as favicon.svg, used as the NavBar logo)

Copy the same SVG into `portal/public/lumos-mark.svg`.

- [ ] **Step 3: Point `index.html` at the SVG favicon**

In `portal/index.html`, the favicon link already references `/favicon.svg` — confirm it reads:

```html
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

- [ ] **Step 4: Use the lightweight mark in `NavBar.tsx`**

In `portal/src/components/NavBar.tsx`, change the logo `<img src="/lumos-icon.png" .../>` to `src="/lumos-mark.svg"` (avoids shipping the 4.9 MB PNG).

- [ ] **Step 5: Remove the unused 4.9 MB PNG**

```bash
git rm portal/public/lumos-icon.png
```

- [ ] **Step 6: Typecheck + build**

Run: `npx tsc -b && npm run build`
Expected: exit 0, production build succeeds.

- [ ] **Step 7: Commit**

```bash
git add portal/public/favicon.svg portal/public/lumos-mark.svg portal/index.html portal/src/components/NavBar.tsx
git commit -m "chore(portal): SVG favicon + logo; drop 4.9MB PNG"
```

---

### Task 18: End-to-end verification

**Files:** none (verification only).

- [ ] **Step 1: Full backend test suite**

Run (from `server/`): `./gradlew build`
Expected: BUILD SUCCESSFUL, all tests pass.

- [ ] **Step 2: Full portal build**

Run (from `portal/`): `npx tsc -b && npm run build`
Expected: exit 0.

- [ ] **Step 3: Manual end-to-end (backend running with `JWT_SECRET` + `OPENROUTER_API_KEY` set)**

Walk the go-live happy path and confirm each:
1. Logged out → any route redirects to `/login`.
2. Register a new account → lands on "Create your first app".
3. Create an app → app shell appears; Dashboard shows zeros and empty states (no fake data, no random bars beyond zero-filled hours).
4. `/keys` → New Key → secret revealed and copyable.
5. Send a real event from the SDK (or `curl POST /v0/events` with the key, an envelope with `deviceModel`/`androidVersion` and a `TRACE` payload).
6. Dashboard KPIs/hourly update; Traces list shows the trace with model + Android device; trace detail shows Device & Environment.
7. Apps page: rename the app (NavBar reflects it), create a second app, switch between them (data scopes per app), delete the second app.
8. Sign Out → `/login`; refresh stays logged out.

- [ ] **Step 4: Final commit (if any verification fixes were needed)**

```bash
git add -A && git commit -m "test: end-to-end go-live verification"
```

---

## Self-Review Notes (coverage map)

- Spec §4.1 Auth → Tasks 8, 11, 12.
- Spec §4.2 AppContext → Tasks 9, 13–16 (pages consume it).
- Spec §4.3 Apps management (create/list/select/rename/delete) → Tasks 5, 6, 10, 12.
- Spec §4.4 Android device UI → Tasks 1, 2, 14, 15.
- Spec §4.5 Dashboard real data (hourly + WoW + cost) → Tasks 3, 4, 13.
- Spec §4.6 Cleanup (StatusBadge/PageHeader/Bone, dead exports, CSV, favicon, logo, delete mockData) → Tasks 7, 8, 14, 17.
- Spec §5 Backend (schema, ingest, routes, stats) → Tasks 1–6.
- Spec §7 Testing → backend tests in Tasks 1,3,5; build gates in 2,4,6; frontend tsc gates throughout; E2E in Task 18.

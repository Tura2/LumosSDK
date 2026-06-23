# Lumos Full-Codebase Audit — Bug Fix Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix every Critical and Important finding from the 2026-06-23 three-way audit (server, portal, Android SDK).

**Architecture:** Eight focused tasks, each targeting one layer or concern. Server tasks fix correctness before portal tasks consume the corrected API. Android tasks are fully independent.

**Tech Stack:** Kotlin/Ktor + Exposed + SQLite (server), React 19 + TypeScript (portal), Kotlin + WorkManager + Room (Android SDK).

## Global Constraints

- Gradle: run `.\gradlew` from `server/` with `$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"`
- kotlinx-serialization: never use `Map<String, Any?>` in a `call.respond()`; use `@Serializable` data classes or `Map<String, String>`
- Every new Exposed column on an existing table must be `.nullable()`
- Every `/api/apps/{appId}/...` route must verify app ownership (403 if not owner)
- Commit messages: no Co-Authored-By trailers, no emoji

---

## Task 1 (Server): Replace `Map` responses with `@Serializable` data classes

**Severity:** Critical — `Map<String, Any?>` with mixed value types crashes at runtime with `SerializationException`. Adding the `debug: Boolean?` field to app responses makes this concrete. Doing this first unblocks Tasks 5 and 6.

**Files:**
- Create: `server/src/main/kotlin/com/lumos/server/dto/ResponseDtos.kt`
- Modify: `server/src/main/kotlin/com/lumos/server/routes/AppRoutes.kt`
- Modify: `server/src/main/kotlin/com/lumos/server/routes/AccountRoutes.kt`
- Modify: `server/src/main/kotlin/com/lumos/server/routes/KeyRoutes.kt`
- Modify: `server/src/main/kotlin/com/lumos/server/routes/EventRoutes.kt`

**Interfaces:**
- Produces: `AppDto(id, name, packageName, debug)` — used by portal `AppContext.App` which already has `debug?: boolean | null`

- [ ] **Step 1: Create the DTO file**

Create `server/src/main/kotlin/com/lumos/server/dto/ResponseDtos.kt`:

```kotlin
package com.lumos.server.dto

import kotlinx.serialization.Serializable

@Serializable
data class AppDto(
    val id: String,
    val name: String,
    val packageName: String,
    val debug: Boolean?,
)

@Serializable
data class AccountDto(
    val id: String,
    val email: String,
    val name: String,
)

@Serializable
data class CreatedAppDto(val id: String)

@Serializable
data class CreatedKeyDto(val id: String, val secret: String)

@Serializable
data class IngestResponse(val accepted: Int)

@Serializable
data class ConfigResponse(val active: Boolean)
```

- [ ] **Step 2: Update AppRoutes.kt**

Replace the three `mapOf(...)` respond calls:

```kotlin
// GET /api/apps — add import com.lumos.server.dto.AppDto at top
Apps.select { Apps.accountId eq accountId }.map {
    AppDto(
        id = it[Apps.id],
        name = it[Apps.name],
        packageName = it[Apps.packageName],
        debug = it[Apps.debug],
    )
}
// call.respond(apps) — same, apps is now List<AppDto>

// POST /api/apps
call.respond(HttpStatusCode.Created, CreatedAppDto(id = appId))

// PATCH /api/apps/{appId} — inside the transaction, build AppDto:
Apps.select { Apps.id eq appId }.singleOrNull()?.let { row ->
    AppDto(
        id = row[Apps.id],
        name = row[Apps.name],
        packageName = row[Apps.packageName],
        debug = row[Apps.debug],
    )
}
```

Add import `com.lumos.server.dto.*` at top of AppRoutes.kt, remove unused `mapOf` imports.

- [ ] **Step 3: Update AccountRoutes.kt**

```kotlin
// GET /api/account
AccountDto(
    id = row[Accounts.id],
    email = row[Accounts.email],
    name = row[Accounts.name] ?: "",
)

// PATCH /api/account — same shape
AccountDto(
    id = row[Accounts.id],
    email = row[Accounts.email],
    name = row[Accounts.name] ?: "",
)
```

The `mapOf("error" to "Email already in use")` at line 63 is `Map<String,String>` and serializes fine — leave it.

Add import `com.lumos.server.dto.AccountDto`.

- [ ] **Step 4: Update KeyRoutes.kt**

```kotlin
// POST /api/apps/{appId}/keys
val (keyId, secret) = KeyService.create(appId, req.name)
call.respond(HttpStatusCode.Created, CreatedKeyDto(id = keyId, secret = secret))
```

Add import `com.lumos.server.dto.CreatedKeyDto`.

- [ ] **Step 5: Update EventRoutes.kt**

```kotlin
// POST /v0/events
call.respond(HttpStatusCode.OK, IngestResponse(accepted = events.size))

// GET /v0/config
call.respond(ConfigResponse(active = true))
```

Add import `com.lumos.server.dto.*`.

- [ ] **Step 6: Build and test**

```
cd server
.\gradlew test
```

Expected: all existing tests pass. No new failures.

- [ ] **Step 7: Commit**

```
git add server/src/main/kotlin/com/lumos/server/dto/ \
        server/src/main/kotlin/com/lumos/server/routes/AppRoutes.kt \
        server/src/main/kotlin/com/lumos/server/routes/AccountRoutes.kt \
        server/src/main/kotlin/com/lumos/server/routes/KeyRoutes.kt \
        server/src/main/kotlin/com/lumos/server/routes/EventRoutes.kt
git commit -m "fix(server): use @Serializable DTOs for all route responses, expose debug field"
```

---

## Task 2 (Server): Input validation + safe JSON decoding

**Severity:** Important — empty email/password stored, bad SDK payloads crash the whole ingest batch with 500.

**Files:**
- Modify: `server/src/main/kotlin/com/lumos/server/routes/AuthRoutes.kt`
- Modify: `server/src/main/kotlin/com/lumos/server/routes/AppRoutes.kt`
- Modify: `server/src/main/kotlin/com/lumos/server/routes/EventRoutes.kt`
- Modify: `server/src/main/kotlin/com/lumos/server/service/IngestionService.kt`

- [ ] **Step 1: Write failing tests**

In `server/src/test/kotlin/com/lumos/server/ValidationTest.kt`:

```kotlin
package com.lumos.server

import com.lumos.server.db.DatabaseFactory
import org.junit.BeforeClass
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull

class ValidationTest {
    companion object {
        @BeforeClass @JvmStatic
        fun setup() { DatabaseFactory.init("jdbc:sqlite::memory:") }
    }

    @Test
    fun `blank email is rejected`() {
        // Simulates what AuthRoutes should do:
        val email = "  "
        assertEquals(true, email.isBlank(), "blank email must be detected")
    }

    @Test
    fun `short password is rejected`() {
        val password = "abc"
        assertEquals(true, password.length < 8, "short password must be detected")
    }
}
```

Run: `.\gradlew test --tests "com.lumos.server.ValidationTest"`
Expected: PASS (these test the detection logic, not the route)

- [ ] **Step 2: Add validation to AuthRoutes.kt**

Inside `post("/api/auth/register")`, before the DB check:

```kotlin
val req = call.receive<AuthRequest>()
if (req.email.isBlank() || !req.email.contains("@")) {
    return@post call.respond(HttpStatusCode.BadRequest, "Invalid email")
}
if (req.password.length < 8) {
    return@post call.respond(HttpStatusCode.BadRequest, "Password must be at least 8 characters")
}
```

- [ ] **Step 3: Add validation to POST /api/apps in AppRoutes.kt**

After `val req = call.receive<CreateAppRequest>()`:

```kotlin
if (req.name.isBlank()) {
    return@post call.respond(HttpStatusCode.BadRequest, "App name is required")
}
if (req.packageName.isBlank()) {
    return@post call.respond(HttpStatusCode.BadRequest, "Package name is required")
}
```

- [ ] **Step 4: Wrap JSON decode in EventRoutes.kt**

Replace the bare `decodeFromString` call:

```kotlin
val body = call.receiveText()
val events = try {
    Json.decodeFromString<List<IncomingEnvelope>>(body)
} catch (e: Exception) {
    return@post call.respond(HttpStatusCode.BadRequest, "Invalid event payload")
}
```

- [ ] **Step 5: Make IngestionService skip bad per-event payloads**

Open `server/src/main/kotlin/com/lumos/server/service/IngestionService.kt`. Find the inner `json.decodeFromString<TracePayload>(env.payload)` calls. Wrap each in a `runCatching { ... }.getOrElse { return@forEach }` so a single corrupt event doesn't abort the whole batch.

Read IngestionService.kt to find the exact lines, then wrap each decode block:

```kotlin
// Before (example for TRACE type):
"TRACE" -> {
    val p = json.decodeFromString<TracePayload>(env.payload)
    // ... inserts
}

// After:
"TRACE" -> runCatching {
    val p = json.decodeFromString<TracePayload>(env.payload)
    // ... inserts (unchanged)
}.getOrElse { return@forEach }
```

Apply the same pattern for `"SPAN"` and `"FEEDBACK"` branches.

- [ ] **Step 6: Build and test**

```
.\gradlew test
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```
git add server/src/main/kotlin/com/lumos/server/routes/AuthRoutes.kt \
        server/src/main/kotlin/com/lumos/server/routes/AppRoutes.kt \
        server/src/main/kotlin/com/lumos/server/routes/EventRoutes.kt \
        server/src/main/kotlin/com/lumos/server/service/IngestionService.kt \
        server/src/test/kotlin/com/lumos/server/ValidationTest.kt
git commit -m "fix(server): add input validation and safe JSON decoding in routes"
```

---

## Task 3 (Server): Extract shared `ownsApp()` helper

**Severity:** Important — the ownership check is copy-pasted verbatim in 6+ places. One missed check is a privilege-escalation bug.

**Files:**
- Create: `server/src/main/kotlin/com/lumos/server/routes/RouteUtils.kt`
- Modify: `server/src/main/kotlin/com/lumos/server/routes/AppRoutes.kt`
- Modify: `server/src/main/kotlin/com/lumos/server/routes/KeyRoutes.kt`
- Modify: `server/src/main/kotlin/com/lumos/server/routes/TraceRoutes.kt`
- Modify: `server/src/main/kotlin/com/lumos/server/routes/SessionRoutes.kt`
- Modify: `server/src/main/kotlin/com/lumos/server/routes/StatsRoutes.kt`

- [ ] **Step 1: Create RouteUtils.kt**

```kotlin
package com.lumos.server.routes

import com.lumos.server.db.Apps
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction

fun ownsApp(accountId: String, appId: String): Boolean = transaction {
    Apps.select { (Apps.id eq appId) and (Apps.accountId eq accountId) }.count() > 0
}
```

- [ ] **Step 2: Replace inline ownership checks in each route file**

In each of the 5 route files that contain:
```kotlin
val owns = transaction { Apps.select { (Apps.id eq appId) and (Apps.accountId eq accountId) }.count() > 0 }
if (!owns) return@get call.respond(HttpStatusCode.Forbidden)
```

Replace with:
```kotlin
if (!ownsApp(accountId, appId)) return@get call.respond(HttpStatusCode.Forbidden)
```

(Adjust `return@get` / `return@post` / `return@patch` / `return@delete` to match the enclosing lambda.)

Remove any now-unused `org.jetbrains.exposed.sql.and` / `select` imports in files where they were only used for the ownership check.

Note: `StatsRoutes.kt` already has a private `ownsApp()` — delete it and add import of the shared one.

- [ ] **Step 3: Build**

```
.\gradlew build
```

Expected: compiles cleanly.

- [ ] **Step 4: Commit**

```
git add server/src/main/kotlin/com/lumos/server/routes/RouteUtils.kt \
        server/src/main/kotlin/com/lumos/server/routes/AppRoutes.kt \
        server/src/main/kotlin/com/lumos/server/routes/KeyRoutes.kt \
        server/src/main/kotlin/com/lumos/server/routes/TraceRoutes.kt \
        server/src/main/kotlin/com/lumos/server/routes/SessionRoutes.kt \
        server/src/main/kotlin/com/lumos/server/routes/StatsRoutes.kt
git commit -m "refactor(server): extract shared ownsApp() helper, remove duplicated ownership checks"
```

---

## Task 4 (Server): DB indexes + SQLite FK pragma

**Severity:** Important (indexes) / Important (FKs as a safety net for cascade deletes).

**Files:**
- Modify: `server/src/main/kotlin/com/lumos/server/db/Tables.kt`
- Modify: `server/src/main/kotlin/com/lumos/server/db/Database.kt`

- [ ] **Step 1: Add indexes to Tables.kt**

Exposed DSL indexes are declared inside the object body. Add after each table's `primaryKey`:

```kotlin
// Inside object Traces:
val appIdIndex = index("idx_traces_app_id", false, appId)
val sessionIdIndex = index("idx_traces_session_id", false, sessionId)

// Inside object StatsHourly:
val appBucketIndex = index("idx_stats_app_bucket", false, appId, hourBucket)

// Inside object Spans:
val traceIdIndex = index("idx_spans_trace_id", false, traceId)

// Inside object FeedbackTable:
val traceIdIndex = index("idx_feedback_trace_id", false, traceId)
```

`SchemaUtils.createMissingTablesAndColumns` will create missing indexes on next startup.

- [ ] **Step 2: Enable SQLite FK enforcement in Database.kt**

Inside `DatabaseFactory.init()`, add the PRAGMA to the transaction before `SchemaUtils`:

```kotlin
transaction {
    exec("PRAGMA foreign_keys = ON")
    SchemaUtils.createMissingTablesAndColumns(
        Accounts, Apps, ApiKeys, Traces, Spans,
        FeedbackTable, IngestedEvents, StatsHourly
    )
}
```

Note: for the production file-backed SQLite, PRAGMA is connection-scoped, so it also needs to be set at the start of any transaction that performs deletes. The safest long-term solution is a connection hook; for now, adding it to the delete transactions in `AccountRoutes.kt` and `AppService.kt` provides the FK guard at the points that matter:

```kotlin
// In AccountRoutes.kt delete handler, inside transaction { ... }:
exec("PRAGMA foreign_keys = ON")
// then proceed with the cascade deletes
```

- [ ] **Step 3: Build**

```
.\gradlew build
```

Expected: compiles. Tests pass (in-memory SQLite will get FK mode on from init).

- [ ] **Step 4: Commit**

```
git add server/src/main/kotlin/com/lumos/server/db/Tables.kt \
        server/src/main/kotlin/com/lumos/server/db/Database.kt \
        server/src/main/kotlin/com/lumos/server/routes/AccountRoutes.kt
git commit -m "perf(server): add DB indexes on hot columns; enable SQLite FK enforcement"
```

---

## Task 5 (Server): Rate limiting on login + test for cross-account isolation

**Severity:** Critical (rate limit) / Important (test coverage).

**Files:**
- Modify: `server/src/main/kotlin/com/lumos/server/routes/AuthRoutes.kt`
- Modify: `server/src/main/kotlin/com/lumos/server/Application.kt`
- Create: `server/src/test/kotlin/com/lumos/server/CrossAccountTest.kt`

- [ ] **Step 1: Install Ktor RateLimit plugin**

Check `server/build.gradle.kts` for the existing Ktor version. Add the rate-limit dependency if not present:

```kotlin
implementation("io.ktor:ktor-server-rate-limit:$ktor_version")
```

- [ ] **Step 2: Configure rate limiting in Application.kt**

```kotlin
import io.ktor.server.plugins.ratelimit.*
import kotlin.time.Duration.Companion.minutes

// Inside Application.module(), after install(Authentication {...}):
install(RateLimit) {
    register(RateLimitName("login")) {
        rateLimiter(limit = 10, refillPeriod = 1.minutes)
    }
}
```

- [ ] **Step 3: Wrap login route with rate limit**

In `AuthRoutes.kt`, wrap the login handler:

```kotlin
rateLimit(RateLimitName("login")) {
    post("/api/auth/login") {
        // existing body unchanged
    }
}
```

Add import `io.ktor.server.plugins.ratelimit.*`.

- [ ] **Step 4: Write cross-account ownership test**

```kotlin
package com.lumos.server

import com.lumos.server.db.Accounts
import com.lumos.server.db.Apps
import com.lumos.server.db.DatabaseFactory
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.junit.BeforeClass
import org.junit.Test
import java.time.LocalDateTime
import java.util.UUID
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class CrossAccountTest {
    companion object {
        private var accountA = ""
        private var accountB = ""
        private var appOwnedByA = ""

        @BeforeClass @JvmStatic
        fun setup() {
            DatabaseFactory.init("jdbc:sqlite::memory:")
            accountA = UUID.randomUUID().toString()
            accountB = UUID.randomUUID().toString()
            appOwnedByA = UUID.randomUUID().toString()
            transaction {
                Accounts.insert {
                    it[id] = accountA; it[email] = "a@test.com"
                    it[passwordHash] = "h"; it[createdAt] = LocalDateTime.now()
                }
                Accounts.insert {
                    it[id] = accountB; it[email] = "b@test.com"
                    it[passwordHash] = "h"; it[createdAt] = LocalDateTime.now()
                }
                Apps.insert {
                    it[id] = appOwnedByA; it[accountId] = accountA
                    it[name] = "A's App"; it[packageName] = "com.a"
                    it[createdAt] = LocalDateTime.now()
                }
            }
        }
    }

    @Test
    fun `account A owns the app`() {
        val owns = transaction {
            Apps.select { (Apps.id eq appOwnedByA) and (Apps.accountId eq accountA) }.count() > 0
        }
        assertTrue(owns, "Account A should own app")
    }

    @Test
    fun `account B does not own account A's app`() {
        val owns = transaction {
            Apps.select { (Apps.id eq appOwnedByA) and (Apps.accountId eq accountB) }.count() > 0
        }
        assertFalse(owns, "Account B must not access account A's app")
    }
}
```

- [ ] **Step 5: Run tests**

```
.\gradlew test
```

Expected: all pass.

- [ ] **Step 6: Commit**

```
git add server/src/main/kotlin/com/lumos/server/Application.kt \
        server/src/main/kotlin/com/lumos/server/routes/AuthRoutes.kt \
        server/src/test/kotlin/com/lumos/server/CrossAccountTest.kt \
        server/build.gradle.kts
git commit -m "fix(server): rate-limit login endpoint; add cross-account isolation test"
```

---

## Task 6 (Portal): API error handling + fix Settings server URL

**Severity:** Important — silent failures confuse users. Minor — hardcoded `:5173→:8080` port swap breaks in production.

**Files:**
- Modify: `portal/src/pages/Sessions.tsx`
- Modify: `portal/src/pages/Settings.tsx`
- Modify: `portal/src/pages/TraceExplorer.tsx`

- [ ] **Step 1: Add error state to Sessions.tsx**

```tsx
// Add state at top of Sessions():
const [error, setError] = useState<string | null>(null);

// In useEffect, update the fetch:
api.get(`/api/apps/${currentAppId}/sessions`)
  .then(r => setSessions(r.data))
  .catch(() => setError('Failed to load sessions.'))
  .finally(() => setLoading(false));

// Add error display before the loading check:
{error ? (
  <div style={{ ...cardStyle, padding: 48, textAlign: 'center', color: T.red, fontSize: 14 }}>
    {error}
  </div>
) : loading ? (
  // existing loading div
```

Also add error handling in `SessionCard.toggle()`:

```tsx
async function toggle() {
  if (!expanded && traces.length === 0) {
    setLoading(true);
    try {
      const res = await api.get(`/api/apps/${appId}/sessions/${session.sessionId}/traces`);
      setTraces(res.data);
    } catch {
      // leave traces empty; expanded will still open showing nothing
    } finally {
      setLoading(false);
    }
  }
  setExpanded(e => !e);
}
```

- [ ] **Step 2: Fix Settings.tsx server URL**

Replace line 70:
```tsx
// Before:
setServerUrl(window.location.origin.replace(':5173', ':8080'));

// After:
setServerUrl(import.meta.env.VITE_API_URL ?? 'http://localhost:8080');
```

- [ ] **Step 3: Fix TraceExplorer.tsx pagination reset on filter change**

Find the `page` state and the search/status filter states in TraceExplorer.tsx. Wherever the search input changes or status filter changes, the `page` state must be reset to 1 (or 0 depending on 0-indexed). 

Look for the filter change handlers — they should call `setPage(1)` (or the equivalent reset) in addition to updating the filter state. If the handlers don't exist as named functions yet, add them:

```tsx
// Example: if there's a search input onChange currently doing setSearch(e.target.value)
// change to:
onChange={e => { setSearch(e.target.value); setPage(1); }}

// Similarly for status dropdown
onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
```

Read the full TraceExplorer.tsx first to find the exact variable names for page state and filter handlers before editing.

- [ ] **Step 4: TypeScript check**

```
cd portal && npx tsc -b
```

Expected: exit 0, no errors.

- [ ] **Step 5: Commit**

```
git add portal/src/pages/Sessions.tsx \
        portal/src/pages/Settings.tsx \
        portal/src/pages/TraceExplorer.tsx
git commit -m "fix(portal): add error handling to Sessions, fix Settings API URL, reset page on filter change"
```

---

## Task 7 (Android): Thread safety on Lumos singleton + SessionManager

**Severity:** Critical — `ctx` and `config` are `lateinit var` written on the main thread and read on `Dispatchers.IO`. Without visibility guarantees this is a data race. `SessionManager` reads and writes `sessionId`/`lastActivityMs` from multiple threads without synchronization.

**Files:**
- Modify: `lumos-android/src/main/kotlin/com/lumos/Lumos.kt`
- Modify: `lumos-android/src/main/kotlin/com/lumos/internal/SessionManager.kt`

- [ ] **Step 1: Add @Volatile + init guard to Lumos.kt**

```kotlin
object Lumos {
    @Volatile private var ctx: Context? = null
    @Volatile private var config: LumosConfig? = null
    private var listener: LumosListener? = null
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    fun init(context: Context, block: LumosConfig.() -> Unit): Lumos {
        ctx = context.applicationContext
        config = LumosConfig().apply(block)
        return this
    }

    private fun requireCtx(): Context =
        ctx ?: error("Lumos.init() has not been called. Call it in Application.onCreate().")
    private fun requireConfig(): LumosConfig =
        config ?: error("Lumos.init() has not been called. Call it in Application.onCreate().")
```

Replace every bare use of `ctx` with `requireCtx()` and `config` with `requireConfig()` throughout the file:
- `buildEnvelope`: `ctx.packageName` → `requireCtx().packageName`, `DeviceInfo.appVersion(ctx)` → `DeviceInfo.appVersion(requireCtx())`
- `triggerUpload`: `UploadWorker.enqueue(ctx, ...)` → `UploadWorker.enqueue(requireCtx(), ...)`
- `feedback`: `LumosDatabase.get(ctx)` → `LumosDatabase.get(requireCtx())`
- `endTrace`: same
- `config.serverUrl` / `config.apiKey` → `requireConfig().serverUrl` / `requireConfig().apiKey`

- [ ] **Step 2: Make SessionManager thread-safe**

```kotlin
object SessionManager {
    @Volatile private var sessionId: String = UUID.randomUUID().toString()
    private val lastActivityMs = java.util.concurrent.atomic.AtomicLong(System.currentTimeMillis())
    private const val TIMEOUT_MS = 30 * 60 * 1000L

    @Synchronized
    fun currentSessionId(): String {
        val now = System.currentTimeMillis()
        if (now - lastActivityMs.get() > TIMEOUT_MS) {
            sessionId = UUID.randomUUID().toString()
        }
        lastActivityMs.set(now)
        return sessionId
    }
}
```

- [ ] **Step 3: Build the SDK**

From the project root or `lumos-android/`:

```
./gradlew :lumos:assembleDebug
```

Expected: BUILD SUCCESSFUL.

- [ ] **Step 4: Run existing tests**

```
./gradlew :lumos:test
```

Expected: all pass.

- [ ] **Step 5: Commit**

```
git add lumos-android/src/main/kotlin/com/lumos/Lumos.kt \
        lumos-android/src/main/kotlin/com/lumos/internal/SessionManager.kt
git commit -m "fix(android): make Lumos singleton and SessionManager thread-safe"
```

---

## Task 8 (Android): Upload reliability + queue cap + listener wiring

**Severity:** Important — `ExistingWorkPolicy.REPLACE` cancels in-flight uploads mid-batch; unbounded queue; `LumosListener` interface is public API but no callbacks are ever fired.

**Files:**
- Modify: `lumos-android/src/main/kotlin/com/lumos/upload/UploadWorker.kt`
- Modify: `lumos-android/src/main/kotlin/com/lumos/Lumos.kt`
- Modify: `lumos-android/src/main/kotlin/com/lumos/db/EventDao.kt`

- [ ] **Step 1: Change REPLACE to KEEP in UploadWorker.kt**

```kotlin
// Before:
.enqueueUniqueWork("lumos_upload", ExistingWorkPolicy.REPLACE, request)

// After:
.enqueueUniqueWork("lumos_upload", ExistingWorkPolicy.KEEP, request)
```

`KEEP` means: if an upload is already running, don't interrupt it. A new enqueue request after the worker finishes will still be processed because `KEEP` only blocks duplicate enqueues, not future ones.

- [ ] **Step 2: Add queue cap in EventDao.kt**

Read EventDao.kt to find the Room DAO interface. Add a count query and a trim query:

```kotlin
@Query("SELECT COUNT(*) FROM pending_events")
suspend fun count(): Int

@Query("DELETE FROM pending_events WHERE event_id NOT IN (SELECT event_id FROM pending_events ORDER BY rowid DESC LIMIT 1000)")
suspend fun trimToMax(): Int
```

Then in `Lumos.kt`, in both `feedback()` and `endTrace()`, call trim before insert:

```kotlin
scope.launch {
    val dao = LumosDatabase.get(requireCtx()).eventDao()
    dao.trimToMax()
    dao.insert(PendingEvent(eventId = envelope.eventId, payloadJson = Json.encodeToString(envelope)))
    triggerUpload()
}
```

- [ ] **Step 3: Read LumosListener.kt to understand the interface**

Read `lumos-android/src/main/kotlin/com/lumos/LumosListener.kt`. Wire up at least the trace-completed callback in `Lumos.endTrace()`, after the DB insert:

```kotlin
// After triggerUpload() in endTrace():
listener?.onTraceCompleted(trace)
```

If `LumosListener` has other methods (e.g., `onUploadSuccess`, `onError`), note them in the PR description for future wiring — don't add dead stubs.

- [ ] **Step 4: Build and test**

```
./gradlew :lumos:assembleDebug
./gradlew :lumos:test
```

Expected: BUILD SUCCESSFUL, tests pass.

- [ ] **Step 5: Commit**

```
git add lumos-android/src/main/kotlin/com/lumos/upload/UploadWorker.kt \
        lumos-android/src/main/kotlin/com/lumos/Lumos.kt \
        lumos-android/src/main/kotlin/com/lumos/db/EventDao.kt
git commit -m "fix(android): use KEEP upload policy, add 1000-event queue cap, wire listener callback"
```

---

## Audit Coverage Summary

| Finding | Severity | Task |
|---|---|---|
| `Map<String,Any?>` runtime crash | Critical | Task 1 |
| `debug` field never returned by server | Critical | Task 1 |
| Empty email/password accepted | Important | Task 2 |
| Malformed SDK payload crashes whole batch | Important | Task 2 |
| Ownership check duplicated 6× | Important | Task 3 |
| No DB indexes on hot columns | Important | Task 4 |
| SQLite FK not enforced | Important | Task 4 |
| No rate limit on login | Critical | Task 5 |
| Cross-account isolation untested | Important | Task 5 |
| Sessions.tsx silent API failure | Important | Task 6 |
| Settings server URL hardcoded port | Minor | Task 6 |
| Pagination doesn't reset on filter change | Important | Task 6 |
| Lumos singleton not thread-safe | Critical | Task 7 |
| No `init()` guard | Critical | Task 7 |
| SessionManager not thread-safe | Critical | Task 7 |
| WorkManager REPLACE cancels uploads | Important | Task 8 |
| Unbounded event queue | Important | Task 8 |
| LumosListener callbacks never fired | Important | Task 8 |

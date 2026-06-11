# AgentLens — Pre-meeting Research / מחקר מקדים

Deep-dive research required before the approval meeting, per the course instructions.

## 1. What data can we extract from an Android device for analytics?

Data we attach to every event envelope — **all available without any dangerous
permission**:

| Data | API | Permission |
|---|---|---|
| Device model & manufacturer | `Build.MODEL`, `Build.MANUFACTURER` | none |
| Android version | `Build.VERSION.SDK_INT`, `RELEASE` | none |
| App version | `PackageManager.getPackageInfo()` → versionName/Code | none |
| Locale & language | `Resources.getConfiguration().locales` | none |
| Screen size/density | `DisplayMetrics` | none |
| Network type (wifi/cellular/offline) | `ConnectivityManager.getNetworkCapabilities()` | `ACCESS_NETWORK_STATE` (normal) |
| Battery level / charging | `BatteryManager` sticky broadcast | none |
| Available memory / low-memory | `ActivityManager.MemoryInfo` | none |
| App foreground/background | `ProcessLifecycleOwner` (androidx.lifecycle) | none |
| Timezone, uptime | `TimeZone.getDefault()`, `SystemClock` | none |

**What we deliberately do NOT collect:** IMEI/serial (blocked since API 29 anyway),
MAC address (randomized since API 23+), `ANDROID_ID`, Advertising ID. Instead the SDK
generates its own random install UUID stored in app-private storage — resettable,
app-scoped, GDPR-friendlier. User identity only via the developer's explicit
`setUser(pseudonymousId)`.

**Relevance to AgentLens:** device model + network type explain latency outliers
("slow agent" may be a 2G connection); app version + prompt version are the axes of
every dashboard comparison; battery/foreground state tune our upload scheduling.

## 2. How do we catch errors and upload before the app/device closes?

The classic hard problem the lecturer hinted at. Findings:

**You cannot reliably perform network I/O at crash time.** When an uncaught exception
reaches the default handler the process is about to die; starting an async HTTP call
usually doesn't complete, and blocking the crashing thread for network is both slow
and may itself be killed.

**The industry pattern (used by Crashlytics/Sentry), which we adopt:**

1. `Thread.setDefaultUncaughtExceptionHandler` — our handler **writes the event to
   disk synchronously** (fast local I/O, milliseconds), then **delegates to the
   previous handler** so normal crash flow (dialog, Play reporting) still happens.
2. On **next app launch**, `AgentLens.init()` finds the pending file/rows and enqueues
   them for upload. Nothing is lost; it's just delayed.
3. For non-fatal cases (app going to background, user swiping the app away):
   `ProcessLifecycleOwner` `ON_STOP` triggers an immediate flush via
   **expedited WorkManager work** (`setExpedited()`), which is the modern replacement
   for foreground-ish urgency and survives the process being killed right after.

**Why WorkManager and not a plain coroutine/Service:**
- Persists the request — if the process dies before upload, WorkManager re-runs it.
- Network constraint (`NetworkType.CONNECTED`) — never wakes up just to fail offline.
- Built-in exponential backoff and dedup via unique work names.
- Respects **Doze mode & App Standby buckets** for us; a custom AlarmManager/Service
  approach would fight the OS and drain battery.

**In AgentLens** this machinery serves two flows: (a) agent **errors** logged via
`trace.logError()` even if the app crashes mid-conversation, and (b) the regular
event queue — every event is in Room *before* any network attempt, so a crash never
loses data, only postpones it.

## 3. On-device storage: why Room?

| Option | Verdict |
|---|---|
| **Room (SQLite)** ✅ | Transactional, indexed FIFO queue, easy size/age trimming (`DELETE WHERE ...`), WAL mode = fast writes, survives crashes mid-write |
| Plain files (one JSON per event) | No transactions, manual corruption handling, slow listing at scale |
| DataStore/SharedPreferences | Key-value, designed for small config — not a queue |
| In-memory only | Loses everything on process death — disqualified |

Sentry and Firebase both use a disk-backed queue for exactly this reason. Our schema:
one `pending_events` table (id, created_at, size_bytes, payload_json) with an index on
`created_at` for FIFO batching and trimming.

## 4. Sending efficiently: batching, gzip, and battery

- Radio wake-ups dominate battery cost — sending 1 event at a time is the worst
  pattern. Batching 50 events per request amortizes the radio window.
- Telemetry JSON is highly repetitive → **gzip gives ~10x compression** on event
  batches; OkHttp supports it with an interceptor.
- Flush triggers: batch full / 10s timer while foregrounded / app backgrounded /
  explicit `flush()`. While backgrounded we do **nothing** except the WorkManager
  job — no timers fighting Doze.
- Idempotency: server dedups by `event_id`, so "retry after timeout" (did the server
  get it or not?) is safe — at-least-once delivery + dedup = effectively-once.

## 5. LLM-as-judge: why sampled, and how scored

- Research practice (G-Eval, MT-Bench style): an LLM grades a response on a rubric
  (helpfulness, correctness, groundedness) with a 1–5 score + rationale; correlates
  reasonably with human judgment when the rubric is narrow.
- Judging costs an LLM call per trace → we **sample** (default 10%, portal-configurable)
  and run it **server-side only**: keeps the judge API key out of the APK, lets us
  swap judge models centrally, and adds zero client latency.
- Known biases to design around: verbosity bias (judges favor long answers) and
  self-preference; mitigation = pinned judge model + rubric prompts versioned in the
  server, plus the deterministic stub for reproducible course demos.
- On-device heuristics (refusal regexes, empty output, latency thresholds, tool-call
  loops) are free and run on 100% of traces — the judge adds depth on the sample.

## 6. Server-side: why pre-aggregation is the retrieval strategy

- Naive dashboards (`SELECT AVG(...) FROM traces WHERE ...`) degrade linearly with
  data volume; at millions of rows every portal load becomes a full scan.
- The standard analytics pattern (Mixpanel/Amplitude architecture talks, OLAP rollups):
  maintain **incrementally-updated aggregate tables** keyed by
  (app, environment, feature, prompt_version, hour). Ingestion does +1/+sum UPSERTs;
  dashboards read a few hundred rollup rows regardless of raw volume.
- Percentiles can't be summed exactly → store latency sum (for averages) plus a
  cheap p95 estimate per bucket (fixed-bound histogram buckets); exact percentiles
  available via raw-table drill-down within the retention window.
- Trace explorer pagination: **keyset pagination** (`WHERE started_at < cursor
  ORDER BY started_at DESC LIMIT 50` on an `(app_id, started_at)` index) instead of
  OFFSET, which re-scans skipped rows and breaks when new data arrives.

## 7. API key security (portal side)

- Store only **SHA-256 hashes** of keys; show the secret once at creation
  (GitHub/Stripe model). A leaked DB doesn't leak keys.
- Key format `al_<env>_<32 random chars>` — prefix enables environment routing and
  secret-scanning patterns.
- Revocation must be fast: in-memory key cache with short TTL + explicit invalidation,
  and a kill-switch flag in `/v0/config` so revoked SDK installs stop sending.
- Accepted course-scope risk: an API key embedded in an APK is extractable (true for
  every client SDK — Firebase included). Mitigations in scope: package-name pinning
  per key + server-side validation; out of scope: Play Integrity attestation (noted
  as a stretch goal).

## Sources / further reading

- Android docs: WorkManager (expedited work, constraints), Doze & App Standby,
  ProcessLifecycleOwner, privacy changes (device identifiers, API 29+).
- Sentry Android SDK & Firebase Crashlytics docs — crash capture + offline queue design.
- Mixpanel/Amplitude engineering blogs — event ingestion and pre-aggregation patterns.
- "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena" (Zheng et al., 2023) —
  LLM-judge agreement rates and biases.

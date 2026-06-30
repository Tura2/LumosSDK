# <img src="portal/public/lumos-icon.png" width="32" alt="Lumos" /> LumosSDK — AI Observability for Android

*Trace every AI conversation in your app. Visualize it in your own self-hosted portal.*

![Kotlin](https://img.shields.io/badge/Kotlin-7F52FF?style=flat-square&logo=kotlin&logoColor=white)
![Android](https://img.shields.io/badge/Android-3DDC84?style=flat-square&logo=android&logoColor=white)
![Ktor](https://img.shields.io/badge/Ktor-0095D5?style=flat-square&logo=kotlin&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)

---

## What is LumosSDK?

LumosSDK is an open-source observability toolkit for Android apps powered by AI.
Drop the SDK in, and every AI call — prompt, response, model, latency, token cost, user feedback — flows automatically to a dashboard you host yourself.

| Property | Detail |
| --- | --- |
| **No third-party cloud** | Your conversation data never leaves your server |
| **Two-line setup** | `Lumos.init(context) { apiKey = "..."; serverUrl = "..." }` |
| **Full-stack** | Android SDK + Ktor backend + React portal, all in one repo |
| **Langfuse-inspired** | Same concept, built specifically for mobile AI apps |

---

## Features

### Android SDK (`lumos-android`)

- **One-line init** — `Lumos.init(context) { ... }` in `Application.onCreate()`
- **Trace AI calls** — capture prompt, response, model, token counts, latency
- **Span tracking** — instrument multi-step pipelines (retrieval, tool calls, etc.)
- **User feedback** — thumbs up/down tied directly to a trace
- **Offline-first** — events queue in a local Room database; WorkManager uploads when connected
- **Idempotent delivery** — exponential backoff + server-side dedup, no duplicates
- **Device context** — auto-attaches device model, Android version, app version

### Server (`server`)

- **Dual auth** — API key (`X-Lumos-Key`) for SDK ingestion, JWT for the portal
- **Idempotency** — `ingested_events` table prevents duplicate processing
- **Pre-aggregated stats** — `stats_hourly` rollup table; dashboard never scans raw traces
- **Session grouping** — traces are grouped by session ID for conversation replay
- **OpenRouter proxy** — built-in demo chat endpoint

### Portal (`portal`)

- **Dashboard** — total calls, error rate, avg latency, token spend, thumbs up/down
- **7-day trend** — compare current week vs. previous week for every metric
- **24-hour chart** — per-hour call volume for the last 24 hours
- **Trace Explorer** — full prompt/reply, span timeline, device info, feedback per trace
- **Session view** — replay all traces in a user session in order
- **API Key management** — create, revoke, last-used timestamps

---

## Screenshots

| Dashboard | Trace Detail | API Keys |
| --------- | ------------ | -------- |
| ![Dashboard](screenshots/dashboard-v4.png) | ![Trace](screenshots/v2-trace-detail.png) | ![Keys](screenshots/v2-keys.png) |

| Traces List | Login |
| ----------- | ----- |
| ![Traces](screenshots/final-traces.png) | ![Login](screenshots/final-login.png) |

---

## Architecture

```mermaid
graph TD
    subgraph "Android App"
        App["Host App Code"]
        SDK["Lumos SDK\n(lumos-android)"]
        Room[("Room DB\nLocal Queue")]
        WM["WorkManager\nUploadWorker"]
    end

    subgraph "Ktor Server :8080"
        Ingest["Ingestion API\nPOST /v0/events"]
        PortalAPI["Portal API\nGET|POST /api/**"]
        DB[("SQLite\nlumos.db")]
    end

    subgraph "Web Browser"
        Portal["React Portal\n(Vite + TypeScript)"]
    end

    App -- "startTrace / feedback" --> SDK
    SDK -- "insert PendingEvent" --> Room
    Room -- "nextBatch(50)" --> WM
    WM -- "POST /v0/events\nX-Lumos-Key" --> Ingest
    Ingest -- "write traces + spans\nupdate stats_hourly" --> DB
    Portal -- "JWT Bearer\nGET/POST /api/**" --> PortalAPI
    PortalAPI -- "read stats, traces" --> DB
```

### Data Flow — Ingestion

```mermaid
sequenceDiagram
    participant App as Android App
    participant SDK as Lumos SDK
    participant Room as Room DB
    participant WM as WorkManager
    participant Server as Ktor Server
    participant DB as SQLite

    App->>SDK: trace.end()
    SDK->>Room: insert PendingEvent (eventId = UUID)
    WM->>Room: nextBatch(50)
    Room-->>WM: [PendingEvent...]
    WM->>Server: POST /v0/events [batch JSON]
    Server->>Server: KeyService.verify(X-Lumos-Key)
    Server->>DB: check ingested_events (dedup)
    Server->>DB: INSERT traces / spans
    Server->>DB: UPSERT stats_hourly
    Server-->>WM: 200 OK { accepted: N }
    WM->>Room: deleteByIds(batch)
```

---

## API Endpoints

### SDK Ingestion — `X-Lumos-Key` header

```mermaid
flowchart LR
    SDK[Android SDK] -->|POST| E1["/v0/events\nBatch ingest traces, spans, feedback"]
    SDK -->|GET| E2["/v0/config\nValidate key · fetch remote config"]
    SDK -->|POST| E3["/v0/demo/chat\nOpenRouter proxy for demo app"]
```

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| `POST` | `/v0/events` | API Key | Ingest a batch of `TRACE` / `SPAN` / `FEEDBACK` envelopes |
| `GET` | `/v0/config` | API Key | Verify the key and return active config |
| `POST` | `/v0/demo/chat` | API Key | Proxy chat completion to OpenRouter |

### Portal API — `Authorization: Bearer <JWT>`

```mermaid
flowchart LR
    Portal[React Portal]

    Portal -->|POST| A1["/api/auth/register"]
    Portal -->|POST| A2["/api/auth/login\n→ JWT"]

    Portal -->|GET| B1["/api/apps\nList apps"]
    Portal -->|POST| B2["/api/apps\nCreate app"]
    Portal -->|PATCH| B3["/api/apps/{appId}\nUpdate app"]
    Portal -->|DELETE| B4["/api/apps/{appId}\nDelete app"]

    Portal -->|GET| C1["/api/apps/{appId}/keys"]
    Portal -->|POST| C2["/api/apps/{appId}/keys\nCreate key"]
    Portal -->|DELETE| C3["/api/apps/{appId}/keys/{keyId}\nDelete key"]
    Portal -->|DELETE| C4["/api/keys/{keyId}\nRevoke key"]

    Portal -->|GET| D1["/api/apps/{appId}/traces\nList last 50"]
    Portal -->|GET| D2["/api/traces/{traceId}\nTrace detail + spans + feedback"]

    Portal -->|GET| E1["/api/apps/{appId}/stats\nAll-time totals + 7-day trend"]
    Portal -->|GET| E2["/api/apps/{appId}/stats/hourly\n24-hour chart data"]

    Portal -->|GET| F1["/api/apps/{appId}/sessions\nList sessions"]
    Portal -->|GET| F2["/api/apps/{appId}/sessions/{sessionId}/traces"]
```

---

## How to Implement in Your Project

### Step 1 — Add the SDK

In your root `settings.gradle.kts`, include the local build:

```kotlin
includeBuild("../lumos-android")
```

In your `app/build.gradle.kts`:

```kotlin
dependencies {
    implementation("com.lumos:lumos-android:0.1.0")
}
```

Add the internet permission to `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

### Step 2 — Initialize once

```kotlin
class MyApp : Application() {
    override fun onCreate() {
        super.onCreate()
        Lumos.init(this) {
            apiKey    = "lms_abc123..."           // copied from the portal
            serverUrl = "https://your-server.com"
        }
    }
}
```

### Step 3 — Start the server

```bash
cd server

# Required env vars
export JWT_SECRET="a-long-random-secret"
export OPENROUTER_API_KEY="sk-or-..."

gradle run          # starts on :8080
```

### Step 4 — Open the portal

```bash
cd portal
npm install
VITE_API_URL=http://localhost:8080 npm run dev
```

Register an account, create an app, generate an API key — paste it into Step 2.

---

## How to Use

### Trace a single AI call

```kotlin
val trace = Lumos.startTrace("support-chat")

trace.logPrompt(userMessage)

val reply = myAIClient.complete(userMessage)   // your existing AI call

trace.logResponse(
    text      = reply,
    model     = "gpt-4o-mini",
    tokensIn  = 200,
    tokensOut = 80,
    latencyMs = 1200,
)
trace.end()
```

### Trace a multi-step pipeline with spans

```kotlin
val trace = Lumos.startTrace("rag-pipeline")
trace.logPrompt(query)

val retrieval = trace.startSpan("vector-retrieval")
val docs = vectorStore.search(query)
retrieval.end()

val llmCall = trace.startSpan("llm-completion")
val answer = llm.complete(query, docs)
llmCall.end()

trace.logResponse(answer, model = "gpt-4o", tokensIn = 800, tokensOut = 150)
trace.end()
```

### Capture user feedback

```kotlin
// When the user taps 👍
Lumos.feedback(trace.id, Feedback.ThumbsUp)

// When the user taps 👎
Lumos.feedback(trace.id, Feedback.ThumbsDown)
```

### Handle errors

```kotlin
val trace = Lumos.startTrace("classification")
trace.logPrompt(input)
try {
    val result = aiClient.classify(input)
    trace.logResponse(result, model = "gpt-4o-mini")
    trace.end()
} catch (e: Exception) {
    trace.logError(e)
    trace.end()
}
```

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Android SDK | Kotlin · Room (local queue) · WorkManager (upload) · kotlinx.serialization |
| Server | Ktor · Exposed ORM · SQLite · JWT (HMAC-256) · BCrypt |
| Portal | React 19 · TypeScript · Vite · Recharts · Axios |
| Auth (SDK) | API key — stored SHA-256 hashed in DB, sent in `X-Lumos-Key` header |
| Auth (Portal) | JWT — signed HMAC-256, `accountId` claim, 24h expiry |

---

**Author:** Offir Tura

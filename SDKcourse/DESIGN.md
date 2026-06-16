# LumosSDK — Architecture & Design

> Full design spec: `docs/superpowers/specs/2026-06-11-lumos-sdk-design.md`
> This file is the quick reference summary.

## Architecture

```text
Android App
  └── LumosSDK (Kotlin)
        │  Room DB (offline queue)
        │  WorkManager (batch upload)
        │  HTTPS + X-Lumos-Key
        ▼
  Oracle VPS — Ktor Server
        │  SQLite via Exposed
        │  JWT auth for portal
        │  OpenRouter proxy for demo
        ▼
  Lumos Portal (React + Vite)
```

## SDK public API

| Function | Purpose |
|---|---|
| `Lumos.init(context) { apiKey, serverUrl }` | Initialize once |
| `Lumos.startTrace(feature)` | Begin recording a conversation |
| `trace.logPrompt(text)` | Record user message |
| `trace.logResponse(text, model, tokensIn, tokensOut, latencyMs)` | Record AI reply + metrics |
| `trace.startSpan(name)` / `span.end()` | Record a tool call |
| `trace.logError(throwable)` | Record a failure |
| `trace.end(status)` | Close trace — OK / ERROR / ABANDONED |
| `Lumos.feedback(traceId, Feedback)` | Attach ThumbsUp or ThumbsDown |
| `Lumos.flush()` | Force-send all queued events |
| `Lumos.shutdown()` | Clean shutdown |
| `Lumos.setListener(listener)` | Callbacks: onFlushSuccess, onFlushError |

## Data model (key tables)

```text
traces     (trace_id, app_id, feature, input, output, model, tokens_in, tokens_out, latency_ms, status, started_at)
spans      (span_id, trace_id, name, duration_ms)
feedback   (id, trace_id, kind)
api_keys   (id, app_id, name, key_hash, created_at, last_used_at, revoked_at)
stats_hourly (app_id, feature, hour_bucket, ...counters)
```

## Server endpoints

```text
-- SDK (X-Lumos-Key auth)
POST /v0/events
GET  /v0/config
POST /v0/demo/chat

-- Portal (JWT auth)
POST /api/auth/login
GET|POST /api/apps
GET|POST /api/apps/:id/keys
DELETE   /api/keys/:id
GET /api/apps/:id/stats
GET /api/apps/:id/traces
GET /api/traces/:traceId
```

## Milestones

1. SDK core — Room queue + WorkManager uploader
2. Server ingestion + JWT auth + API key CRUD
3. Tracing + feedback API + demo chat app (OpenRouter proxy)
4. Portal — dashboard + trace explorer + key management
5. Polish — offline edge cases, README, demo prep

# LumosSDK — AI Agent Observability for Android

> "Langfuse, but for Android" — trace every AI conversation in your app, see it all in a web portal.

## What it does

Drop LumosSDK into your Android app. Every AI conversation — what the user asked, what the AI replied, what tools were called, how fast, how much it cost, and whether the user was happy — flows to your portal automatically.

## The two deliverables

### 1. `lumos-android` — Kotlin SDK

```kotlin
// Initialize once in Application.onCreate()
Lumos.init(context) {
    apiKey = "lms_abc123..."
    serverUrl = "https://your-vps.com"
}

// Wrap every AI call
val trace = Lumos.startTrace("support-chat")
trace.logPrompt(userMessage)
val reply = callMyAI(userMessage)
trace.logResponse(reply, model = "gpt-4o-mini", tokensIn = 200, tokensOut = 80, latencyMs = 1200)
trace.end()

// User feedback
Lumos.feedback(trace.id, Feedback.ThumbsUp)
```

### 2. Lumos Portal — web dashboard

- **Dashboard** — conversations, latency, cost, thumbs up/down ratio, charts over time
- **Trace Explorer** — drill into any conversation: full prompt/reply, tool calls timeline, metrics, feedback
- **API Keys** — create and revoke keys

## Repo layout

```text
lumos-android/       Kotlin Android SDK (the course deliverable)
server/              Ktor backend — ingestion API + portal API + OpenRouter proxy
portal/              React + Vite web frontend
demo-app/            Compose demo chat app, fully instrumented
docs/                Design docs and specs
```

## Reference

- Full design: `docs/superpowers/specs/2026-06-11-lumos-sdk-design.md`
- Technical research: `RESEARCH.md`

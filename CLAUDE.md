# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**LumosSDK — "Langfuse for Android."** An Android SDK traces every AI conversation in a host app and ships the data to a self-hosted backend; a web portal visualizes it. Four independent components live side by side (there is **no root build** — each is its own project):

| Dir | Stack | Role |
|-----|-------|------|
| `lumos-android/` | Kotlin, Gradle | The SDK that host apps embed. Queues events locally (Room) and uploads via WorkManager. |
| `server/` | Ktor + Exposed + SQLite | Ingestion API (for SDKs) **and** portal API (for the web app) + an OpenRouter chat proxy. |
| `portal/` | React 19 + Vite + TS | Web dashboard (Dashboard, Traces, API Keys, Apps). |
| `demo-app/` | Jetpack Compose | A fully-instrumented chat app that exercises the SDK. |

## Commands

**Server** (run from `server/`):
- `gradle build` — compile + run all tests. `gradle test --tests "com.lumos.server.KeyServiceTest"` for one class.
- `gradle run` — start on `:8080`. **Requires env vars `JWT_SECRET` and `OPENROUTER_API_KEY`** (see `src/main/resources/application.conf`); the app fails to boot without them.
- Tests use in-memory SQLite (`DatabaseFactory.init("jdbc:sqlite::memory:")` in a `@BeforeClass`) and exercise services/DB directly — see `KeyServiceTest` as the pattern.

**Portal** (run from `portal/`):
- `npm run dev` — Vite dev server. `npm run build` — `tsc -b && vite build`. `npm run lint`.
- **There is no test runner.** The correctness gate is `npx tsc -b` (must exit 0).
- Backend URL comes from `VITE_API_URL` (defaults to `http://localhost:8080`).

**Android** (`lumos-android/`, `demo-app/`): standard Android Gradle; needs the Android SDK. `demo-app` reads `LUMOS_API_KEY` from `local.properties` into `BuildConfig`.

**Gradle note:** no Gradle wrapper (`gradlew`) is committed. Gradle 8.11.1 is installed locally but may not be on PATH — either add it, or run `gradle wrapper` once in `server/` to generate `./gradlew`.

## Architecture (the parts that span files)

**Two auth schemes, by audience — do not mix them:**
- **SDK ingestion** authenticates with an **API key** in the `X-Lumos-Key` header. Keys are stored SHA-256–hashed (`KeyService`); `verify()` resolves a key to its `appId` and stamps `lastUsedAt`. Routes: `/v0/events`, `/v0/config`, `/v0/demo/chat`.
- **Portal** authenticates with a **JWT** (HMAC256, `accountId` claim) under the `"jwt"` auth scheme. Routes: `/api/**`. `Login.tsx` stores the token in `localStorage.lumos_token`; the axios interceptor in `api/client.ts` attaches it and redirects to `/login` on 401/403.

**Ingestion & stats pipeline** (`IngestionService`): the SDK sends a list of `IncomingEnvelope`s (common metadata + a JSON `payload`). `type` is `TRACE | SPAN | FEEDBACK`; the payload is decoded per type and written to `traces`/`spans`/`feedback`. **Idempotency** is enforced via the `ingested_events` table (duplicate `eventId`s are skipped). Crucially, **dashboard metrics are NOT computed from raw traces** — every trace/feedback also increments a pre-aggregated row in `stats_hourly` keyed by `(appId, feature, hourBucket)`. Stats endpoints read these rollups, never the raw tables.

**Database** (`db/`): Exposed tables over a single SQLite file (`lumos.db`). The schema is created/migrated at boot by `SchemaUtils.createMissingTablesAndColumns(...)` in `DatabaseFactory.init()`. **Any new column you add to an existing table must be `.nullable()`** — SQLite cannot add a non-null column without a default to a populated table.

**Multi-tenancy:** an account owns apps; an app owns keys/traces/stats. **Every `/api/apps/{appId}/...` handler must verify ownership** (the app's `accountId` equals the JWT `accountId` claim) and return `403` otherwise. This check is currently repeated inline in each route.

## Gotchas worth knowing

- **kotlinx-serialization, not Jackson.** Responding with `Map<String, Any?>` (mixed value types) throws at runtime — there is no serializer for `Any` — producing a 500. Use `@Serializable` data classes (or homogeneous maps like `Map<String,String>`) for every response body.
- The portal historically shipped a **mock-data fallback** (`api/mockData.ts`) that masks a dead backend, so broken/unimplemented endpoints can look fine in the browser. Verify real backend responses, not just the rendered UI.

## Active work

A go-live effort is planned in `docs/superpowers/`:
- Design spec: `docs/superpowers/specs/2026-06-18-portal-go-live-design.md`
- Implementation plan (execute task-by-task): `docs/superpowers/plans/2026-06-18-portal-go-live.md`

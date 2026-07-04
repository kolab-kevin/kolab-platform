# Live Intelligence Architecture

Architecture for KOLAB Live Intelligence and Gifter Analytics.

**Status:** Partially implemented (sessions, events, gifter rollups, timeline/replay, deterministic trigger analysis, deterministic session summary, deterministic coach recommendations, deterministic coach alerts, deterministic intelligence engine)

---

## Context

### Prerequisites

- Organization-scoped identity (Release 0.2)
- Creator profiles and agency management (Release 0.3)
- Campaign foundation (Release 0.4) — optional session linkage
- Future TikTok Live / platform webhook or polling integration

### Problem

Live gifting behavior is opaque without a normalized event timeline, gifter identity graph, and AI-assisted pattern detection. KOLAB needs a dedicated intelligence layer that ingests platform signals, builds gifter profiles, and produces coaching insights without violating platform terms or privacy law.

---

## Logical architecture

```text
┌──────────────────┐     ┌─────────────────────────────┐     ┌─────────────────────┐
│ Platform ingest  │────▶│  @kolab/api                 │────▶│ PostgreSQL (Prisma) │
│ (TikTok webhooks │     │  LiveIntelligence module    │     │ LiveSession         │
│  future workers) │     │  ├─ SessionsController      │     │ LiveEvent           │
└──────────────────┘     │  ├─ EventsIngestController  │     │ GifterProfile       │
                         │  ├─ TimelineController       │     │ TriggerAnalysis     │
┌──────────────────┐     │  └─ GifterProfilesController│     └─────────────────────┘
│ ai-services      │◀───▶│         │                   │              │
│ (batch + stream) │     │         ▼                   │              ▼
└──────────────────┘     │  AuditService (existing)  │     Redis (hot timeline
                         │  Organization RBAC          │      cache, optional)
                         └─────────────────────────────┘
```

Ingest may later move to a dedicated worker (`apps/ai-services` or `packages/streaming` adapter) while the API remains the org-scoped read/write boundary.

---

## Key architecture decisions

| Decision               | Choice                                          | Rationale                                            |
| ---------------------- | ----------------------------------------------- | ---------------------------------------------------- |
| Tenancy                | All rows keyed by `organizationId`              | Consistent with CRM and campaigns                    |
| Session anchor         | `LiveSession` is root entity                    | Timeline, gifts, and analysis attach to one session  |
| Event model            | Append-only `LiveEvent` stream                  | Immutable audit trail; analysis is derived           |
| Gifter identity        | Platform + external ID unique per org           | Display names change; IDs stable                     |
| Transcripts            | Segmented ASR rows with `startedAt`/`endedAt`   | Align to timeline without storing full audio v1      |
| AI placement           | `ai-services` for inference; API stores results | Keeps `@kolab/api` thin; GPU workloads isolated      |
| Real-time coach        | WebSocket or SSE from API; AI via queue         | Low-latency path separate from batch summary         |
| Correlation disclaimer | Stored on every `TriggerAnalysis` row           | Product/legal requirement                            |
| No raw video v1        | Timeline + metadata only                        | Cost, compliance, platform constraints               |
| Credits gating         | Premium AI features consume credits             | See [Token economy architecture](./token-economy.md) |

---

## Module boundaries

| Module               | Responsibility                                                           | Out of scope            |
| -------------------- | ------------------------------------------------------------------------ | ----------------------- |
| **LiveIntelligence** | Sessions, schedules, events, timeline, gifter profiles, analysis results | Payments, token minting |
| **Campaigns**        | Campaign metadata; optional FK on sessions                               | Gift analytics logic    |
| **Creators**         | Creator profile linkage                                                  | Platform OAuth          |
| **AI Services**      | Model inference, summarization, trigger scoring                          | Org RBAC enforcement    |
| **Audit**            | Access and ingestion audit events                                        | Business analytics      |

---

## Event ingestion flow

```text
1. Platform webhook / poller receives raw payload
2. Ingest adapter validates signature + org + creator mapping
3. Normalizer maps to LiveEventType enum + JSON payload
4. Events written append-only (idempotent by platformEventId)
5. Rollup worker/API updates GifterProfile + GifterSessionStats (checkpoint on session metadata)
6. On session end: enqueue post-live analysis job
7. ai-services returns TriggerAnalysis + summary → persisted
8. Audit: live.event.ingested, live.analysis.completed
```

Idempotency key: `(organizationId, platform, platformEventId)` for ingest; rollup checkpoint uses processed `live_events.id` values on `LiveSession.metadata.gifterRollup`.

### Gifter rollup processing (implemented)

`POST /api/live/sessions/:sessionId/rollups/gifters` scans supported event types for a session, applies incremental rollups to `GifterProfile` and `GifterSessionStats`, and updates session gift totals. Safe to rerun — already-processed event IDs are skipped via session metadata checkpoint. Chat payloads increment counts only; message text is never persisted on profile rows.

---

## Event timeline model

All live signals normalize into a single ordered stream:

| Event type (planned)       | Source                  | Timeline use             |
| -------------------------- | ----------------------- | ------------------------ |
| `SESSION_STARTED`          | Platform / manual       | Anchor                   |
| `SESSION_ENDED`            | Platform / manual       | Close analysis window    |
| `CHAT_MESSAGE`             | Platform chat           | Banter triggers          |
| `GIFT_RECEIVED`            | Platform gifts          | Primary outcome metric   |
| `VIEWER_JOINED`            | Platform (if available) | Audience build-up        |
| `VIEWER_LEFT`              | Platform (if available) | Drop-off                 |
| `VOICE_TRANSCRIPT_SEGMENT` | ASR pipeline            | Singing/speech detection |
| `PERFORMANCE_MOMENT`       | Manual tag or AI        | Song/dance markers       |
| `PK_STARTED` / `PK_ENDED`  | Platform                | Battle triggers          |
| `CREATOR_ACKNOWLEDGEMENT`  | AI or manual tag        | Shoutout moments         |
| `EMOTIONAL_MOMENT`         | AI or manual tag        | Story peaks              |

Timeline API merges events by `occurredAt` with stable tie-breaking on `id`.

---

## Gift trigger analysis approach

### Deterministic analysis (implemented)

`POST /api/live/sessions/:sessionId/analysis/triggers` scans the append-only timeline and stores results in `LiveSession.metadata.triggerAnalysis`. Original `LiveEvent` rows are never mutated.

Rules v1 use fixed 30s offset windows after anchor events (song, dance, performance, PK, creator acknowledgement markers) plus gift spike and high-value gift detection. Each item includes:

- `confidenceScore` (0.0–1.0) from deterministic heuristics
- `relatedEventIds` / `evidence` linking anchor and gift events
- Fixed disclaimer: patterns are correlational, not causal

`GET /api/live/sessions/:sessionId/analysis/triggers` reads the stored snapshot. Regenerating replaces the prior analysis (idempotent storage key).

### AI-assisted analysis (planned)

1. **Windowing** — Sliding windows (e.g. 30s, 60s, 120s) before each gift or gift cluster
2. **Feature extraction** — Recent event types, transcript keywords, performance tags, PK state
3. **Scoring** — Model or rules engine outputs trigger category + confidence
4. **Aggregation** — Roll up to gifter profile and creator session summaries
5. **Human-readable output** — Coaching suggestions with evidence links to timeline offsets

### Correlation vs causation

Every analysis record includes:

- `confidenceScore` (0.0–1.0)
- `evidenceEventIds[]`
- `disclaimer`: fixed string warning that patterns are correlational
- `sampleSize` — insufficient data → suppress or downgrade confidence

### Gifter clusters (planned)

Unsupervised or rule-based segments:

- **Whales** — top spend tier, high session frequency
- **Song supporters** — high response to singing triggers
- **PK warriors** — gift spikes during battles
- **Late joiners** — gifts in final stream segment
- **One-time** — single session, no return

---

## Real-time AI coach (later phase)

```text
Live events → Redis stream → coach worker → ai-services (small model)
                                    ↓
                            SSE to creator/agency UI
                                    ↓
                            Rate-limited; credits debited per alert batch
```

Constraints:

- Sub-second not guaranteed; target < 10s latency
- No automated chat responses to viewers without explicit creator opt-in
- Alerts are suggestions only

---

## Post-live summary

### Deterministic summary (implemented)

`POST /api/live/sessions/:sessionId/summary` builds a structured summary from:

1. Live session rollup fields
2. Append-only timeline events and deterministic highlights
3. Gifter session stats (when rollups exist)
4. Stored `metadata.triggerAnalysis` (when generated)

Results are stored on `LiveSession.metadata.liveSummary`. Outputs include top moments, top gifts, top gifters, trigger summary, timeline health, deterministic coaching notes, and compliance warnings. No raw chat/transcript text is returned.

### AI-enhanced summary (planned)

Future batch/AI layer may add narrative coaching on top of the deterministic summary without replacing the rule-based foundation.

---

## Coach recommendation engine (implemented)

`POST /api/live/sessions/:sessionId/recommendations` builds structured coaching recommendations from:

1. Live session rollups and metadata snapshots
2. Timeline events and deterministic highlights
3. Stored trigger analysis and session summary signals
4. Gifter session stats, creator schedules, and whale retention context

Results are stored on `LiveSession.metadata.recommendations`. Each recommendation includes type, priority, confidence score, title, description, and supporting evidence. Rules are fully deterministic — no LLM or external AI calls.

Recommendation types include music/PK engagement, viewer welcome prompts, supporter thank-yous, break reminders, schedule consistency, campaign promotion, and whale follow-up.

---

## Coach alerts (implemented)

`POST /api/live/sessions/:sessionId/coach/alerts` converts recommendation signals and live session intelligence into actionable alert snapshots stored on `LiveSession.metadata.coachAlerts`.

Inputs include:

1. Stored recommendations (`metadata.recommendations`)
2. Recent timeline events (gift velocity, viewer spikes, high-value gifts)
3. Gifter rollups (top gifter activity)

Outputs are deterministic alert records with priority, confidence, recommended action, optional recommendation linkage, and related event IDs. No websocket/SSE delivery or AI calls in v1.

Future real-time coach streaming will consume these alert snapshots without replacing the rule-based foundation.

---

## Live Intelligence Engine (implemented)

`POST /api/live/sessions/:sessionId/intelligence` builds a single consolidated snapshot from existing Live Intelligence layers:

1. Live session rollups
2. Timeline events and highlights
3. Gifter rollups
4. Trigger analysis (stored or inline)
5. Session summary (stored or inline)
6. Recommendations and coach alerts when available

Results are stored on `LiveSession.metadata.intelligenceSnapshot`. The engine is deterministic v1 — no external AI calls, no raw chat/transcript output, and all insights use correlational language.

The snapshot is designed as structured input for future AI Coach features and agency dashboards. Missing upstream data reduces confidence via `dataQualityWarnings` instead of failing generation.

---

## Agency-level analytics

Read models (materialized views or nightly rollups):

- Gift volume by creator, campaign, week
- Top trigger categories org-wide
- Gifter retention and whale concentration
- Coach suggestion adoption (future)

Scoped to `organizationId`; managers see all creators; recruiters see assigned roster only (policy TBD).

---

## Privacy and compliance (technical)

| Control      | Implementation plan                                                   |
| ------------ | --------------------------------------------------------------------- |
| Minimization | Ingest schema whitelist per event type                                |
| Retention    | `retentionExpiresAt` on sessions; cron purge                          |
| Encryption   | At rest (DB); TLS in transit                                          |
| Access       | `live:read`, `live:write`, `live:admin` permissions                   |
| Audit        | `live.session.viewed`, `live.gifter.viewed`, `live.summary.generated` |
| Deletion     | Cascade org delete; gifter erasure job on request                     |
| Regional     | Data residency flag on org settings (future)                          |

Platform ToS compliance is enforced at ingest adapter — reject unsupported scrape sources.

---

## Integration points

| System               | Integration               |
| -------------------- | ------------------------- |
| `@kolab/api`         | Primary REST boundary     |
| `ai-services`        | Inference jobs            |
| `packages/analytics` | Rollup exports            |
| `packages/streaming` | Ingest adapters           |
| `packages/types`     | Shared enums and DTOs     |
| TikTok Live API      | Future official connector |

---

## Recommended phases

See [Product — Live Intelligence](../product/live-intelligence.md#recommended-implementation-phases).

---

## Related docs

- [Product plan](../product/live-intelligence.md)
- [Database ERD](../database/live-intelligence-erd.md)
- [API planning](../api/live-intelligence.md)
- [Token economy architecture](./token-economy.md)

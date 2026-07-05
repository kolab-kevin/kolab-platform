# Kōlab Event Taxonomy

<!-- markdownlint-disable MD024 -->

**Purpose:** Canonical classification of platform events — live timeline signals, domain lifecycle events, audit records, and planned future families. All producers and consumers must use these conventions for consistent ingestion, rollups, and privacy controls.

**Related:** [Decision Log — ADR-0002](../architecture/decision-log.md#adr-0002-append-only-live-events) · [Live Intelligence API](../api/live-intelligence.md) · [Data Dictionary](./data-dictionary.md) · [Audit logs API](../api/audit-logs.md)

**Naming convention (global):** `SCREAMING_SNAKE_CASE` enums for stored types; dot-separated strings for audit actions (for example `creator.goals.created`).

---

## Live Events

**Purpose:** Append-only timeline records for a `LiveSession` — gifts, chat, viewers, and session lifecycle markers.

**Naming conventions:** `LiveEventType` enum values such as `GIFT_RECEIVED`, `CHAT_MESSAGE`, `VIEWER_JOINED`, `VIEWER_LEFT`, `SESSION_STARTED`, `SESSION_ENDED`.

**Typical producers:** Platform ingest adapters, Live Studio bridge, manual CRM ingest API.

**Typical consumers:** Gifter rollups, timeline replay, highlights, trigger analysis, session summary, intelligence engine.

**Persistence:** `LiveEvent` table — append-only, organization-scoped, idempotent via `platformEventId`.

**Privacy considerations:** Chat payloads may contain PII; dashboard and coaching surfaces expose aggregates only. Retention and erasure follow organization policy ADRs.

---

## Gift Events

**Purpose:** Monetization signals — individual gifts and derived high-value or spike patterns.

**Naming conventions:** Ingest type `GIFT_RECEIVED`; derived trigger types `HIGH_VALUE_GIFT`, `GIFT_SPIKE`; coach types `HIGH_VALUE_GIFT_RECEIVED`, `GIFT_VELOCITY_DROPPING`.

**Typical producers:** TikTok and future platform adapters via live ingest.

**Typical consumers:** Gifter rollups, `GifterProfile` tiering, trigger analysis, coach alerts, goal progress (revenue targets).

**Persistence:** Stored as `LiveEvent` rows; rollup checkpoints on session metadata; no mutation of source events.

**Privacy considerations:** Store gift metadata (type, quantity, value) — not payment instrument details. Aggregate in profiles for coaching.

---

## Chat Events

**Purpose:** Text engagement signals for engagement scoring and trigger detection without exposing raw chat on aggregate surfaces.

**Naming conventions:** `CHAT_MESSAGE`; optional `VOICE_TRANSCRIPT_SEGMENT` for text derived from voice (not raw audio).

**Typical producers:** Platform chat webhooks, controlled transcript ingest.

**Typical consumers:** Gifter rollups (message counts), trigger analysis, session summary (counts only on dashboard paths).

**Persistence:** `LiveEvent.payload` JSON text; max payload size enforced at ingest.

**Privacy considerations:** Highest sensitivity family — RBAC on raw timeline access; erasure requests must target event payloads; never include raw chat in creator dashboard API responses.

---

## Viewer Events

**Purpose:** Audience presence and velocity — joins, leaves, and spike detection.

**Naming conventions:** `VIEWER_JOINED`, `VIEWER_LEFT`; derived `VIEWER_SPIKE`.

**Typical producers:** Platform viewer webhooks, session lifecycle hooks.

**Typical consumers:** Session rollups, trigger analysis, coach alerts (`VIEWER_SPIKE`), engagement trends.

**Persistence:** `LiveEvent` rows; viewer counts derived in session metadata and summaries.

**Privacy considerations:** Avoid storing persistent viewer PII beyond platform actor IDs required for gifter correlation; aggregate for coaching.

---

## Creator Events

**Purpose:** Creator-initiated or creator-attributed actions during a session (scene changes, campaign promotions, breaks).

**Naming conventions:** Coach recommendation types such as `PROMOTE_CAMPAIGN`, `TAKE_BREAK_SOON`, `TRY_MUSIC_NOW`, `START_PK_NOW`; future explicit `CREATOR_*` ingest types as Live Studio matures.

**Typical producers:** Live Studio desktop, manual ingest, future OBS bridge.

**Typical consumers:** Trigger analysis, coach alerts, session summary, campaign execution scoring.

**Persistence:** Mix of `LiveEvent` ingest (when modeled) and derived metadata on session intelligence snapshots.

**Privacy considerations:** Low sensitivity; tie to creator profile already in session context.

---

## Campaign Events

**Purpose:** Campaign and deliverable lifecycle transitions auditable for brand and agency reporting.

**Naming conventions:** Audit-style actions on campaign entities (for example assignment status changes); deliverable submission events referenced in [Campaigns API](../api/campaigns.md).

**Typical producers:** Campaign service mutations, deliverable review workflows.

**Typical consumers:** Performance score campaign execution component, manager reporting (planned), audit export.

**Persistence:** Relational campaign tables plus `AuditLog` entries for material transitions.

**Privacy considerations:** Brand terms may be confidential — organization-scoped access only; no cross-tenant leakage.

---

## Goal Events

**Purpose:** Goal creation, progress recalculation, and status transitions for deterministic accountability.

**Naming conventions:** Audit actions such as `creator.goals.created`, `creator.goals.progress.recalculated`, `creator.goals.status.updated`.

**Typical producers:** Goals service, scheduled recalculation jobs, live rollup side effects.

**Typical consumers:** Creator dashboard, performance score, coach recommendations, future Manager Portal.

**Persistence:** `CreatorGoal`, `CreatorGoalProgress` tables; audit log for mutations.

**Privacy considerations:** Goal targets may imply compensation — restrict to org members with `crm:read` or tighter.

---

## Recommendation Events

**Purpose:** Record generation and consumption of deterministic coaching recommendations.

**Naming conventions:** Stored recommendation `type` enums on session metadata (for example `THANK_SUPPORTER`, `TOP_GIFTER_ACTIVE`); audit on generate/read where sensitive.

**Typical producers:** Live intelligence recommendation engine post trigger analysis.

**Typical consumers:** Creator dashboard, future real-time coach UI, session summary narrative.

**Persistence:** Session metadata and intelligence snapshots — not separate event table.

**Privacy considerations:** Recommendations reference aggregate gifter behavior — no raw chat in recommendation payloads.

---

## Coach Events

**Purpose:** Time-sensitive alerts urging creator action during or after live sessions.

**Naming conventions:** Coach alert `alertType` aligned with trigger and recommendation taxonomy; severity levels on stored alerts.

**Typical producers:** Coach alert service after trigger analysis thresholds.

**Typical consumers:** Live coach UI (planned), creator dashboard recent alerts, intelligence profile inputs.

**Persistence:** Session metadata arrays; optional audit on delivery acknowledgment (planned).

**Privacy considerations:** Same as recommendations — aggregate evidence only on external surfaces.

---

## Audit Events

**Purpose:** Immutable record of security-sensitive and material business mutations for compliance and troubleshooting.

**Naming conventions:** Dot-separated actions: `membership.updated`, `invitation.created`, `creator.intelligence_profile.generated`, `creator.dashboard.viewed`, etc. See [Audit logs API](../api/audit-logs.md).

**Typical producers:** `AuditService.record(...)` from domain services and controllers.

**Typical consumers:** Admin audit UI, compliance export, incident response.

**Persistence:** `AuditLog` table — append-only; secrets and raw tokens excluded from metadata.

**Privacy considerations:** Minimize PII in metadata; actor user ID required; retention policy subject to legal ADR.

---

## Future AI Events

**Purpose:** Planned telemetry for AI assist usage — prompts, model version, human approval outcomes — without making AI output authoritative.

**Naming conventions:** Proposed prefix `ai.` for audit actions (for example `ai.coach_summary.generated`, `ai.moderation.suggested`).

**Typical producers:** `ai-services` with human-in-the-loop gates (v1.5+).

**Typical consumers:** Credits metering, quality review, cost monitoring.

**Persistence:** Audit log + credits ledger entries; no replacement of deterministic snapshots.

**Privacy considerations:** No raw chat in model prompts without explicit policy; cite snapshot IDs not full payloads in logs.

---

## Future Marketplace Events

**Purpose:** Planned marketplace lifecycle — listings, bids, escrow, settlement, dispute.

**Naming conventions:** Proposed prefix `marketplace.` (for example `marketplace.listing.published`, `marketplace.escrow.released`).

**Typical producers:** Marketplace service (v2.0+).

**Typical consumers:** Financial platform, fraud detection, agency reporting.

**Persistence:** Marketplace tables + audit + ledger (credits then financial).

**Privacy considerations:** Financial and identity data subject to marketplace fraud controls in [Risk Register](../business/risk-register.md).

---

## Future Token Events

**Purpose:** Planned credits and token ledger movements — grants, spends, reversals — tied to verifiable platform outcomes.

**Naming conventions:** Ledger `entryType` enums: `GRANT`, `SPEND`, `REVERSAL`, `ADJUSTMENT` per [Token Economy architecture](./token-economy.md).

**Typical producers:** Credits service after approved business events (campaign completion, AI usage).

**Typical consumers:** Balance APIs, financial reconciliation, compliance reporting.

**Persistence:** Append-only `CreditLedgerEntry` (planned); no silent balance mutation.

**Privacy considerations:** Token regulation risk — credits-first per [ADR-0005](../architecture/decision-log.md#adr-0005-kōlab-credits-before-token); no peer transfer in v1.

---

## Related documentation

- [Live Intelligence API](../api/live-intelligence.md)
- [Creators API — audit actions](../api/creators.md)
- [Product Principles — Privacy first](../vision/product-principles.md#privacy-first)
- [Traceability Matrix](../roadmap/traceability.md)

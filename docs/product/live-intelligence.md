# Live Intelligence & Gifter Analytics

**Status:** Planning  
**Target:** Release 0.5+ (`release/0.5.x` and later milestones)  
**Depends on:** Release 0.2 identity, Release 0.3 agency/CRM, Release 0.4 campaign foundation, TikTok/live platform integration (future)  
**Branch:** `feature/live-intelligence-planning`

---

## Goal

Design **KOLAB Live Intelligence**: a system that captures livestream events, chat, voice transcripts, gifts, viewer behavior, and gifter profiles so agencies and creators can understand **what triggers gifting** and how to **repeat successful behaviors**.

This is a **planning document only**. No schema, APIs, AI calls, recording infrastructure, token economy, or frontend are implemented in this milestone.

---

## Problem statement

Creators and agency managers currently lack a unified, evidence-based view of:

- Which moments in a livestream correlate with gift spikes
- Who the highest-value gifters are and what content they respond to
- Whether singing, dancing, PK battles, banter, or emotional moments drive spend
- How to coach creators in real time vs after the stream ends

Live Intelligence connects operational live data to actionable coaching and agency-level analytics.

---

## Product scope

### In scope (planned)

| Area                      | Description                                                                      |
| ------------------------- | -------------------------------------------------------------------------------- |
| Live sessions             | Scheduled and ad-hoc livestream sessions linked to creators and campaigns        |
| Creator live schedule     | Planned go-live windows, recurrence, timezone-aware                              |
| Live event timeline       | Ordered stream of normalized events (gifts, chat, performance, PK, joins/leaves) |
| Chat messages             | Platform chat ingested with sender identity where available                      |
| Gift events               | Gift type, value, sender, timestamp, session context                             |
| Voice transcript segments | ASR output with timestamps aligned to timeline                                   |
| Performance moments       | Tagged singing, dancing, song start/end, choreographed segments                  |
| Co-host / PK moments      | Battle start/end, opponent, outcome                                              |
| Viewer join/leave         | When platform APIs expose presence signals                                       |
| Gifter profiles           | Cross-session behavioral and spend profiles                                      |
| Gift trigger analysis     | Pattern detection with confidence scores                                         |
| Real-time AI coach        | Low-latency suggestions during live (later phase)                                |
| Post-live summary         | AI-generated recap, top moments, coaching notes                                  |
| Agency-level analytics    | Rollups across creators, campaigns, and time                                     |

### Out of scope (this planning phase)

- Prisma migrations and API implementation
- Livestream recording/storage of raw video
- Direct AI model calls in production
- Token economy launch (see [Token economy](./token-economy.md) — credits first)
- Frontend dashboards
- TikTok Shop or payout integration

---

## User stories

### Creator

- As a **creator**, I can see a post-live summary of top gift moments and what content preceded them so I know what to repeat next stream.
- As a **creator**, I can receive real-time coaching hints (e.g. "gift spike after song chorus") so I can adjust performance mid-stream.
- As a **creator**, I can view my scheduled live sessions and link them to agency campaigns.

### Agency manager / recruiter

- As an **AGENCY_MANAGER**, I can compare gift trigger patterns across creators in my roster.
- As an **AGENCY_MANAGER**, I can identify high-value gifters and their favorite creators/content types.
- As a **RECRUITER**, I can use gifter retention signals to prioritize creator coaching for revenue growth.

### Operations / compliance

- As an **ORG_ADMIN**, I can configure data retention and access policies for live intelligence data.
- As an **auditor**, I can trace who accessed gifter profiles and AI summaries via audit logs.

---

## Gifter profile (product definition)

Track per external gifter identity (platform-scoped):

| Attribute                          | Purpose                                                  |
| ---------------------------------- | -------------------------------------------------------- |
| Platform                           | TikTok, future platforms                                 |
| External gifter ID                 | Stable platform identifier                               |
| Display name                       | Human-readable label (may change)                        |
| Total gifts                        | Lifetime and rolling-window spend                        |
| Favorite creators                  | Ranked by gift volume/frequency                          |
| Favorite gift types                | Rose, universe, etc.                                     |
| Session frequency                  | How often they appear in lives                           |
| Gift timing patterns               | Early/mid/late stream, after events                      |
| Trigger categories                 | Singing, dancing, banter, PK, acknowledgement, emotional |
| Response to singing                | Correlation score + sample count                         |
| Response to dancing                | Correlation score + sample count                         |
| Response to jokes/banter           | Correlation score + sample count                         |
| Response to PK/battles             | Correlation score + sample count                         |
| Response to direct acknowledgement | Shoutout/read-name moments                               |
| Response to emotional moments      | Storytelling, vulnerability, milestones                  |
| Spending tier                      | WHALE, HIGH, MEDIUM, LOW, OCCASIONAL                     |
| Retention behavior                 | Return rate, streaks, churn risk                         |
| Metadata                           | Extensible JSON for platform-specific fields             |

Profiles are **organization-scoped aggregates** built from ingested events, not raw platform PII dumps.

---

## AI analysis (product expectations)

| Capability                   | Description                                                        |
| ---------------------------- | ------------------------------------------------------------------ |
| Event timeline model         | Unified chronological model merging chat, gifts, transcripts, tags |
| Gift trigger detection       | Identify moments preceding gift clusters                           |
| Correlation vs causation     | Explicit UX/API warnings — correlation ≠ causation                 |
| Confidence scores            | 0–1 or LOW/MEDIUM/HIGH on every inference                          |
| Creator coaching suggestions | Actionable, repeatable behaviors                                   |
| Repeatable winning patterns  | "When creator X sings song Y, gift rate +Z%"                       |
| Gifter clusters              | Segment gifters by behavior (whales, song fans, PK fans)           |
| Top trigger moments          | Ranked replay anchors with timestamps                              |
| Live replay analysis         | Post-live batch analysis on timeline + transcript                  |
| Real-time alerts             | Optional push to coach UI during live (high phase)                 |

AI outputs are **assistive**, not authoritative. Human review remains required for contractual or compensation decisions.

---

## Privacy and compliance (product rules)

| Rule                | Requirement                                                                |
| ------------------- | -------------------------------------------------------------------------- |
| Platform terms      | Ingestion only via approved APIs/webhooks; respect TikTok/platform ToS     |
| Consent / notice    | Creators and agencies acknowledge analytics scope in onboarding/agreements |
| Data minimization   | Store only fields needed for coaching and analytics                        |
| Retention           | Configurable per org; default TTL for raw chat/transcripts                 |
| Sensitive data      | No storage of payment card data; gift values as platform units only        |
| Access controls     | RBAC + org scope; gifter PII limited to authorized roles                   |
| Audit logging       | All profile views, exports, and AI summary access logged                   |
| Regional compliance | GDPR/CCPA deletion and export paths planned                                |
| Opt-out / deletion  | Gifter and creator data subject requests supported in later phase          |

See [Architecture — Live Intelligence](../architecture/live-intelligence.md) for technical enforcement.

---

## Relationship to other KOLAB modules

| Module                      | Relationship                                         |
| --------------------------- | ---------------------------------------------------- |
| Creator Profile             | Live sessions link to `CreatorProfile`               |
| Campaigns                   | Optional `campaignId` on sessions for brand deals    |
| Recruitment CRM             | Separate; no lead conversion in Live Intelligence v1 |
| AI Services (`ai-services`) | Future host for batch + streaming inference          |
| Analytics package           | Future read models and rollups                       |
| Streaming package           | Future ingest adapters, not recording v1             |

---

## Recommended implementation phases

| Phase | Milestone                                            |
| ----- | ---------------------------------------------------- |
| 1     | Live Intelligence planning (this document)           |
| 2     | Live session schema                                  |
| 3     | Live event ingestion API                             |
| 4     | Gifter profile schema                                |
| 5     | Timeline and replay API                              |
| 6     | Post-live AI summary                                 |
| 7     | Trigger analytics                                    |
| 8     | Real-time coach                                      |
| 9     | Credits ledger ([Token economy](./token-economy.md)) |
| 10    | Token conversion strategy (later, if ever)           |

---

## Success metrics (future)

- Time from live end to post-live summary available
- Creator adoption of coaching suggestions (qualitative + repeat behavior)
- Gift-per-minute improvement vs baseline (with causation disclaimers)
- Agency dashboard usage for roster comparison
- Zero compliance incidents related to unauthorized data collection

---

## Related docs

- [Live Intelligence architecture](../architecture/live-intelligence.md)
- [Live Intelligence ERD](../database/live-intelligence-erd.md)
- [Live Intelligence API (planning)](../api/live-intelligence.md)
- [Token economy (product)](./token-economy.md)

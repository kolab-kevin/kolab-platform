# Live Intelligence API

**Status:** Implemented (sessions, schedules, events, gifter profiles, rollups, timeline/replay/highlights, trigger analysis, session summary, coach recommendations, coach alerts, intelligence engine)  
**Base path:** `/api/live`  
**Auth:** Bearer JWT with active organization context

---

## Overview

Live Intelligence APIs manage live sessions, creator live schedules, append-only session event timelines, gifter profile analytics, timeline replay/highlights, deterministic trigger analysis, post-live session summaries, deterministic coach recommendations, coach alerts, and consolidated intelligence snapshots. Real-time streaming coach delivery is planned for later phases.

All routes are organization-scoped. Cross-org resource IDs return `404`.

---

## Permissions

| Permission   | Used for                                                  |
| ------------ | --------------------------------------------------------- |
| `crm:read`   | List/get sessions, schedules, events, and gifter profiles |
| `crm:update` | Create/update sessions, schedules, and ingest events      |

| Role             | Read | Update |
| ---------------- | ---- | ------ |
| `ORG_OWNER`      | Yes  | Yes    |
| `ORG_ADMIN`      | Yes  | Yes    |
| `AGENCY_MANAGER` | Yes  | Yes    |
| `RECRUITER`      | Yes  | Yes    |
| `MODERATOR`      | Yes  | No     |
| `VIEWER`         | No   | No     |

---

## Live sessions

| Method | Path                                   | Permission   | Description                    |
| ------ | -------------------------------------- | ------------ | ------------------------------ |
| GET    | `/api/live/sessions`                   | `crm:read`   | List sessions (filter, cursor) |
| POST   | `/api/live/sessions`                   | `crm:update` | Create scheduled session       |
| GET    | `/api/live/sessions/:sessionId`        | `crm:read`   | Session detail                 |
| PATCH  | `/api/live/sessions/:sessionId`        | `crm:update` | Update session fields          |
| POST   | `/api/live/sessions/:sessionId/status` | `crm:update` | Transition session status      |

### List query parameters

| Param              | Type   | Description         |
| ------------------ | ------ | ------------------- |
| `cursor`           | string | Pagination cursor   |
| `limit`            | number | Max 100, default 20 |
| `creatorProfileId` | string | Filter              |
| `campaignId`       | string | Filter              |
| `status`           | enum   | `LiveSessionStatus` |
| `platform`         | enum   | `LivePlatform`      |

### Create body

```json
{
  "creatorProfileId": "clxyz...",
  "campaignId": "clabc...",
  "platform": "TIKTOK",
  "platformSessionId": "tt-live-123",
  "title": "Evening Live",
  "description": "Q&A stream",
  "scheduledStart": "2026-07-04T20:00:00.000Z",
  "scheduledEnd": "2026-07-04T22:00:00.000Z",
  "metadata": {}
}
```

New sessions are created with status `SCHEDULED`. `creatorProfileId` must belong to the active organization. Optional `campaignId` must belong to the same organization.

### Status transitions

| From        | Allowed next states  |
| ----------- | -------------------- |
| `SCHEDULED` | `LIVE`, `CANCELLED`  |
| `LIVE`      | `ENDED`, `CANCELLED` |
| `ENDED`     | _(none)_             |
| `CANCELLED` | _(none)_             |

Side effects:

- Transition to `LIVE` sets `startedAt` when empty.
- Transition to `ENDED` sets `endedAt` and computes `durationSeconds` from `startedAt` when possible.

### Update rules

- `ENDED` and `CANCELLED` sessions accept metadata-only updates.
- Status changes use `POST /status`, not `PATCH`.

---

## Live event timeline

Append-only events for a session. No update or delete endpoints.

| Method | Path                                         | Permission   | Description                    |
| ------ | -------------------------------------------- | ------------ | ------------------------------ |
| GET    | `/api/live/sessions/:sessionId/events`       | `crm:read`   | List session timeline (cursor) |
| POST   | `/api/live/sessions/:sessionId/events`       | `crm:update` | Ingest single event            |
| POST   | `/api/live/sessions/:sessionId/events/batch` | `crm:update` | Ingest up to 100 events        |

### Timeline list query parameters

| Param             | Type   | Description                     |
| ----------------- | ------ | ------------------------------- |
| `cursor`          | string | Pagination cursor               |
| `limit`           | number | Max 500, default 100            |
| `eventType`       | enum   | Filter by `LiveEventType`       |
| `externalActorId` | string | Filter by platform actor/gifter |

Results are ordered by `occurredAt`, then `offsetMs`, then `id` ascending for replay alignment.

### Ingest body (single or batch item)

```json
{
  "creatorProfileId": "clxyz...",
  "eventType": "GIFT_RECEIVED",
  "occurredAt": "2026-07-04T20:05:00.000Z",
  "offsetMs": 300000,
  "platformEventId": "tt-gift-abc123",
  "externalActorId": "gifter-789",
  "actorDisplayName": "Fan123",
  "payload": {
    "giftType": "ROSE",
    "quantity": 5,
    "diamondValue": 50
  },
  "metadata": {}
}
```

### Ingest rules

- Session must belong to the active organization.
- `creatorProfileId` must match the session's creator.
- `occurredAt` is required; `offsetMs` is optional and must be `>= 0`.
- `platform` defaults to the session platform; mismatches require `allowPlatformMismatch: true`.
- `platformEventId` enables idempotency — duplicates return the existing event with `created: false`.
- `payload` is required JSON (max 65 KB). Raw audio, video, and base64 media blobs are rejected.
- Batch requests accept 1–100 events and preserve request order in the response.

### Ingest response (single)

```json
{
  "event": { "...": "LiveEvent" },
  "created": true
}
```

### Batch ingest response

```json
{
  "items": [{ "event": { "...": "LiveEvent" }, "created": true }],
  "createdCount": 1,
  "duplicateCount": 0
}
```

> **Privacy:** `CHAT_MESSAGE` and `VOICE_TRANSCRIPT_SEGMENT` payloads may contain sensitive text. Access must be RBAC-controlled with retention and erasure policies — see [Database ERD](../database/live-intelligence-erd.md#privacy-and-sensitive-data).

---

## Gifter profiles

Read-only APIs for persistent gifter identity and per-session rollups. Responses include **aggregate fields only** — no raw chat or transcript content.

| Method | Path                                    | Permission | Description                              |
| ------ | --------------------------------------- | ---------- | ---------------------------------------- |
| GET    | `/api/live/gifters`                     | `crm:read` | List gifter profiles (filter, cursor)    |
| GET    | `/api/live/gifters/:gifterId`           | `crm:read` | Profile detail with recent session stats |
| GET    | `/api/live/gifters/:gifterId/sessions`  | `crm:read` | Paginated per-session stats for a gifter |
| GET    | `/api/live/sessions/:sessionId/gifters` | `crm:read` | Gifters and stats for a live session     |

### Gifter list query parameters

| Param              | Type     | Description                               |
| ------------------ | -------- | ----------------------------------------- |
| `cursor`           | string   | Pagination cursor                         |
| `limit`            | number   | Max 100, default 20                       |
| `platform`         | enum     | `LivePlatform`                            |
| `spendingTier`     | enum     | `GifterSpendingTier`                      |
| `creatorProfileId` | string   | Favorite creator or session participation |
| `externalGifterId` | string   | Exact platform gifter ID                  |
| `search`           | string   | Case-insensitive `displayName` search     |
| `lastSeenFrom`     | datetime | Minimum `lastSeenAt`                      |
| `lastSeenTo`       | datetime | Maximum `lastSeenAt`                      |

### Gifter detail response

```json
{
  "profile": { "...": "GifterProfile" },
  "recentSessionStats": [{ "...": "GifterSessionStats" }],
  "favoriteCreator": {
    "creatorProfileId": "clxyz...",
    "displayName": "Star Creator"
  }
}
```

Detail access emits audit event `live.gifter_profile.viewed`.

### Session gifters response

Each item pairs the gifter profile with that session's rollup stats:

```json
{
  "items": [
    {
      "profile": { "...": "GifterProfile" },
      "sessionStats": { "...": "GifterSessionStats" }
    }
  ],
  "nextCursor": null
}
```

> **Privacy:** Gifter profiles contain platform IDs and display names. Treat as PII with RBAC, retention limits, and erasure support. API responses strip chat/transcript-like metadata keys and never expose message bodies — see [Database ERD](../database/live-intelligence-erd.md#gifter-privacy-and-compliance).

### Gifter rollup processing

| Method | Path                                            | Permission   | Description                                |
| ------ | ----------------------------------------------- | ------------ | ------------------------------------------ |
| POST   | `/api/live/sessions/:sessionId/rollups/gifters` | `crm:update` | Process session events into gifter rollups |

Processes `GIFT_RECEIVED`, `CHAT_MESSAGE`, `VIEWER_JOINED`, and `VIEWER_LEFT` events only. Updates `GifterProfile`, `GifterSessionStats`, and session-level gift totals. Idempotent via a checkpoint of processed event IDs stored on the session metadata (`metadata.gifterRollup.processedEventIds`).

```json
{
  "liveSessionId": "clxyz...",
  "processedEventCount": 12,
  "skippedEventCount": 3,
  "profilesUpdated": 5,
  "sessionStatsUpdated": 5,
  "checkpoint": {
    "processedEventIds": ["evt-1", "evt-2"],
    "lastProcessedAt": "2026-07-04T20:30:00.000Z"
  }
}
```

Spending tier v1 thresholds (by profile `totalGiftValue`):

| Tier      | Gift value    |
| --------- | ------------- |
| `UNKNOWN` | no gifts      |
| `LOW`     | &lt; 100      |
| `MEDIUM`  | 100–999       |
| `HIGH`    | 1,000–9,999   |
| `WHALE`   | 10,000–49,999 |
| `VIP`     | 50,000+       |

Rollup processing emits audit event `live.gifter_rollup.processed`. Chat message bodies are never copied into profile or stats rows — only `chatMessageCount` is incremented.

---

## Timeline, replay, and highlights

Read-only reconstruction APIs over append-only `LiveEvent` rows. No mutation or editing.

| Method | Path                                       | Permission | Description                         |
| ------ | ------------------------------------------ | ---------- | ----------------------------------- |
| GET    | `/api/live/sessions/:sessionId/timeline`   | `crm:read` | Chronological timeline with filters |
| GET    | `/api/live/sessions/:sessionId/replay`     | `crm:read` | Offset-grouped replay segments      |
| GET    | `/api/live/sessions/:sessionId/highlights` | `crm:read` | Deterministic highlight moments     |

### Timeline query parameters

| Param          | Type   | Description                        |
| -------------- | ------ | ---------------------------------- |
| `cursor`       | string | Pagination cursor                  |
| `limit`        | number | Max 500, default 100               |
| `eventType`    | enum   | Filter by `LiveEventType`          |
| `actorId`      | string | Filter by platform actor/gifter ID |
| `fromOffsetMs` | number | Minimum `offsetMs`                 |
| `toOffsetMs`   | number | Maximum `offsetMs`                 |

Timeline results are ordered by `occurredAt`, then `offsetMs`, then `id` ascending. Timeline access emits audit event `live.timeline.viewed`.

### Replay response

Events are grouped into 60-second offset segments without reordering events inside each segment:

```json
{
  "liveSessionId": "clxyz...",
  "segmentDurationMs": 60000,
  "segments": [
    {
      "startOffsetMs": 0,
      "endOffsetMs": 59999,
      "eventCount": 12,
      "dominantEventType": "CHAT_MESSAGE",
      "viewerActivity": { "joins": 4, "leaves": 1 },
      "giftActivity": { "giftCount": 3, "giftValue": 450 },
      "events": [{ "...": "LiveEvent" }]
    }
  ]
}
```

Replay access emits audit event `live.replay.viewed`.

### Highlights rules (deterministic, no AI)

| Highlight type                      | Rule                                       |
| ----------------------------------- | ------------------------------------------ |
| `SESSION_STARTED` / `SESSION_ENDED` | Matching lifecycle events                  |
| `PK_STARTED` / `PK_ENDED`           | Matching PK events                         |
| `SONG_STARTED` / `SONG_ENDED`       | Matching song events                       |
| `PERFORMANCE_MOMENT`                | Matching performance tags                  |
| `HIGH_VALUE_GIFT`                   | `GIFT_RECEIVED` with value ≥ 1,000         |
| `GIFT_SPIKE`                        | ≥ 3 gifts within 30s offset window         |
| `VIEWER_SPIKE`                      | ≥ 10 viewer joins within 60s offset window |

---

## Trigger analysis

Deterministic gift trigger analysis over the append-only session timeline. Results are stored on `LiveSession.metadata.triggerAnalysis` (no `LiveEvent` mutation, no AI).

| Method | Path                                              | Permission   | Description                       |
| ------ | ------------------------------------------------- | ------------ | --------------------------------- |
| POST   | `/api/live/sessions/:sessionId/analysis/triggers` | `crm:update` | Generate/replace trigger analysis |
| GET    | `/api/live/sessions/:sessionId/analysis/triggers` | `crm:read`   | Read stored trigger analysis      |

### Trigger rules (v1, correlation only)

| Trigger type                  | Rule                                                    |
| ----------------------------- | ------------------------------------------------------- |
| `SONG_STARTED_GIFTS`          | Gifts within 30s after `SONG_STARTED`                   |
| `DANCE_MOMENT_GIFTS`          | Gifts within 30s after `DANCE_MOMENT`                   |
| `PERFORMANCE_MOMENT_GIFTS`    | Gifts within 30s after `PERFORMANCE_MOMENT`             |
| `PK_STARTED_GIFTS`            | Gifts within 30s after `PK_STARTED`                     |
| `ACTOR_ACKNOWLEDGEMENT_GIFTS` | Gifts within 30s after acknowledgement payload/metadata |
| `GIFT_SPIKE`                  | ≥ 3 gifts within 30s                                    |
| `HIGH_VALUE_GIFT`             | Gift value ≥ 1,000                                      |

Each item includes `confidenceScore` (0–1), `evidence`, `relatedEventIds`, optional `viewerDelta`, and a fixed disclaimer: correlation, not causation. Regenerating analysis replaces the previous `metadata.triggerAnalysis` snapshot.

### Response summary

```json
{
  "liveSessionId": "clxyz...",
  "summary": {
    "totalTriggers": 4,
    "topTriggerTypes": [{ "triggerType": "SONG_STARTED_GIFTS", "count": 2 }],
    "totalGiftValueAttributed": 1250,
    "generatedAt": "2026-07-04T21:00:00.000Z"
  },
  "items": [{ "...": "TriggerAnalysisItem" }]
}
```

Audit events: `live.trigger_analysis.generated`, `live.trigger_analysis.viewed`.

---

## Session summary

Deterministic post-live summary built from session rollups, timeline highlights, gifter session stats, and stored trigger analysis. No external AI calls and no raw chat/transcript output.

| Method | Path                                    | Permission   | Description                      |
| ------ | --------------------------------------- | ------------ | -------------------------------- |
| POST   | `/api/live/sessions/:sessionId/summary` | `crm:update` | Generate/replace session summary |
| GET    | `/api/live/sessions/:sessionId/summary` | `crm:read`   | Read stored session summary      |

Summary is stored on `LiveSession.metadata.liveSummary`. Regenerating replaces the previous snapshot. GET returns `404` when no summary exists.

### Summary fields

- Session rollups: `status`, `durationSeconds`, `totalViewers`, `peakViewers`, `totalGifts`, `totalGiftValue`
- `topMoments` from deterministic timeline highlights
- `topGiftEvents` aggregate gift rows only (no message bodies)
- `topGifters` from `GifterSessionStats` when rollups exist
- `triggerSummary` when `metadata.triggerAnalysis` is present
- `timelineHealth` completeness signals
- `coachingNotes` deterministic, non-AI guidance
- `complianceWarnings` when timeline/rollup/analysis data is incomplete

```json
{
  "sessionId": "clxyz...",
  "generatedAt": "2026-07-04T21:00:00.000Z",
  "status": "ENDED",
  "durationSeconds": 3600,
  "totalViewers": 500,
  "peakViewers": 120,
  "totalGifts": 12,
  "totalGiftValue": "6500.00",
  "topMoments": [],
  "topGiftEvents": [],
  "topGifters": [],
  "triggerSummary": null,
  "timelineHealth": { "...": "..." },
  "coachingNotes": [
    "Generate trigger analysis after ingest to enrich post-live coaching insights."
  ],
  "complianceWarnings": []
}
```

Audit events: `live.session_summary.generated`, `live.session_summary.viewed`.

---

## Coach recommendations

Deterministic coaching recommendations derived from session rollups, timeline highlights, trigger analysis, session summary signals, and gifter rollups. No LLMs or external AI services are used.

| Method | Path                                            | Permission   | Description                              |
| ------ | ----------------------------------------------- | ------------ | ---------------------------------------- |
| POST   | `/api/live/sessions/:sessionId/recommendations` | `crm:update` | Generate/replace session recommendations |
| GET    | `/api/live/sessions/:sessionId/recommendations` | `crm:read`   | Read stored session recommendations      |

Recommendations are stored on `LiveSession.metadata.recommendations`. Regenerating replaces the previous snapshot. GET returns `404` when no recommendations exist.

### Recommendation types (v1)

`TRY_MUSIC`, `START_PK`, `END_PK`, `ENGAGE_TOP_GIFTER`, `WELCOME_NEW_VIEWERS`, `THANK_TOP_SUPPORTERS`, `TAKE_SHORT_BREAK`, `IMPROVE_CONSISTENCY`, `RUN_CAMPAIGN_PROMOTION`, `FOLLOW_UP_WITH_WHALES`

Each recommendation includes:

- `id`, `recommendationType`, `priority` (`LOW` | `MEDIUM` | `HIGH`)
- `confidenceScore` (0.0–1.0)
- `title`, `description`
- `supportingEvidence[]`
- `generatedAt`

```json
{
  "sessionId": "clxyz...",
  "generatedAt": "2026-07-04T21:00:00.000Z",
  "recommendations": [
    {
      "id": "try_music",
      "recommendationType": "TRY_MUSIC",
      "priority": "HIGH",
      "confidenceScore": 0.85,
      "title": "Repeat music segments that drove gifts",
      "description": "Song starts correlated with gift activity in this session.",
      "supportingEvidence": ["1 song-start trigger(s) detected."],
      "generatedAt": "2026-07-04T21:00:00.000Z"
    }
  ]
}
```

Audit events: `live.recommendations.generated`, `live.recommendations.viewed`.

---

## Coach alerts

Deterministic live coaching alerts derived from stored recommendations, recent timeline events, gift velocity, viewer spikes, high-value gifts, and gifter rollups. No LLMs, websocket/SSE streaming, or raw chat/transcript output.

| Method | Path                                         | Permission   | Description                           |
| ------ | -------------------------------------------- | ------------ | ------------------------------------- |
| POST   | `/api/live/sessions/:sessionId/coach/alerts` | `crm:update` | Generate/replace coach alert snapshot |
| GET    | `/api/live/sessions/:sessionId/coach/alerts` | `crm:read`   | Read stored coach alerts              |

Alerts are stored on `LiveSession.metadata.coachAlerts`. Regenerating replaces the previous snapshot. GET returns `404` when no alerts exist.

### Alert types (v1)

`TOP_GIFTER_ACTIVE`, `GIFT_VELOCITY_DROPPING`, `VIEWER_SPIKE`, `HIGH_VALUE_GIFT_RECEIVED`, `TRY_MUSIC_NOW`, `START_PK_NOW`, `THANK_SUPPORTER`, `PROMOTE_CAMPAIGN`, `TAKE_BREAK_SOON`

Each alert includes:

- `id`, `alertType`, `priority` (`LOW` | `MEDIUM` | `HIGH`)
- `title`, `message`, `recommendedAction`
- `relatedRecommendationId` (optional)
- `relatedEventIds[]`
- `confidenceScore` (0.0–1.0)
- `generatedAt`

```json
{
  "sessionId": "clxyz...",
  "generatedAt": "2026-07-04T21:00:00.000Z",
  "alerts": [
    {
      "id": "top_gifter_active",
      "alertType": "TOP_GIFTER_ACTIVE",
      "priority": "HIGH",
      "confidenceScore": 0.75,
      "title": "Top gifter is active now",
      "message": "Whale sent gifts during the recent live window.",
      "recommendedAction": "Acknowledge the top gifter on stream and reinforce engagement.",
      "relatedRecommendationId": null,
      "relatedEventIds": ["evt-gift-recent"],
      "generatedAt": "2026-07-04T21:00:00.000Z"
    }
  ]
}
```

Audit events: `live.coach_alerts.generated`, `live.coach_alerts.viewed`.

---

## Live Intelligence Engine

Consolidated deterministic intelligence snapshot built from session rollups, timeline events, highlights, gifter rollups, trigger analysis, session summary, recommendations, and coach alerts. No AI calls and no raw chat/transcript output. Signals are correlational, not causal.

| Method | Path                                         | Permission   | Description                            |
| ------ | -------------------------------------------- | ------------ | -------------------------------------- |
| POST   | `/api/live/sessions/:sessionId/intelligence` | `crm:update` | Generate/replace intelligence snapshot |
| GET    | `/api/live/sessions/:sessionId/intelligence` | `crm:read`   | Read stored intelligence snapshot      |

Stored on `LiveSession.metadata.intelligenceSnapshot`. Regenerating replaces the previous snapshot. GET returns `404` when no snapshot exists.

### Snapshot fields

- Dimension scores (0–100): `sessionHealthScore`, `revenueScore`, `engagementScore`, `consistencyScore`, `gifterQualityScore`, `coachingOpportunityScore`, `overallScore`
- Narrative arrays: `keyStrengths[]`, `keyRisks[]`, `recommendedNextActions[]`, `dataQualityWarnings[]`
- Structured signals: `topSignals[]`, `topGifters[]`, `topTriggerTypes[]`, `bestMoments[]`, `weakMoments[]`

### Deterministic v1 scoring heuristics

| Score                      | Heuristic                                                              |
| -------------------------- | ---------------------------------------------------------------------- |
| `sessionHealthScore`       | Timeline health status + offset coverage + rollup/trigger availability |
| `revenueScore`             | Total gift value tiers (0, 100, 1000, 5000, 10000+)                    |
| `engagementScore`          | Peak/total viewers + viewer spikes + gift counts                       |
| `consistencyScore`         | ENDED status + duration + session start/end events                     |
| `gifterQualityScore`       | WHALE/VIP rollups + rollup checkpoint + gifter diversity               |
| `coachingOpportunityScore` | Compliance warnings + recommendations + alerts + coaching notes        |
| `overallScore`             | Average of dimension scores with coaching opportunity inverted         |

Missing upstream snapshots (trigger analysis, summary, recommendations, alerts) produce `dataQualityWarnings` rather than failing generation.

```json
{
  "sessionId": "clxyz...",
  "creatorProfileId": "creator-1",
  "generatedAt": "2026-07-04T21:00:00.000Z",
  "sessionHealthScore": 88,
  "revenueScore": 85,
  "engagementScore": 72,
  "consistencyScore": 80,
  "gifterQualityScore": 70,
  "coachingOpportunityScore": 24,
  "overallScore": 78,
  "keyStrengths": ["Gift revenue correlated strongly with captured timeline activity."],
  "keyRisks": [],
  "topSignals": [],
  "topGifters": [],
  "topTriggerTypes": [],
  "bestMoments": [],
  "weakMoments": [],
  "recommendedNextActions": [],
  "dataQualityWarnings": []
}
```

Audit events: `live.intelligence_snapshot.generated`, `live.intelligence_snapshot.viewed`.

---

## Creator intelligence profile

Deterministic creator-level intelligence profile built from recent live sessions, session intelligence snapshots, gifter rollups, trigger analysis, recommendations, and coach alerts. Implemented on the Creators API; see [Creators API — Creator intelligence profile](./creators.md#creator-intelligence-profile).

| Method | Path                                    | Permission   | Description                                   |
| ------ | --------------------------------------- | ------------ | --------------------------------------------- |
| POST   | `/api/creators/:creatorId/intelligence` | `crm:update` | Generate/replace creator intelligence profile |
| GET    | `/api/creators/:creatorId/intelligence` | `crm:read`   | Read stored creator intelligence profile      |

Stored on `CreatorProfile.metadata.intelligenceProfile`. Regenerating replaces the previous profile. GET returns `404` when no profile exists.

### Creator profile scoring heuristics

| Score                    | Heuristic                                                                     |
| ------------------------ | ----------------------------------------------------------------------------- |
| `creatorHealthScore`     | Average session intelligence health scores (fallback heuristics when missing) |
| `revenueTrendScore`      | Recent vs older session gift revenue comparison                               |
| `engagementTrendScore`   | Average engagement from snapshots or session rollups                          |
| `gifterRetentionScore`   | Returning gifters plus WHALE/VIP concentration                                |
| `consistencyScore`       | Average consistency from snapshots or ENDED session ratio                     |
| `campaignReadinessScore` | Campaign-linked sessions plus snapshot readiness signals                      |
| `overallScore`           | Average of the six dimension scores                                           |

Missing upstream snapshots produce `dataQualityWarnings` rather than failing generation.

Audit events: `creator.intelligence_profile.generated`, `creator.intelligence_profile.viewed`.

---

## Live trend detection

Deterministic creator-level live trend snapshot comparing recent and prior session windows. Implemented on the Creators API; see [Creators API — Live trend detection](./creators.md#live-trend-detection).

| Method | Path                                   | Permission   | Description                                  |
| ------ | -------------------------------------- | ------------ | -------------------------------------------- |
| POST   | `/api/creators/:creatorId/trends/live` | `crm:update` | Generate/replace creator live trend snapshot |
| GET    | `/api/creators/:creatorId/trends/live` | `crm:read`   | Read stored creator live trend snapshot      |

Stored on `CreatorProfile.metadata.liveTrendSnapshot`. Regenerating replaces the previous snapshot. GET returns `404` when no snapshot exists.

### Trend window rules

| Rule             | Value                                                                |
| ---------------- | -------------------------------------------------------------------- |
| Recent window    | Latest 5 live sessions                                               |
| Prior window     | Previous 5 live sessions                                             |
| Minimum sessions | Fewer than 3 total sessions → `overallDirection = INSUFFICIENT_DATA` |
| Metric direction | `UP` / `DOWN` / `FLAT` / `INSUFFICIENT_DATA`                         |
| Confidence       | Clamped 0–1 based on window coverage and snapshot availability       |

Missing session intelligence snapshots produce `dataQualityWarnings` rather than failing generation.

Audit events: `creator.live_trends.generated`, `creator.live_trends.viewed`.

---

## Creator live schedules

| Method | Path                              | Permission   | Description     |
| ------ | --------------------------------- | ------------ | --------------- |
| GET    | `/api/live/schedules`             | `crm:read`   | List schedules  |
| POST   | `/api/live/schedules`             | `crm:update` | Create schedule |
| GET    | `/api/live/schedules/:scheduleId` | `crm:read`   | Schedule detail |
| PATCH  | `/api/live/schedules/:scheduleId` | `crm:update` | Update schedule |
| DELETE | `/api/live/schedules/:scheduleId` | `crm:update` | Delete schedule |

### Schedule list query parameters

| Param              | Type    | Description             |
| ------------------ | ------- | ----------------------- |
| `creatorProfileId` | string  | Filter by creator       |
| `active`           | boolean | Filter active schedules |

### Schedule create body

```json
{
  "creatorProfileId": "clxyz...",
  "timezone": "America/Los_Angeles",
  "recurrenceRule": "FREQ=WEEKLY",
  "weekdays": [1, 3, 5],
  "startTime": "20:00",
  "endTime": "22:00",
  "active": true,
  "metadata": {}
}
```

Validation:

- `weekdays` values must be integers `0` (Sunday) through `6` (Saturday).
- `startTime` and `endTime` must be local `HH:mm` strings in the schedule timezone.

---

## Planned endpoints (not implemented)

| Area                   | Paths                                            |
| ---------------------- | ------------------------------------------------ |
| Real-time coach        | `GET /api/live/sessions/:sessionId/coach/stream` |
| AI narrative summaries | Future AI-enhanced summary layer                 |

---

## Audit events

| Action                                 | When                            | Target type      |
| -------------------------------------- | ------------------------------- | ---------------- |
| `live.session.created`                 | Session created                 | `live_session`   |
| `live.session.updated`                 | Session updated                 | `live_session`   |
| `live.session.status_changed`          | Status transition               | `live_session`   |
| `live.schedule.created`                | Schedule created                | `live_schedule`  |
| `live.schedule.updated`                | Schedule updated                | `live_schedule`  |
| `live.schedule.deleted`                | Schedule deleted                | `live_schedule`  |
| `live.event.ingested`                  | Event ingested                  | `live_event`     |
| `live.event.batch_ingested`            | Batch ingest complete           | `live_session`   |
| `live.gifter_profile.viewed`           | Gifter profile detail read      | `gifter_profile` |
| `live.gifter_rollup.processed`         | Gifter rollup job complete      | `live_session`   |
| `live.timeline.viewed`                 | Session timeline read           | `live_session`   |
| `live.replay.viewed`                   | Session replay read             | `live_session`   |
| `live.trigger_analysis.generated`      | Trigger analysis generated      | `live_session`   |
| `live.trigger_analysis.viewed`         | Trigger analysis read           | `live_session`   |
| `live.session_summary.generated`       | Session summary generated       | `live_session`   |
| `live.session_summary.viewed`          | Session summary read            | `live_session`   |
| `live.recommendations.generated`       | Coach recommendations generated | `live_session`   |
| `live.recommendations.viewed`          | Coach recommendations read      | `live_session`   |
| `live.coach_alerts.generated`          | Coach alerts generated          | `live_session`   |
| `live.coach_alerts.viewed`             | Coach alerts read               | `live_session`   |
| `live.intelligence_snapshot.generated` | Intelligence snapshot generated | `live_session`   |
| `live.intelligence_snapshot.viewed`    | Intelligence snapshot read      | `live_session`   |

---

## Error handling

| Code  | Condition                                                   |
| ----- | ----------------------------------------------------------- |
| `400` | Invalid status transition, payload, platform, or batch size |
| `403` | Missing org context or permission                           |
| `404` | Cross-org or missing resource                               |

---

## Related docs

- [Product plan](../product/live-intelligence.md)
- [Architecture](../architecture/live-intelligence.md)
- [Database ERD](../database/live-intelligence-erd.md)

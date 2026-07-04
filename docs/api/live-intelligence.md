# Live Intelligence API

**Status:** Implemented (sessions, schedules, events, gifter profiles, rollups, timeline/replay/highlights)  
**Base path:** `/api/live`  
**Auth:** Bearer JWT with active organization context

---

## Overview

Live Intelligence APIs manage live sessions, creator live schedules, append-only session event timelines, gifter profile analytics, and timeline replay/highlights. Trigger analysis and AI summaries are planned for later phases.

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

| Area            | Paths                                            |
| --------------- | ------------------------------------------------ |
| AI summaries    | `GET /api/live/sessions/:sessionId/summary`      |
| Real-time coach | `GET /api/live/sessions/:sessionId/coach/stream` |

---

## Audit events

| Action                         | When                       | Target type      |
| ------------------------------ | -------------------------- | ---------------- |
| `live.session.created`         | Session created            | `live_session`   |
| `live.session.updated`         | Session updated            | `live_session`   |
| `live.session.status_changed`  | Status transition          | `live_session`   |
| `live.schedule.created`        | Schedule created           | `live_schedule`  |
| `live.schedule.updated`        | Schedule updated           | `live_schedule`  |
| `live.schedule.deleted`        | Schedule deleted           | `live_schedule`  |
| `live.event.ingested`          | Event ingested             | `live_event`     |
| `live.event.batch_ingested`    | Batch ingest complete      | `live_session`   |
| `live.gifter_profile.viewed`   | Gifter profile detail read | `gifter_profile` |
| `live.gifter_rollup.processed` | Gifter rollup job complete | `live_session`   |
| `live.timeline.viewed`         | Session timeline read      | `live_session`   |
| `live.replay.viewed`           | Session replay read        | `live_session`   |

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

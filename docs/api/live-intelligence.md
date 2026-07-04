# Live Intelligence API

**Status:** Implemented (sessions, schedules, events, gifter profile read APIs)  
**Base path:** `/api/live`  
**Auth:** Bearer JWT with active organization context

---

## Overview

Live Intelligence APIs manage live sessions, creator live schedules, append-only session event timelines, and read-only gifter profile analytics. Trigger analysis and AI summaries are planned for later phases.

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
| Timeline merge  | `GET /api/live/sessions/:sessionId/timeline`     |
| AI summaries    | `GET /api/live/sessions/:sessionId/summary`      |
| Real-time coach | `GET /api/live/sessions/:sessionId/coach/stream` |

---

## Audit events

| Action                        | When                       | Target type      |
| ----------------------------- | -------------------------- | ---------------- |
| `live.session.created`        | Session created            | `live_session`   |
| `live.session.updated`        | Session updated            | `live_session`   |
| `live.session.status_changed` | Status transition          | `live_session`   |
| `live.schedule.created`       | Schedule created           | `live_schedule`  |
| `live.schedule.updated`       | Schedule updated           | `live_schedule`  |
| `live.schedule.deleted`       | Schedule deleted           | `live_schedule`  |
| `live.event.ingested`         | Event ingested             | `live_event`     |
| `live.event.batch_ingested`   | Batch ingest complete      | `live_session`   |
| `live.gifter_profile.viewed`  | Gifter profile detail read | `gifter_profile` |

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

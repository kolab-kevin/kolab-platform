# Live Intelligence API

**Status:** Implemented (sessions + schedules foundation)  
**Base path:** `/api/live`  
**Auth:** Bearer JWT with active organization context

---

## Overview

Live Intelligence APIs manage live sessions and creator live schedules. Event ingestion, gifter profiles, trigger analytics, and AI summaries are planned for later phases.

All routes are organization-scoped. Cross-org resource IDs return `404`.

---

## Permissions

| Permission   | Used for                                    |
| ------------ | ------------------------------------------- |
| `crm:read`   | List/get sessions and schedules             |
| `crm:update` | Create/update session status, schedule CRUD |

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

Event timeline schema (`LiveEvent`) is implemented in PostgreSQL. Ingest and read APIs are planned for a later phase.

| Area              | Paths                                            |
| ----------------- | ------------------------------------------------ |
| Event ingestion   | `POST /api/live/sessions/:sessionId/events`      |
| Event timeline    | `GET /api/live/sessions/:sessionId/events`       |
| Timeline / replay | `GET /api/live/sessions/:sessionId/timeline`     |
| Gifter profiles   | `GET /api/live/gifters`                          |
| AI summaries      | `GET /api/live/sessions/:sessionId/summary`      |
| Real-time coach   | `GET /api/live/sessions/:sessionId/coach/stream` |

### Planned event model (schema implemented)

Append-only `live_events` rows are organization-scoped, linked to `LiveSession`, and denormalize `creatorProfileId` for creator timeline queries. No raw audio or video — `payload` holds event-specific metadata only.

| Field             | Notes                                                                |
| ----------------- | -------------------------------------------------------------------- |
| `eventType`       | `LiveEventType` enum (gifts, chat, transcripts, PK, etc.)            |
| `occurredAt`      | Wall-clock timestamp                                                 |
| `offsetMs`        | Nullable replay offset from session start                            |
| `platformEventId` | Nullable idempotency key (unique per org + platform)                 |
| `externalActorId` | Nullable platform actor/gifter ID                                    |
| `payload`         | Event-specific JSON (gift type, chat text, transcript segment, etc.) |

> **Privacy:** `CHAT_MESSAGE` and `VOICE_TRANSCRIPT_SEGMENT` payloads may contain sensitive text. Access must be RBAC-controlled with retention and erasure policies — see [Database ERD](../database/live-intelligence-erd.md#privacy-and-sensitive-data).

---

## Audit events

| Action                        | When              | Target type     |
| ----------------------------- | ----------------- | --------------- |
| `live.session.created`        | Session created   | `live_session`  |
| `live.session.updated`        | Session updated   | `live_session`  |
| `live.session.status_changed` | Status transition | `live_session`  |
| `live.schedule.created`       | Schedule created  | `live_schedule` |
| `live.schedule.updated`       | Schedule updated  | `live_schedule` |
| `live.schedule.deleted`       | Schedule deleted  | `live_schedule` |

---

## Error handling

| Code  | Condition                               |
| ----- | --------------------------------------- |
| `400` | Invalid status transition or validation |
| `403` | Missing org context or permission       |
| `404` | Cross-org or missing resource           |

---

## Related docs

- [Product plan](../product/live-intelligence.md)
- [Architecture](../architecture/live-intelligence.md)
- [Database ERD](../database/live-intelligence-erd.md)

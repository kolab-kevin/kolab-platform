# Live Intelligence API (Planning)

**Status:** Planning — not implemented in `@kolab/api`  
**Base path (planned):** `/api/live`  
**Auth:** Bearer JWT with active organization context

---

## Overview

Live Intelligence APIs provide session management, event ingestion, timeline retrieval, gifter profiles, trigger analytics, and post-live summaries. All routes are organization-scoped.

**Not implemented:** Prisma schema, controllers, AI inference, platform webhooks, frontend.

---

## Permissions (planned)

| Permission    | Used for                                           |
| ------------- | -------------------------------------------------- |
| `live:read`   | Sessions, timeline, profiles, summaries, analytics |
| `live:write`  | Schedules, manual tags, ingest (service account)   |
| `live:admin`  | Retention config, exports, erasure requests        |
| `live:ingest` | Platform webhook / worker ingestion only           |

| Role             | Read            | Write | Admin |
| ---------------- | --------------- | ----- | ----- |
| `ORG_OWNER`      | Yes             | Yes   | Yes   |
| `ORG_ADMIN`      | Yes             | Yes   | Yes   |
| `AGENCY_MANAGER` | Yes             | Yes   | No    |
| `RECRUITER`      | Assigned roster | No    | No    |
| `MODERATOR`      | Yes             | No    | No    |
| `VIEWER`         | No              | No    | No    |

Recruiters see gifter profiles only for creators on their assigned roster (enforced in service layer).

---

## Live sessions

| Method | Path                                  | Permission   | Description                                     |
| ------ | ------------------------------------- | ------------ | ----------------------------------------------- |
| GET    | `/api/live/sessions`                  | `live:read`  | List sessions (filter by creator, status, date) |
| POST   | `/api/live/sessions`                  | `live:write` | Create scheduled session                        |
| GET    | `/api/live/sessions/:sessionId`       | `live:read`  | Session detail                                  |
| PATCH  | `/api/live/sessions/:sessionId`       | `live:write` | Update metadata / schedule                      |
| POST   | `/api/live/sessions/:sessionId/start` | `live:write` | Mark LIVE                                       |
| POST   | `/api/live/sessions/:sessionId/end`   | `live:write` | Mark ENDED; enqueue summary                     |

### List query parameters

| Param              | Type     | Description         |
| ------------------ | -------- | ------------------- |
| `cursor`           | string   | Pagination          |
| `limit`            | number   | Max 100, default 20 |
| `creatorProfileId` | string   | Filter              |
| `campaignId`       | string   | Filter              |
| `status`           | enum     | `LiveSessionStatus` |
| `from` / `to`      | datetime | Date range          |

---

## Creator live schedule

| Method | Path                              | Permission   | Description              |
| ------ | --------------------------------- | ------------ | ------------------------ |
| GET    | `/api/live/schedules`             | `live:read`  | List schedules           |
| POST   | `/api/live/schedules`             | `live:write` | Create schedule entry    |
| PATCH  | `/api/live/schedules/:scheduleId` | `live:write` | Update                   |
| DELETE | `/api/live/schedules/:scheduleId` | `live:write` | Soft-delete / deactivate |

---

## Event ingestion

| Method | Path                                         | Permission    | Description            |
| ------ | -------------------------------------------- | ------------- | ---------------------- |
| POST   | `/api/live/sessions/:sessionId/events`       | `live:ingest` | Single event ingest    |
| POST   | `/api/live/sessions/:sessionId/events/batch` | `live:ingest` | Batch ingest (max 500) |

### Ingest body (example)

```json
{
  "eventType": "GIFT_RECEIVED",
  "occurredAt": "2026-07-03T18:45:12.000Z",
  "platformEventId": "tt-gift-abc123",
  "externalGifterId": "gifter-789",
  "gifterDisplayName": "Fan123",
  "payload": {
    "giftType": "ROSE",
    "quantity": 5,
    "diamondValue": 50
  }
}
```

Idempotent on `(organizationId, platformEventId)`. Returns `409` on duplicate with existing event ID.

Platform webhook route (future):

| Method | Path                           | Auth                   | Description     |
| ------ | ------------------------------ | ---------------------- | --------------- |
| POST   | `/api/live/webhooks/:platform` | Signature verification | External ingest |

---

## Timeline and replay

| Method | Path                                              | Permission  | Description                  |
| ------ | ------------------------------------------------- | ----------- | ---------------------------- |
| GET    | `/api/live/sessions/:sessionId/timeline`          | `live:read` | Merged event stream          |
| GET    | `/api/live/sessions/:sessionId/timeline/gifts`    | `live:read` | Gift events only             |
| GET    | `/api/live/sessions/:sessionId/timeline/triggers` | `live:read` | Trigger analysis for session |

### Timeline query

| Param          | Type     | Description             |
| -------------- | -------- | ----------------------- |
| `fromOffsetMs` | number   | Filter by stream offset |
| `toOffsetMs`   | number   | Filter by stream offset |
| `eventTypes`   | string[] | Filter by type          |
| `cursor`       | string   | Keyset pagination       |

---

## Gifter profiles

| Method | Path                                          | Permission  | Description                        |
| ------ | --------------------------------------------- | ----------- | ---------------------------------- |
| GET    | `/api/live/gifters`                           | `live:read` | List/search gifters                |
| GET    | `/api/live/gifters/:gifterProfileId`          | `live:read` | Profile detail                     |
| GET    | `/api/live/gifters/:gifterProfileId/sessions` | `live:read` | Sessions where gifter participated |
| GET    | `/api/live/gifters/:gifterProfileId/triggers` | `live:read` | Trigger score breakdown            |

Audit event: `live.gifter.viewed` on detail access.

---

## Post-live summary and analytics

| Method | Path                                             | Permission   | Description               |
| ------ | ------------------------------------------------ | ------------ | ------------------------- |
| GET    | `/api/live/sessions/:sessionId/summary`          | `live:read`  | Post-live AI summary      |
| POST   | `/api/live/sessions/:sessionId/summary/generate` | `live:write` | Trigger (re)generation    |
| GET    | `/api/live/analytics/triggers`                   | `live:read`  | Org-level trigger rollups |
| GET    | `/api/live/analytics/gifters/clusters`           | `live:read`  | Gifter cluster segments   |
| GET    | `/api/live/analytics/creators/:creatorProfileId` | `live:read`  | Creator live performance  |

Summary response includes `disclaimer` on all AI-derived fields.

---

## Real-time coach (later phase)

| Method | Path                                         | Permission  | Description      |
| ------ | -------------------------------------------- | ----------- | ---------------- |
| GET    | `/api/live/sessions/:sessionId/coach/stream` | `live:read` | SSE coach alerts |

Credits debited per org policy — see [Token economy](../product/token-economy.md).

---

## Audit events (planned)

| Action                    | When                    | Target type            |
| ------------------------- | ----------------------- | ---------------------- |
| `live.session.created`    | Session created         | `live_session`         |
| `live.session.started`    | Session started         | `live_session`         |
| `live.session.ended`      | Session ended           | `live_session`         |
| `live.event.ingested`     | Event ingested          | `live_event`           |
| `live.gifter.viewed`      | Profile detail viewed   | `gifter_profile`       |
| `live.summary.generated`  | Summary completed       | `live_session_summary` |
| `live.analysis.completed` | Trigger analysis stored | `trigger_analysis`     |

---

## Error handling

| Code  | Condition                                |
| ----- | ---------------------------------------- |
| `400` | Invalid event payload or transition      |
| `403` | Insufficient permission or roster scope  |
| `404` | Cross-org or missing resource            |
| `409` | Duplicate platform event ID              |
| `422` | Session not in valid state for operation |

---

## Organization isolation

Every query filters by JWT `organizationId`. Cross-org session or gifter IDs return `404`.

---

## Related docs

- [Product plan](../product/live-intelligence.md)
- [Architecture](../architecture/live-intelligence.md)
- [Database ERD](../database/live-intelligence-erd.md)

# Recruitment CRM API (Release 0.3)

**Status:** Planning — not yet implemented in `@kolab/api`  
**Base path:** `/api/recruitment`  
**Auth:** Bearer JWT with active organization context  
**Org type:** `AGENCY` only

---

## Overview

Planned REST API for Creator Recruitment CRM. All routes require organization membership and agency org type. Permission checks use existing `@RequirePermissions()` guards plus service-layer ownership rules for recruiters.

---

## Permissions summary

| Permission      | Used for                              |
| --------------- | ------------------------------------- |
| `org:read`      | Implicit org context (existing)       |
| `leads:read`    | List/get leads                        |
| `leads:create`  | Create leads                          |
| `leads:update`  | Update lead fields, status, follow-up |
| `leads:assign`  | Assign / reassign / return to pool    |
| `leads:convert` | Convert signed lead to active creator |

Recruiters with `leads:read` / `leads:update` are scoped to **owned leads** unless they hold `leads:assign`.

---

## Endpoints (planned)

### Leads

| Method | Path                                   | Permission      | Description                                    |
| ------ | -------------------------------------- | --------------- | ---------------------------------------------- |
| GET    | `/api/recruitment/leads`               | `leads:read`    | List leads (filter, search, cursor pagination) |
| POST   | `/api/recruitment/leads`               | `leads:create`  | Create lead (creator becomes owner by default) |
| GET    | `/api/recruitment/leads/:id`           | `leads:read`    | Get lead detail                                |
| PATCH  | `/api/recruitment/leads/:id`           | `leads:update`  | Update lead profile fields                     |
| PATCH  | `/api/recruitment/leads/:id/status`    | `leads:update`  | Transition pipeline status                     |
| POST   | `/api/recruitment/leads/:id/claim`     | `leads:update`  | Claim unassigned lead (first owner wins)       |
| POST   | `/api/recruitment/leads/:id/assign`    | `leads:assign`  | Manager assign or reassign recruiter           |
| POST   | `/api/recruitment/leads/:id/unassign`  | `leads:assign`  | Return lead to unassigned pool                 |
| POST   | `/api/recruitment/leads/:id/convert`   | `leads:convert` | Convert `SIGNED` lead to active creator        |
| PATCH  | `/api/recruitment/leads/:id/follow-up` | `leads:update`  | Set or clear `nextFollowUpAt`                  |

### Platform accounts

| Method | Path                                               | Permission     | Description                     |
| ------ | -------------------------------------------------- | -------------- | ------------------------------- |
| GET    | `/api/recruitment/leads/:id/platforms`             | `leads:read`   | List platform accounts for lead |
| POST   | `/api/recruitment/leads/:id/platforms`             | `leads:update` | Add platform account            |
| PATCH  | `/api/recruitment/leads/:id/platforms/:platformId` | `leads:update` | Update platform account         |
| DELETE | `/api/recruitment/leads/:id/platforms/:platformId` | `leads:update` | Remove platform account         |

### Activities (notes / contact history)

| Method | Path                                    | Permission     | Description          |
| ------ | --------------------------------------- | -------------- | -------------------- |
| GET    | `/api/recruitment/leads/:id/activities` | `leads:read`   | List contact history |
| POST   | `/api/recruitment/leads/:id/activities` | `leads:update` | Log contact / note   |

---

## List leads query params (planned)

| Param                 | Type     | Description                                      |
| --------------------- | -------- | ------------------------------------------------ |
| `cursor`              | string   | Pagination cursor                                |
| `limit`               | number   | Max 100, default 20                              |
| `status`              | enum     | Filter by lead status                            |
| `assignedRecruiterId` | string   | Filter by owner (`unassigned` sentinel optional) |
| `platform`            | enum     | Leads with platform account on platform          |
| `search`              | string   | Match name, nickname, email, username            |
| `followUpBefore`      | ISO date | Due follow-ups                                   |
| `followUpAfter`       | ISO date | Scheduled follow-ups                             |
| `minScore`            | number   | Minimum lead score                               |

---

## Lead response shape (planned)

```json
{
  "id": "clx...",
  "organizationId": "clx...",
  "name": "Jane Creator",
  "nickname": "janecreates",
  "email": "jane@example.com",
  "phone": "+15551234567",
  "country": "US",
  "languages": ["en"],
  "source": "SOCIAL",
  "status": "INTERESTED",
  "score": 45,
  "assignedRecruiterId": "clx...",
  "assignedAt": "2026-06-28T10:00:00.000Z",
  "nextFollowUpAt": "2026-06-30T15:00:00.000Z",
  "commissionPlan": "STANDARD",
  "convertedUserId": null,
  "convertedAt": null,
  "notesSummary": "Interested in TikTok live commerce",
  "createdAt": "2026-06-20T08:00:00.000Z",
  "updatedAt": "2026-06-28T10:00:00.000Z"
}
```

Never returns internal-only fields or secrets.

---

## Create lead request (planned)

```json
{
  "name": "Jane Creator",
  "nickname": "janecreates",
  "email": "jane@example.com",
  "phone": "+15551234567",
  "country": "US",
  "languages": ["en"],
  "source": "MANUAL",
  "notesSummary": "Found via TikTok live",
  "commissionPlan": "STANDARD",
  "platformAccounts": [
    {
      "platform": "TIKTOK",
      "username": "janecreates",
      "profileUrl": "https://www.tiktok.com/@janecreates",
      "followers": 125000,
      "verified": false
    }
  ]
}
```

Creating a lead as a recruiter sets `assignedRecruiterId` to the authenticated user.

---

## Log activity request (planned)

```json
{
  "type": "WHATSAPP",
  "summary": "Sent intro message and agency overview PDF",
  "occurredAt": "2026-06-28T09:30:00.000Z",
  "metadata": {
    "durationMinutes": 5
  }
}
```

Activity types: `CALL`, `WHATSAPP`, `TIKTOK`, `FACEBOOK`, `EMAIL`, `MEETING`, `OTHER`.

---

## Assign lead request (planned)

```json
{
  "recruiterUserId": "clx...",
  "reason": "Territory reassignment — US West"
}
```

Requires `leads:assign`. Writes assignment log + audit event.

---

## Convert lead request (planned)

```json
{
  "createInvitation": false
}
```

**Preconditions:** lead status is `SIGNED`.

**Effects:**

- Set status `ACTIVE_CREATOR`
- Link or create `User` and `OrganizationMembership` with role `CREATOR`
- Set `convertedUserId`, `convertedAt`
- Audit `lead.converted`

---

## Status update request (planned)

```json
{
  "status": "CONTRACT_SENT",
  "reason": "Standard creator agreement sent via email"
}
```

Invalid transitions return `400 Bad Request`.

---

## Error responses

| Code  | Condition                                                                      |
| ----- | ------------------------------------------------------------------------------ |
| `403` | Non-agency org, missing permission, or recruiter accessing another user's lead |
| `404` | Lead or sub-resource not found in org scope                                    |
| `409` | Claim conflict — lead already assigned                                         |
| `400` | Validation failure or invalid status transition                                |

---

## Audit events (planned)

| Action                 | Trigger                   |
| ---------------------- | ------------------------- |
| `lead.created`         | Lead created              |
| `lead.updated`         | Profile fields updated    |
| `lead.status_changed`  | Status transition         |
| `lead.claimed`         | Recruiter claim           |
| `lead.reassigned`      | Manager assign / reassign |
| `lead.converted`       | Signed → active creator   |
| `lead.activity_logged` | Contact note added        |

---

## In v1 API scope

- Lead CRUD + list filters
- Claim / assign / unassign
- Status workflow through conversion
- Platform account sub-resource
- Activity log
- Follow-up date updates
- Commission plan field (`STANDARD` default)

---

## Not in v1 API

- Campaign endpoints
- Payment / commission calculation endpoints
- TikTok OAuth or profile sync
- Bulk CSV import
- Recruiter leaderboard / analytics endpoints
- Webhooks

---

## Related documents

- [Product plan](../product/recruitment-crm.md)
- [Architecture](../architecture/recruitment-crm.md)
- [Database ERD](../database/recruitment-crm-erd.md)
- [Agency management API](./agency.md)

# Recruitment CRM API (Release 0.3)

**Status:** Implemented in `@kolab/api`  
**Base path:** `/api/recruitment/leads`  
**Auth:** Bearer JWT with active organization context

---

## Overview

REST API for Creator Recruitment CRM lead management. All routes require an active organization membership in the JWT. Authorization uses dedicated CRM permissions from the organization role matrix in `@kolab/auth`.

---

## Permissions

| Permission   | Used for                                                 |
| ------------ | -------------------------------------------------------- |
| `crm:read`   | List and get leads                                       |
| `crm:create` | Create leads                                             |
| `crm:update` | Update lead profile fields                               |
| `crm:delete` | Soft delete leads                                        |
| `crm:assign` | Claim, reassign, unassign leads; list own assigned leads |

Role matrix (Release 0.3):

| Role             | CRM permissions                                      |
| ---------------- | ---------------------------------------------------- |
| `ORG_OWNER`      | all (`read`, `create`, `update`, `delete`, `assign`) |
| `ORG_ADMIN`      | all                                                  |
| `AGENCY_MANAGER` | all                                                  |
| `RECRUITER`      | `read`, `create`, `update`, `assign`                 |
| `MODERATOR`      | `read` only                                          |
| `SUPPORT`        | `read` only                                          |
| `CREATOR`        | none                                                 |
| `FINANCE`        | none                                                 |
| `VIEWER`         | none                                                 |

`SYSTEM_ADMIN` (`isSystemAdmin: true`) bypasses authorization guards on protected routes.

---

## Endpoints

| Method | Path                                       | Permission   | Description                              |
| ------ | ------------------------------------------ | ------------ | ---------------------------------------- |
| GET    | `/api/recruitment/leads`                   | `crm:read`   | List leads (filter, search, pagination)  |
| GET    | `/api/recruitment/leads/:id`               | `crm:read`   | Get lead detail with related records     |
| POST   | `/api/recruitment/leads`                   | `crm:create` | Create lead                              |
| PATCH  | `/api/recruitment/leads/:id`               | `crm:update` | Update lead profile fields only          |
| POST   | `/api/recruitment/leads/:id/status`        | `crm:update` | Transition lead pipeline status          |
| DELETE | `/api/recruitment/leads/:id`               | `crm:delete` | Soft delete lead                         |
| POST   | `/api/recruitment/leads/:id/claim`         | `crm:assign` | Claim an unassigned lead                 |
| POST   | `/api/recruitment/leads/:id/reassign`      | `crm:assign` | Manager reassign to another recruiter    |
| POST   | `/api/recruitment/leads/:id/unassign`      | `crm:assign` | Manager return lead to unassigned pool   |
| GET    | `/api/recruitment/my-leads`                | `crm:assign` | List leads assigned to current recruiter |
| GET    | `/api/recruitment/follow-ups`              | `crm:read`   | List scheduled follow-ups for recruiter  |
| PATCH  | `/api/recruitment/leads/:id/follow-up`     | `crm:update` | Set, update, or clear lead follow-up     |
| GET    | `/api/recruitment/leads/:id/timeline`      | `crm:read`   | Combined chronological activity timeline |
| GET    | `/api/recruitment/leads/:id/notes`         | `crm:read`   | List lead notes (newest first)           |
| POST   | `/api/recruitment/leads/:id/notes`         | `crm:update` | Add lead communication note              |
| PATCH  | `/api/recruitment/leads/:id/notes/:noteId` | `crm:update` | Edit note (author or manager)            |
| DELETE | `/api/recruitment/leads/:id/notes/:noteId` | `crm:update` | Soft delete note                         |

Creator conversion and payments are **not** implemented in this release. Pipeline status transitions are available via `POST /api/recruitment/leads/:id/status` (without creator onboarding side effects). Follow-up scheduling and due/overdue workflows are available via `/api/recruitment/follow-ups` and `PATCH /api/recruitment/leads/:id/follow-up`.

---

## Assignment workflow

### Rules

1. New leads start **unassigned** (`assignedRecruiterId: null`).
2. The first recruiter to successfully **claim** a lead becomes its owner.
3. Once claimed, no other recruiter may claim it (`409 Conflict`).
4. Only `ORG_OWNER`, `ORG_ADMIN`, and `AGENCY_MANAGER` may **reassign** or **unassign**.
5. Recruiters may claim leads and view their own assigned leads via **My Leads**.
6. Every assignment change writes a `LeadAssignment` history row inside a database transaction.

Concurrent claims are prevented by updating the lead only when `assignedRecruiterId` is still `null`.

### POST `/api/recruitment/leads/:id/claim`

Claims an unassigned lead for the authenticated recruiter.

**Response (200):**

```json
{
  "lead": { "...": "CreatorLead fields" },
  "assignment": { "...": "LeadAssignment fields" }
}
```

**Errors:** `404` deleted/missing lead; `409` already claimed.

### POST `/api/recruitment/leads/:id/reassign`

Manager-only. Assigns the lead to another active organization member.

**Request:**

```json
{
  "recruiterUserId": "clx...",
  "reason": "Territory change"
}
```

Validation rejects inactive members, suspended members, `CREATOR`, and `VIEWER` assignees.

**Errors:** `403` non-manager; `400` invalid assignee; `404` missing lead.

### POST `/api/recruitment/leads/:id/unassign`

Manager-only. Closes the current assignment and clears lead ownership.

**Request (optional body):**

```json
{
  "reason": "Returned to pool"
}
```

**Errors:** `403` non-manager; `409` lead already unassigned.

### GET `/api/recruitment/my-leads`

Returns leads assigned to the authenticated recruiter.

Query parameters:

| Param            | Type   | Description                              |
| ---------------- | ------ | ---------------------------------------- |
| `cursor`         | string | Pagination cursor                        |
| `limit`          | number | Max 100, default 20                      |
| `status`         | enum   | Filter by lead status                    |
| `search`         | string | Match name, nickname, email, or username |
| `platform`       | enum   | Filter by platform account               |
| `followUpBefore` | ISO    | Leads with follow-up on or before date   |

---

## Follow-up workflow

Follow-ups use the existing `CreatorLead.nextFollowUpAt` field. History is stored in `CreatorLead.metadata.followUpHistory` (no schema migration).

### Follow-up rules

1. Only leads **assigned to the authenticated recruiter** appear in the follow-ups list.
2. List results include only leads with `nextFollowUpAt` set; soft-deleted leads are excluded; `REJECTED` leads are excluded unless filtered explicitly by `status`.
3. Recruiters may set, update, or clear follow-ups only on **their own assigned** leads.
4. `ORG_OWNER`, `ORG_ADMIN`, and `AGENCY_MANAGER` may update follow-ups on **any** org lead.
5. **Rejected** and **soft-deleted** leads cannot have a new follow-up scheduled (`400` / `404`).
6. Clearing a follow-up (`nextFollowUpAt: null`) is allowed, including on rejected leads.
7. An optional `note` on PATCH creates a `LeadNote` row (`contactType: OTHER`).
8. Every follow-up change records audit action `lead.followup_updated` and appends timeline event `followup.updated`.

### GET `/api/recruitment/follow-ups`

Returns paginated leads assigned to the current recruiter with a scheduled follow-up.

Query parameters:

| Param         | Type    | Description                                     |
| ------------- | ------- | ----------------------------------------------- |
| `cursor`      | string  | Pagination cursor (lead id)                     |
| `limit`       | number  | Max 100, default 20                             |
| `dueBefore`   | ISO     | Follow-ups scheduled on or before this datetime |
| `overdueOnly` | boolean | When true, only follow-ups before now           |
| `status`      | enum    | Filter by lead status                           |
| `platform`    | enum    | Filter by platform account                      |

Results are ordered by `nextFollowUpAt` ascending (soonest first).

### PATCH `/api/recruitment/leads/:id/follow-up`

Set, update, or clear the follow-up date.

**Request:**

```json
{
  "nextFollowUpAt": "2026-06-28T12:00:00.000Z",
  "note": "Reschedule after vacation"
}
```

Pass `"nextFollowUpAt": null` to clear the follow-up.

Validation uses `UpdateLeadFollowUpSchema` from `@kolab/types`.

**Response (200):**

```json
{
  "lead": { "...": "CreatorLead fields" },
  "note": { "...": "LeadNote fields when note provided" }
}
```

**Errors:** `403` recruiter updating another recruiter's lead; `400` scheduling on rejected lead; `404` missing or soft-deleted lead.

---

## GET `/api/recruitment/leads`

Query parameters:

| Param         | Type   | Description                                         |
| ------------- | ------ | --------------------------------------------------- |
| `cursor`      | string | Pagination cursor (lead id)                         |
| `limit`       | number | Max 100, default 20                                 |
| `search`      | string | Match name, nickname, email, or platform username   |
| `status`      | enum   | Filter by lead status                               |
| `source`      | enum   | Filter by lead source                               |
| `recruiterId` | string | Filter by assigned recruiter user id                |
| `platform`    | enum   | Leads with a platform account on the given platform |
| `scoreMin`    | number | Minimum lead score (0–100)                          |
| `scoreMax`    | number | Maximum lead score (0–100)                          |

Soft-deleted leads are excluded from list results.

### List response (200)

```json
{
  "items": [
    {
      "id": "clx...",
      "organizationId": "clx...",
      "name": "Jane Creator",
      "nickname": "janecreates",
      "email": "jane@example.com",
      "source": "MANUAL",
      "status": "NEW",
      "score": 50,
      "assignedRecruiterId": null,
      "assignedAt": null,
      "nextFollowUpAt": null,
      "commissionPlan": "STANDARD",
      "createdAt": "2026-06-20T08:00:00.000Z",
      "updatedAt": "2026-06-20T08:00:00.000Z"
    }
  ],
  "nextCursor": null
}
```

---

## GET `/api/recruitment/leads/:id`

Returns the lead plus related CRM records.

### Detail response (200)

```json
{
  "lead": {
    "id": "clx...",
    "organizationId": "clx...",
    "name": "Jane Creator",
    "nickname": "janecreates",
    "email": "jane@example.com",
    "phone": "+15551234567",
    "country": "US",
    "languages": ["en"],
    "source": "MANUAL",
    "status": "NEW",
    "score": 50,
    "assignedRecruiterId": null,
    "assignedAt": null,
    "nextFollowUpAt": null,
    "commissionPlan": "STANDARD",
    "convertedUserId": null,
    "convertedAt": null,
    "notesSummary": null,
    "metadata": {},
    "createdAt": "2026-06-20T08:00:00.000Z",
    "updatedAt": "2026-06-20T08:00:00.000Z"
  },
  "platformAccounts": [],
  "currentAssignment": null,
  "assignmentHistory": [],
  "notes": [],
  "statusHistory": []
}
```

**Errors:** `404` if the lead does not exist, belongs to another organization, or is soft deleted.

---

## POST `/api/recruitment/leads`

Creates a lead scoped to the active organization.

Defaults:

- `status`: `NEW`
- `commissionPlan`: `STANDARD`
- `score`: `50`
- `source`: `MANUAL` when omitted
- No recruiter assignment

### Create request

```json
{
  "name": "Jane Creator",
  "nickname": "janecreates",
  "email": "jane@example.com",
  "phone": "+15551234567",
  "country": "US",
  "languages": ["en"],
  "source": "SOCIAL",
  "notesSummary": "Found via TikTok live",
  "platformAccounts": [
    {
      "platform": "TIKTOK",
      "username": "janecreates",
      "profileUrl": "https://www.tiktok.com/@janecreates",
      "followers": 125000
    }
  ]
}
```

Validation uses shared `@kolab/types` schemas (`CreateLeadSchema`).

### Create response (201)

Returns the created lead (`CreatorLead` shape).

An initial `LeadStatusHistory` row is written with `newStatus: NEW`.

---

## PATCH `/api/recruitment/leads/:id`

Updates lead profile fields only. Does **not** change pipeline status.

Validation uses `UpdateLeadSchema` from `@kolab/types`. At least one field is required.

**Errors:** `404` for missing or soft-deleted leads.

---

## POST `/api/recruitment/leads/:id/status`

Transitions lead pipeline status using controlled rules. Requires `crm:update`.

Does **not** create creator accounts when transitioning to `SIGNED` or `ACTIVE_CREATOR` — only records the status change and history.

### Status transition request

```json
{
  "status": "CONTACTED",
  "reason": "Initial outreach completed"
}
```

Validation uses `UpdateLeadStatusSchema` from `@kolab/types`.

### Status transition response (200)

```json
{
  "lead": {
    "id": "clx...",
    "status": "CONTACTED"
  },
  "statusHistory": {
    "id": "clx...",
    "previousStatus": "NEW",
    "newStatus": "CONTACTED",
    "changedById": "clx...",
    "changedAt": "2026-06-21T08:00:00.000Z",
    "reason": "Initial outreach completed"
  }
}
```

**Errors:** `400` invalid transition; `404` missing or soft-deleted lead.

### Transition matrix

| From             | Allowed to                                             |
| ---------------- | ------------------------------------------------------ |
| `NEW`            | `CONTACTED`, `INTERESTED`, `REJECTED`                  |
| `CONTACTED`      | `INTERESTED`, `APPLICATION`, `INACTIVE`, `REJECTED`    |
| `INTERESTED`     | `APPLICATION`, `CONTRACT_SENT`, `INACTIVE`, `REJECTED` |
| `APPLICATION`    | `CONTRACT_SENT`, `REJECTED`, `INACTIVE`                |
| `CONTRACT_SENT`  | `SIGNED`, `REJECTED`, `INACTIVE`                       |
| `SIGNED`         | `ACTIVE_CREATOR`, `INACTIVE`                           |
| `ACTIVE_CREATOR` | `INACTIVE`                                             |
| `INACTIVE`       | `CONTACTED`, `INTERESTED`                              |
| `REJECTED`       | `CONTACTED`                                            |

Each successful transition appends a `LeadStatusHistory` row inside a database transaction.

---

## Notes and timeline

Recruiter communication history is stored as append-only `LeadNote` rows. Soft-deleted notes and edit history are tracked in `CreatorLead.metadata.noteRecords` (no note-table schema change).

### GET `/api/recruitment/leads/:id/notes`

Returns active notes ordered **newest first**. Soft-deleted notes are excluded.

### POST `/api/recruitment/leads/:id/notes`

```json
{
  "contactType": "CALL",
  "note": "Discussed onboarding timeline"
}
```

Uses `AddLeadNoteSchema`. Notes cannot be empty.

### PATCH `/api/recruitment/leads/:id/notes/:noteId`

Uses `UpdateLeadNoteSchema`. Only the **author** or an organization **manager** (`ORG_OWNER`, `ORG_ADMIN`, `AGENCY_MANAGER`) may edit.

Edit history is preserved in lead metadata (`editHistory` entries with previous content).

### DELETE `/api/recruitment/leads/:id/notes/:noteId`

Soft deletes the note via lead metadata. Authors may delete their own notes; managers may delete any note.

### GET `/api/recruitment/leads/:id/timeline`

Returns a unified chronological stream (**newest first**) combining:

| Event type           | Source                        |
| -------------------- | ----------------------------- |
| `lead.created`       | Lead creation timestamp       |
| `assignment.started` | `LeadAssignment.assignedAt`   |
| `assignment.ended`   | `LeadAssignment.unassignedAt` |
| `status.changed`     | `LeadStatusHistory` rows      |
| `note.added`         | Active `LeadNote` rows        |
| `followup.updated`   | `metadata.followUpHistory`    |

The `type` field is extensible for future CRM timeline events.

Example event:

```json
{
  "id": "note-added-clx...",
  "type": "note.added",
  "occurredAt": "2026-06-21T10:00:00.000Z",
  "actorUserId": "clx...",
  "data": {
    "noteId": "clx...",
    "contactType": "CALL",
    "note": "Discussed onboarding timeline"
  }
}
```

---

## DELETE `/api/recruitment/leads/:id`

Soft deletes the lead by setting `metadata.deleted = true`. The row is not physically removed.

### Delete response (200)

```json
{
  "id": "clx...",
  "deleted": true
}
```

Soft-deleted leads are hidden from list and detail endpoints.

---

## Audit events

| Action                  | When                   |
| ----------------------- | ---------------------- |
| `lead.created`          | Lead created           |
| `lead.updated`          | Lead fields updated    |
| `lead.deleted`          | Lead soft deleted      |
| `lead.claimed`          | Lead claimed           |
| `lead.reassigned`       | Lead reassigned        |
| `lead.unassigned`       | Lead unassigned        |
| `lead.status_changed`   | Lead status changed    |
| `lead.note_added`       | Lead note added        |
| `lead.note_updated`     | Lead note updated      |
| `lead.note_deleted`     | Lead note deleted      |
| `lead.followup_updated` | Lead follow-up changed |

Target type: `lead`.

---

## Organization isolation

Every query and mutation is scoped to `organizationId` from the JWT. Users must have an active membership in that organization. Leads in other organizations are not visible and return `404` on direct access.

---

## Related docs

- [Recruitment CRM planning spec](./recruitment-crm.md)
- Shared types: `packages/types/src/recruitment-crm.ts`

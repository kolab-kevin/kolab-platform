# Recruitment CRM API (Release 0.3)

**Status:** Implemented in `@kolab/api`  
**Base path:** `/api/recruitment/leads`  
**Auth:** Bearer JWT with active organization context

---

## Overview

REST API for Creator Recruitment CRM lead management. All routes require an active organization membership in the JWT. Authorization uses dedicated CRM permissions from the organization role matrix in `@kolab/auth`.

---

## Permissions

| Permission   | Used for                          |
| ------------ | --------------------------------- |
| `crm:read`   | List and get leads                |
| `crm:create` | Create leads                      |
| `crm:update` | Update lead profile fields        |
| `crm:delete` | Soft delete leads                 |
| `crm:assign` | Reserved for future assign routes |

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

| Method | Path                         | Permission   | Description                             |
| ------ | ---------------------------- | ------------ | --------------------------------------- |
| GET    | `/api/recruitment/leads`     | `crm:read`   | List leads (filter, search, pagination) |
| GET    | `/api/recruitment/leads/:id` | `crm:read`   | Get lead detail with related records    |
| POST   | `/api/recruitment/leads`     | `crm:create` | Create lead                             |
| PATCH  | `/api/recruitment/leads/:id` | `crm:update` | Update lead profile fields only         |
| DELETE | `/api/recruitment/leads/:id` | `crm:delete` | Soft delete lead                        |

Status transitions, assignment, conversion, and payments are **not** implemented in this release.

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

| Action         | When                |
| -------------- | ------------------- |
| `lead.created` | Lead created        |
| `lead.updated` | Lead fields updated |
| `lead.deleted` | Lead soft deleted   |

Target type: `lead`.

---

## Organization isolation

Every query and mutation is scoped to `organizationId` from the JWT. Users must have an active membership in that organization. Leads in other organizations are not visible and return `404` on direct access.

---

## Related docs

- [Recruitment CRM planning spec](./recruitment-crm.md)
- Shared types: `packages/types/src/recruitment-crm.ts`

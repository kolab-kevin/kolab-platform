# Recruiter Profiles API (Release 0.3)

**Status:** Implemented in `@kolab/api`  
**Base path:** `/api/recruiters`  
**Auth:** Bearer JWT with active organization context

---

## Overview

REST API for managing `RecruiterProfile` records — recruiting-specific business data separate from `OrganizationMembership`.

**Important:** Permissions are always resolved from `OrganizationMembership` and the `@kolab/auth` permission matrix. A `RecruiterProfile` row does **not** grant access by itself.

---

## Permissions

| Permission   | Used for                        |
| ------------ | ------------------------------- |
| `crm:read`   | List and get recruiter profiles |
| `crm:update` | Create and update profiles      |

Additional service-layer rule: only `ORG_OWNER`, `ORG_ADMIN`, and `AGENCY_MANAGER` may create or update profiles (recruiters with `crm:update` for leads are still denied here).

`SYSTEM_ADMIN` (`isSystemAdmin: true`) bypasses authorization guards and manager role checks.

---

## Endpoints

| Method | Path                  | Permission   | Description                   |
| ------ | --------------------- | ------------ | ----------------------------- |
| GET    | `/api/recruiters`     | `crm:read`   | List recruiter profiles       |
| GET    | `/api/recruiters/:id` | `crm:read`   | Get recruiter profile detail  |
| POST   | `/api/recruiters`     | `crm:update` | Create profile for org member |
| PATCH  | `/api/recruiters/:id` | `crm:update` | Update recruiter profile      |

Responses expose recruiter profile fields only — no user credentials, emails, or other private account data.

---

## GET `/api/recruiters`

Query parameters:

| Param           | Type   | Description                                |
| --------------- | ------ | ------------------------------------------ |
| `cursor`        | string | Pagination cursor (profile id)             |
| `limit`         | number | Max 100, default 20                        |
| `status`        | enum   | Filter by `RecruiterStatus`                |
| `managerUserId` | string | Filter by manager user id                  |
| `search`        | string | Match display name, nickname, or territory |

### List response (200)

```json
{
  "items": [
    {
      "id": "clx...",
      "organizationId": "clx...",
      "userId": "clx...",
      "displayName": "Alex Recruiter",
      "nickname": "alexrecruits",
      "territory": "West",
      "status": "ACTIVE",
      "managerUserId": "clx...",
      "commissionPlan": "STANDARD",
      "monthlyLeadGoal": 20,
      "monthlyCreatorGoal": 5
    }
  ],
  "nextCursor": null
}
```

---

## GET `/api/recruiters/:id`

Returns full `RecruiterProfile` shape including languages, hire date, availability JSON, and metadata.

**Errors:** `404` if profile missing or belongs to another organization.

---

## POST `/api/recruiters`

Manager-only (service layer). Creates one profile per `(organizationId, userId)`.

### Create request

```json
{
  "userId": "clx...",
  "displayName": "Alex Recruiter",
  "nickname": "alexrecruits",
  "territory": "West",
  "languages": ["en", "es"],
  "hireDate": "2026-01-15T00:00:00.000Z",
  "commissionPlan": "STANDARD",
  "monthlyLeadGoal": 20,
  "monthlyCreatorGoal": 5,
  "managerUserId": "clx...",
  "availability": {
    "timezone": "America/Los_Angeles",
    "weekdays": [1, 2, 3, 4, 5]
  }
}
```

### Validation rules

- Target user must be an **active** organization member
- Target user role must be `RECRUITER`, `AGENCY_MANAGER`, `ORG_ADMIN`, or `ORG_OWNER`
- `managerUserId`, when provided, must reference an active organization member
- Duplicate `(organizationId, userId)` returns `409 Conflict`

### Create response (201)

Returns created `RecruiterProfile`.

---

## PATCH `/api/recruiters/:id`

Manager-only (service layer). Updates profile fields using `UpdateRecruiterProfileSchema` from `@kolab/types`.

**Errors:** `403` non-manager; `404` missing profile; `400` invalid manager member.

---

## Audit events

| Action              | When                   |
| ------------------- | ---------------------- |
| `recruiter.created` | Profile created        |
| `recruiter.updated` | Profile fields updated |

Target type: `recruiter`.

---

## Organization isolation

All queries and mutations are scoped to `organizationId` from the JWT. Users must have an active membership in that organization.

---

## Related documents

- [Recruitment CRM API](./recruitment.md)
- [Recruitment CRM ERD](../database/recruitment-crm-erd.md)
- Shared types: `packages/types/src/recruiter-profile.ts`

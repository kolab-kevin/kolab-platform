# Creators API (Release 0.3)

**Status:** Implemented in `@kolab/api`  
**Base path:** `/api/creators`  
**Auth:** Bearer JWT with active organization context

---

## Overview

Creator Management provides roster read/update APIs for creators produced by the Recruitment CRM conversion workflow (`POST /api/recruitment/leads/:id/convert`).

Creator roster records are stored on converted leads (`CreatorLead.metadata.creatorProfile`) and linked to organization memberships with role `CREATOR`.

Release 0.3 does **not** include creator dashboards, campaigns, payments, or analytics.

---

## Permissions

| Permission   | Used for              |
| ------------ | --------------------- |
| `crm:read`   | List and get creators |
| `crm:update` | Update creator fields |

All routes are scoped to the JWT `organizationId`. Users must have an active organization membership.

| Role             | List / get | Update |
| ---------------- | ---------- | ------ |
| `ORG_OWNER`      | Yes        | Yes    |
| `ORG_ADMIN`      | Yes        | Yes    |
| `AGENCY_MANAGER` | Yes        | Yes    |
| `RECRUITER`      | Yes        | Yes    |
| `MODERATOR`      | Read only  | No     |
| `SUPPORT`        | Read only  | No     |
| `VIEWER`         | No         | No     |
| `CREATOR`        | No         | No     |

`SYSTEM_ADMIN` bypasses authorization guards.

---

## Endpoints

| Method | Path                                 | Permission   | Description                    |
| ------ | ------------------------------------ | ------------ | ------------------------------ |
| GET    | `/api/creators`                      | `crm:read`   | List creators (filter, cursor) |
| GET    | `/api/creators/:id`                  | `crm:read`   | Get creator detail             |
| PATCH  | `/api/creators/:id`                  | `crm:update` | Update creator profile fields  |
| POST   | `/api/recruitment/leads/:id/convert` | `crm:update` | Convert lead to creator        |

---

## GET `/api/creators`

Returns paginated creators converted within the active organization.

Query parameters:

| Param         | Type   | Description                                                            |
| ------------- | ------ | ---------------------------------------------------------------------- |
| `cursor`      | string | Pagination cursor (creator id)                                         |
| `limit`       | number | Max 100, default 20                                                    |
| `search`      | string | Match name, email, nickname, or platform username                      |
| `platform`    | enum   | Creators with a platform account on the given platform                 |
| `recruiterId` | string | Filter by assigned recruiter user id                                   |
| `country`     | string | Filter by creator country                                              |
| `language`    | string | Filter by language code in creator languages                           |
| `status`      | enum   | Filter by creator membership status (`ACTIVE`, `SUSPENDED`, `REMOVED`) |

Results are ordered by conversion date descending (newest first).

### List response (200)

```json
{
  "items": [
    {
      "id": "creator_abc123",
      "organizationId": "clx...",
      "userId": "clx...",
      "displayName": "Jane Creator",
      "email": "jane@example.com",
      "country": "US",
      "languages": ["en"],
      "assignedRecruiterId": "clx...",
      "status": "ACTIVE",
      "platformCount": 1,
      "createdAt": "2026-06-28T12:00:00.000Z",
      "updatedAt": "2026-06-28T12:00:00.000Z"
    }
  ],
  "nextCursor": null
}
```

---

## GET `/api/creators/:id`

Returns creator profile data plus related organization context.

### Detail response (200)

```json
{
  "creator": {
    "id": "creator_abc123",
    "organizationId": "clx...",
    "userId": "clx...",
    "sourceLeadId": "clx...",
    "displayName": "Jane Creator",
    "email": "jane@example.com",
    "phone": "+15551234567",
    "country": "US",
    "languages": ["en"],
    "assignedRecruiterId": "clx...",
    "commissionPlan": "STANDARD",
    "bio": null,
    "availability": {},
    "metadata": {},
    "status": "ACTIVE",
    "platformAccounts": [],
    "createdAt": "2026-06-28T12:00:00.000Z",
    "updatedAt": "2026-06-28T12:00:00.000Z"
  },
  "user": {
    "id": "clx...",
    "email": "jane@example.com",
    "displayName": "Jane Creator",
    "avatarUrl": null
  },
  "recruiter": {
    "id": "clx...",
    "userId": "clx...",
    "displayName": "Recruiter One",
    "nickname": "rec1",
    "territory": "US",
    "status": "ACTIVE"
  },
  "organization": {
    "id": "clx...",
    "name": "Kolab Agency",
    "slug": "kolab-agency",
    "type": "AGENCY",
    "status": "ACTIVE"
  },
  "platformAccounts": []
}
```

**Errors:** `404` if the creator does not exist in the active organization.

---

## PATCH `/api/creators/:id`

Updates creator roster profile fields. Requires `crm:update`.

### Allowed fields

| Field          | Description                        |
| -------------- | ---------------------------------- |
| `displayName`  | Creator display name               |
| `bio`          | Creator biography (nullable)       |
| `country`      | Country code/name (nullable)       |
| `languages`    | Spoken language codes              |
| `availability` | JSON availability preferences      |
| `metadata`     | Extensible creator metadata object |

Validation uses `UpdateCreatorSchema` from `@kolab/types`. At least one field is required.

### Not allowed via this endpoint

- `commissionPlan` changes
- Recruiter reassignment (`assignedRecruiterId`)
- Organization changes

Commission plan and recruiter assignment remain sourced from the original lead conversion record.

### Update request

```json
{
  "displayName": "Jane Creates Live",
  "bio": "TikTok live commerce creator",
  "country": "US",
  "languages": ["en", "es"],
  "availability": {
    "timezone": "America/New_York",
    "weekdays": [1, 2, 3, 4, 5]
  },
  "metadata": {
    "preferredCategories": ["beauty", "fashion"]
  }
}
```

Updates are stored on the source lead metadata and synchronized to the linked `UserProfile` where applicable (`displayName`, `bio`, `country`, primary language).

**Errors:** `404` missing creator; `403` missing permission.

---

## Conversion entry point

| Method | Path                                 | Permission   | Description                      |
| ------ | ------------------------------------ | ------------ | -------------------------------- |
| POST   | `/api/recruitment/leads/:id/convert` | `crm:update` | Convert a signed lead to creator |

See [Recruitment CRM API](./recruitment.md#creator-conversion) for conversion workflow rules.

---

## Creator record storage

After conversion, roster data lives in:

- `CreatorLead.metadata.creatorProfile` — creator roster profile
- `CreatorLead.metadata.creatorPlatformAccounts` — copied platform accounts
- `CreatorLead.convertedUserId` / `convertedAt` — conversion linkage
- `OrganizationMembership` — role `CREATOR`

The lead row is retained for CRM history.

---

## Platform accounts

All `LeadPlatformAccount` rows on the source lead are copied into creator platform accounts at conversion time. Each copied account references the source lead platform account id in `sourceLeadPlatformAccountId`.

Lead platform accounts remain on the lead for CRM history.

---

## Idempotency (conversion)

Calling conversion again on an already converted lead returns the existing creator with `alreadyConverted: true`. No duplicate user, membership, or creator records are created. Audit events are not re-recorded.

---

## Audit events

| Action            | When                        | Target type |
| ----------------- | --------------------------- | ----------- |
| `creator.created` | First successful conversion | `creator`   |
| `creator.updated` | Creator profile updated     | `creator`   |
| `lead.converted`  | First successful conversion | `lead`      |

---

## Timeline

Lead timelines include `creator.converted` events sourced from `CreatorLead.metadata.conversionHistory`:

```json
{
  "id": "creator-converted-lead-1-0-2026-06-28T12:00:00.000Z",
  "type": "creator.converted",
  "occurredAt": "2026-06-28T12:00:00.000Z",
  "actorUserId": "clx...",
  "data": {
    "creatorId": "creator_abc123",
    "userId": "clx..."
  }
}
```

---

## Organization isolation

Every query and mutation is scoped to `organizationId` from the JWT. Creators in other organizations return `404` on direct access.

---

## Related docs

- [Recruitment CRM API](./recruitment.md)
- Shared types: `packages/types/src/creator.ts`

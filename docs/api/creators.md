# Creators API (Release 0.3)

**Status:** Implemented in `@kolab/api`  
**Base path:** `/api/creators`  
**Auth:** Bearer JWT with active organization context

---

## Overview

Creator Management provides roster read/update APIs for creators produced by the Recruitment CRM conversion workflow (`POST /api/recruitment/leads/:id/convert`).

Creator roster data is stored in first-class tables (`CreatorProfile`, `CreatorPlatformAccount`) scoped to the active organization. Conversion still writes lead metadata for CRM history and timeline compatibility. Legacy converted leads that only have metadata are lazily backfilled into the tables on read.

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

| Method | Path                                             | Permission   | Description                       |
| ------ | ------------------------------------------------ | ------------ | --------------------------------- |
| GET    | `/api/creators`                                  | `crm:read`   | List creators (filter, cursor)    |
| GET    | `/api/creators/:id`                              | `crm:read`   | Get creator detail                |
| PATCH  | `/api/creators/:id`                              | `crm:update` | Update creator profile fields     |
| GET    | `/api/creators/:id/platform-accounts`            | `crm:read`   | List creator platform accounts    |
| POST   | `/api/creators/:id/platform-accounts`            | `crm:update` | Add a creator platform account    |
| PATCH  | `/api/creators/:id/platform-accounts/:accountId` | `crm:update` | Update a creator platform account |
| DELETE | `/api/creators/:id/platform-accounts/:accountId` | `crm:update` | Remove a creator platform account |
| GET    | `/api/creators/:id/skills`                       | `crm:read`   | Get creator skills profile        |
| PATCH  | `/api/creators/:id/skills`                       | `crm:update` | Update creator skills profile     |
| GET    | `/api/creators/:id/availability`                 | `crm:read`   | Get creator availability          |
| PATCH  | `/api/creators/:id/availability`                 | `crm:update` | Update creator availability       |
| POST   | `/api/recruitment/leads/:id/convert`             | `crm:update` | Convert lead to creator           |

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

Results are ordered by creator profile creation date descending (newest first).

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

Updates are stored on `CreatorProfile` and synchronized to the linked `UserProfile` where applicable (`displayName`, `bio`, `country`, primary language). Lead metadata is also updated when a source lead is linked for backwards-compatible CRM history.

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

- `CreatorProfile` — creator roster profile (**primary API read/write**)
- `CreatorPlatformAccount` — platform accounts copied from lead accounts (**primary API**)
- `CreatorLead.metadata.creatorProfile` / `creatorPlatformAccounts` — legacy mirror for CRM timeline and history
- `CreatorLead.convertedUserId` / `convertedAt` — conversion linkage
- `OrganizationMembership` — role `CREATOR`

The lead row is retained for CRM history.

### Lazy backfill

Converted leads that predate table-backed storage may only have metadata. On list/get/update, the API backfills missing `CreatorProfile` and `CreatorPlatformAccount` rows from lead metadata and platform accounts. Backfill is idempotent and preserves metadata creator ids when present.

Commission plan and recruiter assignment remain sourced from the original lead conversion record (`CreatorLead.commissionPlan`, assigned recruiter on the lead/profile).

---

## Platform accounts

All `LeadPlatformAccount` rows on the source lead are copied into `CreatorPlatformAccount` at conversion time. Each copied account references the source lead platform account id in account metadata (`sourceLeadPlatformAccountId`).

Lead platform accounts remain on the lead for CRM history.

Platform accounts can also be managed directly via the creator platform account endpoints below.

### GET `/api/creators/:id/platform-accounts`

Returns platform accounts for a creator in the active organization.

**Permission:** `crm:read`

### Platform account list response (200)

```json
{
  "items": [
    {
      "id": "creator-platform-1",
      "organizationId": "clx...",
      "creatorId": "creator_abc123",
      "platform": "TIKTOK",
      "username": "janecreates",
      "profileUrl": "https://www.tiktok.com/@janecreates",
      "followers": 125000,
      "verified": false,
      "status": "ACTIVE",
      "sourceLeadPlatformAccountId": "platform-1",
      "createdAt": "2026-06-28T12:00:00.000Z",
      "updatedAt": "2026-06-28T12:00:00.000Z"
    }
  ]
}
```

**Errors:** `404` if the creator does not exist in the active organization.

---

### POST `/api/creators/:id/platform-accounts`

Creates a platform account on the creator profile.

**Permission:** `crm:update`

| Field        | Required | Description                       |
| ------------ | -------- | --------------------------------- |
| `platform`   | Yes      | Platform type                     |
| `username`   | Yes      | Platform username                 |
| `profileUrl` | No       | Public profile URL (nullable)     |
| `followers`  | No       | Follower count (nullable)         |
| `verified`   | No       | Verified flag (default `false`)   |
| `status`     | No       | Account status (default `ACTIVE`) |
| `metadata`   | No       | Extensible metadata object        |

Duplicate `(organizationId, platform, username)` combinations return `409 Conflict`.

**Errors:** `404` creator not found; `409` duplicate platform account.

---

### PATCH `/api/creators/:id/platform-accounts/:accountId`

Updates an existing creator platform account. At least one field is required.

**Permission:** `crm:update`

Allowed fields: `platform`, `username`, `profileUrl`, `followers`, `verified`, `status`, `metadata`.

**Errors:** `404` if the creator or account does not belong to the active organization; `409` duplicate platform account.

---

### DELETE `/api/creators/:id/platform-accounts/:accountId`

Removes a creator platform account. Accounts are soft-removed by setting `status` to `REMOVED` (supported by the account status enum). Already removed accounts are returned without further mutation.

**Permission:** `crm:update`

**Errors:** `404` if the creator or account does not belong to the active organization.

---

## Skills and availability

Structured creator skills are stored under `CreatorProfile.metadata.skills`. Availability schedules are stored on `CreatorProfile.availability`.

### GET `/api/creators/:id/skills`

Returns structured skills for a creator.

**Permission:** `crm:read`

| Field             | Description                                      |
| ----------------- | ------------------------------------------------ |
| `categories`      | Content or industry categories                   |
| `skills`          | Specific skill tags                              |
| `contentTypes`    | Preferred content formats                        |
| `languages`       | Spoken/content languages (falls back to profile) |
| `experienceLevel` | `BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `EXPERT` |
| `notes`           | Free-form notes (nullable)                       |

### Skills response (200)

```json
{
  "categories": ["beauty", "fashion"],
  "skills": ["makeup", "styling"],
  "contentTypes": ["live", "short-form"],
  "languages": ["en", "es"],
  "experienceLevel": "ADVANCED",
  "notes": "Specializes in live commerce"
}
```

---

### PATCH `/api/creators/:id/skills`

Updates structured skills. At least one field is required. When `languages` is provided, the profile `languages` column is also updated.

**Permission:** `crm:update`

**Errors:** `404` creator not found.

---

### GET `/api/creators/:id/availability`

Returns structured availability for a creator.

**Permission:** `crm:read`

| Field                | Description                                |
| -------------------- | ------------------------------------------ |
| `timezone`           | IANA timezone (optional)                   |
| `weeklySchedule`     | Weekly windows (`weekday`, `start`, `end`) |
| `preferredLiveTimes` | Preferred live stream time ranges          |
| `blackoutDates`      | Unavailable dates (`YYYY-MM-DD`)           |
| `notes`              | Free-form notes (nullable)                 |

### Availability response (200)

```json
{
  "timezone": "America/New_York",
  "weeklySchedule": [{ "weekday": 1, "start": "09:00", "end": "17:00" }],
  "preferredLiveTimes": ["18:00-21:00"],
  "blackoutDates": ["2026-07-04"],
  "notes": null
}
```

---

### PATCH `/api/creators/:id/availability`

Updates availability schedule. At least one field is required.

**Permission:** `crm:update`

**Errors:** `404` creator not found.

---

## Idempotency (conversion)

Calling conversion again on an already converted lead returns the existing creator with `alreadyConverted: true`. No duplicate user, membership, profile, or platform account rows are created. Audit events are not re-recorded.

---

## Audit events

| Action                             | When                         | Target type                |
| ---------------------------------- | ---------------------------- | -------------------------- |
| `creator.created`                  | First successful conversion  | `creator`                  |
| `creator.updated`                  | Creator profile updated      | `creator`                  |
| `creator.platform_account.created` | Platform account created     | `creator_platform_account` |
| `creator.platform_account.updated` | Platform account updated     | `creator_platform_account` |
| `creator.platform_account.deleted` | Platform account removed     | `creator_platform_account` |
| `creator.skills_updated`           | Creator skills updated       | `creator`                  |
| `creator.availability_updated`     | Creator availability updated | `creator`                  |
| `lead.converted`                   | First successful conversion  | `lead`                     |

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

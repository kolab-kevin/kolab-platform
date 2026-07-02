# Recruitment CRM Data Model (Release 0.3)

**Status:** Planning — not yet implemented in Prisma  
**Planned schema location:** `packages/database/prisma/schema.prisma`

---

## Overview

The Recruitment CRM extends the organization-scoped identity model with lead pipeline entities. All tables include `organizationId` and are intended for organizations with `type = AGENCY`.

Legacy `User.platforms` is **not** used for lead platform tracking. Leads use dedicated **platform account** rows.

---

## Entity relationship diagram

```mermaid
erDiagram
  Organization ||--o{ RecruitmentLead : has
  Organization ||--o{ RecruitmentLeadPlatformAccount : has
  Organization ||--o{ RecruitmentLeadActivity : has

  User ||--o{ RecruitmentLead : "assigned recruiter"
  User ||--o{ RecruitmentLead : "converted creator"
  User ||--o{ RecruitmentLeadActivity : author

  RecruitmentLead ||--o{ RecruitmentLeadPlatformAccount : has
  RecruitmentLead ||--o{ RecruitmentLeadActivity : has
  RecruitmentLead ||--o{ RecruitmentLeadAssignmentLog : has
  RecruitmentLead ||--o{ RecruitmentLeadFollowUp : has

  RecruitmentLead {
    string id PK
    string organizationId FK
    string name
    string nickname
    string email
    string phone
    string country
    string languages
    string source
    enum status
    int score
    string assignedRecruiterId FK "nullable"
    datetime assignedAt "nullable"
    datetime nextFollowUpAt "nullable"
    enum commissionPlan
    string convertedUserId FK "nullable"
    datetime convertedAt "nullable"
    string notesSummary
    datetime createdAt
    datetime updatedAt
  }

  RecruitmentLeadPlatformAccount {
    string id PK
    string organizationId FK
    string leadId FK
    enum platform
    string username
    string profileUrl
    int followers
    boolean verified
    enum status
    json metadata
    datetime createdAt
    datetime updatedAt
  }

  RecruitmentLeadActivity {
    string id PK
    string organizationId FK
    string leadId FK
    enum type
    string summary
    datetime occurredAt
    string createdByUserId FK
    json metadata
    datetime createdAt
  }

  RecruitmentLeadAssignmentLog {
    string id PK
    string organizationId FK
    string leadId FK
    string previousRecruiterId FK "nullable"
    string newRecruiterId FK "nullable"
    string assignedByUserId FK
    string reason
    datetime createdAt
  }

  RecruitmentLeadFollowUp {
    string id PK
    string organizationId FK
    string leadId FK
    datetime scheduledFor
    datetime completedAt "nullable"
    string assignedToUserId FK
    string notes
    datetime createdAt
  }
```

---

## Enums (planned)

### `RecruitmentLeadStatus`

`NEW`, `CONTACTED`, `INTERESTED`, `APPLICATION`, `CONTRACT_SENT`, `SIGNED`, `ACTIVE_CREATOR`, `INACTIVE`, `REJECTED`

### `RecruitmentLeadSource` (suggested)

`MANUAL`, `REFERRAL`, `SOCIAL`, `EVENT`, `IMPORT`, `OTHER`

### `RecruitmentCommissionPlan`

`STANDARD` (default), `PREMIUM`, `CUSTOM`

### `RecruitmentPlatformAccountStatus`

`ACTIVE`, `UNVERIFIED`, `SUSPENDED`, `REMOVED`

### `RecruitmentLeadActivityType`

`CALL`, `WHATSAPP`, `TIKTOK`, `FACEBOOK`, `EMAIL`, `MEETING`, `OTHER`

### `RecruitmentPlatform` (lead platform account)

Reuse or align with existing `Platform` enum where possible:

`TIKTOK`, `INSTAGRAM`, `YOUTUBE`, `FACEBOOK`, `TWITCH`, `OTHER`

_Note:_ Distinct from legacy `User.platforms` flags — this enum describes **external social accounts** on a lead.

---

## Entity definitions

### RecruitmentLead

Primary CRM record.

| Field                     | Type              | Notes                                             |
| ------------------------- | ----------------- | ------------------------------------------------- |
| `id`                      | cuid              | Primary key                                       |
| `organizationId`          | FK → Organization | Tenant scope                                      |
| `name`                    | string            | Legal or display name                             |
| `nickname`                | string?           | Handle / preferred name                           |
| `email`                   | string?           | Unique per org when present (_recommended index_) |
| `phone`                   | string?           | E.164 preferred in validation                     |
| `country`                 | string?           | ISO 3166-1 alpha-2                                |
| `languages`               | string[]          | BCP-47 codes, e.g. `["en","es"]`                  |
| `source`                  | enum              | How lead entered pipeline                         |
| `status`                  | enum              | Pipeline status                                   |
| `score`                   | int               | 0–100, default 0                                  |
| `assignedRecruiterId`     | FK → User?        | Current owner; null = unassigned pool             |
| `assignedAt`              | datetime?         | When current owner assigned                       |
| `nextFollowUpAt`          | datetime?         | Next scheduled follow-up                          |
| `commissionPlan`          | enum              | Default `STANDARD`                                |
| `convertedUserId`         | FK → User?        | Set when `ACTIVE_CREATOR`                         |
| `convertedAt`             | datetime?         | Conversion timestamp                              |
| `notesSummary`            | text?             | Short free-text; detailed notes in activities     |
| `createdAt` / `updatedAt` | datetime          | Audit                                             |

**Indexes (recommended):**

- `(organizationId, status, nextFollowUpAt)`
- `(organizationId, assignedRecruiterId, status)`
- `(organizationId, email)` unique where email not null
- `(organizationId, createdAt DESC)`

---

### RecruitmentLeadPlatformAccount

Tracks a lead's presence on a social/commerce platform.

| Field        | Type    | Notes                                          |
| ------------ | ------- | ---------------------------------------------- |
| `platform`   | enum    | TikTok, Instagram, etc.                        |
| `username`   | string  | Platform handle                                |
| `profileUrl` | string? | Canonical profile link                         |
| `followers`  | int?    | Snapshot count                                 |
| `verified`   | boolean | Platform verified badge                        |
| `status`     | enum    | Account verification state                     |
| `metadata`   | json    | External IDs, niche tags, avg views (_future_) |

**Constraints:**

- Unique `(organizationId, platform, username)` recommended to reduce duplicates

---

### RecruitmentLeadActivity

Append-only contact history and notes.

| Field             | Type      | Notes                             |
| ----------------- | --------- | --------------------------------- |
| `type`            | enum      | CALL, WHATSAPP, TIKTOK, …         |
| `summary`         | string    | Contact notes                     |
| `occurredAt`      | datetime  | When contact happened             |
| `createdByUserId` | FK → User | Author                            |
| `metadata`        | json      | Duration, message ID placeholders |

---

### RecruitmentLeadAssignmentLog

Ownership change history.

| Field                 | Type    | Notes                              |
| --------------------- | ------- | ---------------------------------- |
| `previousRecruiterId` | FK?     | Null for first assignment          |
| `newRecruiterId`      | FK?     | Null if returned to pool           |
| `assignedByUserId`    | FK      | Actor (recruiter claim or manager) |
| `reason`              | string? | Reassignment reason                |

---

### RecruitmentLeadFollowUp (recommended v1)

Optional but planned for manager reporting.

| Field              | Type      | Notes                     |
| ------------------ | --------- | ------------------------- |
| `scheduledFor`     | datetime  | Planned follow-up         |
| `completedAt`      | datetime? | Set when done             |
| `assignedToUserId` | FK        | Usually current recruiter |
| `notes`            | string?   | Completion notes          |

`RecruitmentLead.nextFollowUpAt` mirrors the next open follow-up for list views.

---

## Status transition rules (data layer)

Enforced in application service; documented here for schema reviewers.

| From             | Allowed to                           |
| ---------------- | ------------------------------------ |
| `NEW`            | `CONTACTED`, `REJECTED`              |
| `CONTACTED`      | `INTERESTED`, `REJECTED`, `INACTIVE` |
| `INTERESTED`     | `APPLICATION`, `REJECTED`            |
| `APPLICATION`    | `CONTRACT_SENT`, `REJECTED`          |
| `CONTRACT_SENT`  | `SIGNED`, `REJECTED`                 |
| `SIGNED`         | `ACTIVE_CREATOR`, `REJECTED`         |
| `ACTIVE_CREATOR` | `INACTIVE`                           |
| `INACTIVE`       | `CONTACTED` (reactivation)           |
| `REJECTED`       | — (terminal in v1)                   |

---

## Migration strategy

1. Add enums and tables in `feature/recruitment-crm-schema`
2. No backfill required — greenfield tables
3. Seed optional demo leads for `Acme Agency` dev org (_optional_)
4. Foreign keys use `onDelete: Cascade` from Organization; `SetNull` on recruiter user delete for assignment fields

---

## Future extensions (schema hooks)

| Future feature   | Planned extension                               |
| ---------------- | ----------------------------------------------- |
| Campaigns        | `RecruitmentLead.campaignId` nullable FK        |
| TikTok Shop      | `metadata.shopSellerId` on platform account     |
| Payments         | `RecruitmentCommissionAgreement` table          |
| Documents        | `RecruitmentLeadDocument` with storage key      |
| Performance KPIs | Read models / materialized views — no v1 tables |

---

## Related documents

- [Product plan](../product/recruitment-crm.md)
- [Architecture](../architecture/recruitment-crm.md)
- [API plan](../api/recruitment-crm.md)
- [Identity ERD](./identity-erd.md)

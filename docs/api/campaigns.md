# Campaigns API (Release 0.4 foundation + creator applications)

**Status:** Implemented in `@kolab/api`  
**Base path:** `/api/campaigns`  
**Auth:** Bearer JWT with active organization context

---

## Overview

Campaign Management provides organization-scoped campaign metadata, deliverable workflow, and creator application/invitation APIs.

**Not included:** creator assignments to deliverables, payments, analytics dashboards, livestream schedules, or TikTok integration.

---

## Permissions

| Permission   | Used for                                                         |
| ------------ | ---------------------------------------------------------------- |
| `crm:read`   | List/get campaigns, deliverables, and applications               |
| `crm:update` | Create/update campaigns, deliverables, applications, and reviews |

All routes require active `OrganizationMembership`. Campaigns are scoped to JWT `organizationId`.

All routes require active `OrganizationMembership`. Campaigns are scoped to JWT `organizationId`.

| Role             | Read | Write |
| ---------------- | ---- | ----- |
| `ORG_OWNER`      | Yes  | Yes   |
| `ORG_ADMIN`      | Yes  | Yes   |
| `AGENCY_MANAGER` | Yes  | Yes   |
| `RECRUITER`      | Yes  | Yes   |
| `MODERATOR`      | Yes  | No    |
| `SUPPORT`        | Yes  | No    |
| `VIEWER`         | No   | No    |

`SYSTEM_ADMIN` bypasses authorization guards.

---

## Endpoints

| Method | Path                                                              | Permission   | Description                     |
| ------ | ----------------------------------------------------------------- | ------------ | ------------------------------- |
| GET    | `/api/campaigns`                                                  | `crm:read`   | List campaigns (filter, cursor) |
| POST   | `/api/campaigns`                                                  | `crm:update` | Create campaign (`DRAFT`)       |
| GET    | `/api/campaigns/:campaignId`                                      | `crm:read`   | Get campaign detail             |
| PATCH  | `/api/campaigns/:campaignId`                                      | `crm:update` | Update campaign fields          |
| POST   | `/api/campaigns/:campaignId/status`                               | `crm:update` | Update campaign status          |
| GET    | `/api/campaigns/:campaignId/deliverables`                         | `crm:read`   | List campaign deliverables      |
| POST   | `/api/campaigns/:campaignId/deliverables`                         | `crm:update` | Create deliverable (`DRAFT`)    |
| PATCH  | `/api/campaigns/:campaignId/deliverables/:deliverableId`          | `crm:update` | Update deliverable fields       |
| POST   | `/api/campaigns/:campaignId/deliverables/:deliverableId/status`   | `crm:update` | Update deliverable status       |
| GET    | `/api/campaigns/:campaignId/applications`                         | `crm:read`   | List campaign applications      |
| POST   | `/api/campaigns/:campaignId/applications/invite`                  | `crm:update` | Invite creator (`INVITED`)      |
| POST   | `/api/campaigns/:campaignId/applications/apply`                   | `crm:update` | Creator applies (`APPLIED`)     |
| POST   | `/api/campaigns/:campaignId/applications/:applicationId/accept`   | `crm:update` | Accept application              |
| POST   | `/api/campaigns/:campaignId/applications/:applicationId/reject`   | `crm:update` | Reject application              |
| POST   | `/api/campaigns/:campaignId/applications/:applicationId/withdraw` | `crm:update` | Withdraw application            |

---

## GET `/api/campaigns`

Query parameters:

| Param          | Type   | Description                          |
| -------------- | ------ | ------------------------------------ |
| `cursor`       | string | Pagination cursor (campaign id)      |
| `limit`        | number | Max 100, default 20                  |
| `status`       | enum   | Filter by campaign status            |
| `campaignType` | enum   | Filter by campaign type              |
| `search`       | string | Match title, brand name, description |

### List response (200)

```json
{
  "items": [
    {
      "id": "campaign-1",
      "organizationId": "org-1",
      "title": "Summer Brand Deal",
      "description": "Creator campaign for summer launch",
      "brandName": "Acme Beauty",
      "campaignType": "BRAND_DEAL",
      "status": "DRAFT",
      "budgetAmount": "5000.00",
      "budgetCurrency": "USD",
      "startsAt": "2026-08-01T00:00:00.000Z",
      "endsAt": "2026-08-31T23:59:59.000Z",
      "applicationDeadline": "2026-07-15T23:59:59.000Z",
      "brief": { "objective": "Drive awareness" },
      "requirements": { "posts": 3 },
      "metadata": {},
      "createdByUserId": "manager-1",
      "createdAt": "2026-07-03T12:00:00.000Z",
      "updatedAt": "2026-07-03T12:00:00.000Z"
    }
  ],
  "nextCursor": null
}
```

---

## POST `/api/campaigns`

Creates a campaign in `DRAFT` status. `createdByUserId` is set from JWT `sub`.

Required fields: `title`, `campaignType`.

When `budgetAmount` is provided, `budgetCurrency` is required (ISO 4217 3-letter code).

---

## Campaign status workflow

| From        | Allowed next statuses              |
| ----------- | ---------------------------------- |
| `DRAFT`     | `ACTIVE`, `CANCELLED`, `ARCHIVED`  |
| `ACTIVE`    | `PAUSED`, `COMPLETED`, `CANCELLED` |
| `PAUSED`    | `ACTIVE`, `COMPLETED`, `CANCELLED` |
| `COMPLETED` | `ARCHIVED`                         |
| `CANCELLED` | `ARCHIVED`                         |
| `ARCHIVED`  | _(terminal)_                       |

Completed or cancelled campaigns allow metadata-only updates. Archived campaigns cannot be modified.

---

## Deliverable status workflow

| From          | Allowed next statuses                 |
| ------------- | ------------------------------------- |
| `DRAFT`       | `OPEN`, `CANCELLED`                   |
| `OPEN`        | `IN_PROGRESS`, `CANCELLED`            |
| `IN_PROGRESS` | `SUBMITTED`, `CANCELLED`              |
| `SUBMITTED`   | `APPROVED`, `REJECTED`, `IN_PROGRESS` |
| `APPROVED`    | _(terminal)_                          |
| `REJECTED`    | `IN_PROGRESS`, `CANCELLED`            |
| `CANCELLED`   | _(terminal)_                          |

Deliverables cannot be added to archived or cancelled campaigns. Approved or cancelled deliverables cannot be edited.

---

## Creator applications

Applications link a `CreatorProfile` to a campaign through an invite or self-apply workflow. At most **one active application** (`INVITED` or `APPLIED`) may exist per campaign + creator pair.

Applications cannot be submitted to archived, cancelled, or completed campaigns. The campaign and creator profile must belong to the JWT organization.

### Application status workflow

| From        | Allowed next statuses                                       |
| ----------- | ----------------------------------------------------------- |
| `INVITED`   | `APPLIED`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`, `CANCELLED` |
| `APPLIED`   | `ACCEPTED`, `REJECTED`, `WITHDRAWN`, `CANCELLED`            |
| `ACCEPTED`  | _(terminal)_                                                |
| `REJECTED`  | _(terminal)_                                                |
| `WITHDRAWN` | _(terminal)_                                                |
| `CANCELLED` | _(terminal)_                                                |

When a creator applies while an `INVITED` record exists, the invite transitions to `APPLIED` instead of creating a duplicate row.

### POST `/api/campaigns/:campaignId/applications/invite`

Body: `creatorProfileId` (required), optional `message`, optional `metadata`.

Creates `INVITED` application with `source: INVITE`. Sets `invitedByUserId` from JWT `sub`.

### POST `/api/campaigns/:campaignId/applications/apply`

Body: `creatorProfileId` (required), optional `message`, optional `metadata`.

Creates `APPLIED` application with `source: CREATOR_APPLIED` and sets `appliedAt`, or transitions an existing `INVITED` row to `APPLIED`.

### POST `/api/campaigns/:campaignId/applications/:applicationId/accept`

Optional `metadata`. Sets `reviewedByUserId`, `reviewedAt`, status `ACCEPTED`.

### POST `/api/campaigns/:campaignId/applications/:applicationId/reject`

Optional `decisionReason`, optional `metadata`. Sets review fields and status `REJECTED`.

### POST `/api/campaigns/:campaignId/applications/:applicationId/withdraw`

Optional `metadata`. Sets status `WITHDRAWN`.

### Application sources

`INVITE`, `CREATOR_APPLIED`, `MANUAL`

### Application statuses

`INVITED`, `APPLIED`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`, `CANCELLED`

---

## Campaign types

`BRAND_DEAL`, `LIVE_STREAM`, `TIKTOK_SHOP`, `UGC`, `AFFILIATE`, `OTHER`

## Campaign statuses

`DRAFT`, `ACTIVE`, `PAUSED`, `COMPLETED`, `CANCELLED`, `ARCHIVED`

## Deliverable statuses

`DRAFT`, `OPEN`, `IN_PROGRESS`, `SUBMITTED`, `APPROVED`, `REJECTED`, `CANCELLED`

---

## Audit events

| Action                                | When                       | Target type            |
| ------------------------------------- | -------------------------- | ---------------------- |
| `campaign.created`                    | Campaign created           | `campaign`             |
| `campaign.updated`                    | Campaign updated           | `campaign`             |
| `campaign.status_changed`             | Campaign status changed    | `campaign`             |
| `campaign.deliverable.created`        | Deliverable created        | `campaign_deliverable` |
| `campaign.deliverable.updated`        | Deliverable updated        | `campaign_deliverable` |
| `campaign.deliverable.status_changed` | Deliverable status changed | `campaign_deliverable` |
| `campaign.application.invited`        | Creator invited            | `campaign_application` |
| `campaign.application.applied`        | Creator applied            | `campaign_application` |
| `campaign.application.accepted`       | Application accepted       | `campaign_application` |
| `campaign.application.rejected`       | Application rejected       | `campaign_application` |
| `campaign.application.withdrawn`      | Application withdrawn      | `campaign_application` |

---

## Organization isolation

Every query filters by JWT `organizationId`. Cross-org campaign, deliverable, or application ids return `404`.

---

## Related docs

- [Campaigns ERD](../database/campaigns-erd.md)
- [Agency management](./agency.md) — `campaigns.enabled` operational toggle
- Shared types: `packages/types/src/campaigns.ts`

---

## Future extension points

- Creator assignments to deliverables
- Campaign analytics dashboards
- Payment and payout linkage
- Livestream schedule integration
- TikTok Shop campaign automation

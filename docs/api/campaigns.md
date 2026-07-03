# Campaigns API (Release 0.4 foundation)

**Status:** Implemented in `@kolab/api`  
**Base path:** `/api/campaigns`  
**Auth:** Bearer JWT with active organization context

---

## Overview

Campaign Management provides organization-scoped campaign metadata and deliverable workflow APIs. This foundation release covers campaign CRUD, status transitions, and deliverable tracking only.

**Not included:** creator applications, creator assignments, payments, analytics dashboards, livestream schedules, or TikTok integration.

---

## Permissions

| Permission   | Used for                                      |
| ------------ | --------------------------------------------- |
| `crm:read`   | List/get campaigns and deliverables           |
| `crm:update` | Create/update campaigns, deliverables, status |

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

| Method | Path                                                            | Permission   | Description                     |
| ------ | --------------------------------------------------------------- | ------------ | ------------------------------- |
| GET    | `/api/campaigns`                                                | `crm:read`   | List campaigns (filter, cursor) |
| POST   | `/api/campaigns`                                                | `crm:update` | Create campaign (`DRAFT`)       |
| GET    | `/api/campaigns/:campaignId`                                    | `crm:read`   | Get campaign detail             |
| PATCH  | `/api/campaigns/:campaignId`                                    | `crm:update` | Update campaign fields          |
| POST   | `/api/campaigns/:campaignId/status`                             | `crm:update` | Update campaign status          |
| GET    | `/api/campaigns/:campaignId/deliverables`                       | `crm:read`   | List campaign deliverables      |
| POST   | `/api/campaigns/:campaignId/deliverables`                       | `crm:update` | Create deliverable (`DRAFT`)    |
| PATCH  | `/api/campaigns/:campaignId/deliverables/:deliverableId`        | `crm:update` | Update deliverable fields       |
| POST   | `/api/campaigns/:campaignId/deliverables/:deliverableId/status` | `crm:update` | Update deliverable status       |

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

---

## Organization isolation

Every query filters by JWT `organizationId`. Cross-org campaign or deliverable ids return `404`.

---

## Related docs

- [Campaigns ERD](../database/campaigns-erd.md)
- [Agency management](./agency.md) — `campaigns.enabled` operational toggle
- Shared types: `packages/types/src/campaigns.ts`

---

## Future extension points

- Creator applications and assignments
- Campaign analytics dashboards
- Payment and payout linkage
- Livestream schedule integration
- TikTok Shop campaign automation

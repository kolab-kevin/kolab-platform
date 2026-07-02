# Creators API (Release 0.3)

**Status:** Implemented in `@kolab/api` (conversion entry point)  
**Auth:** Bearer JWT with active organization context

---

## Overview

Creator Management begins with lead conversion from Recruitment CRM. A **creator roster record** links an organization to a platform user with role `CREATOR`, populated from the source lead profile, recruiter assignment, commission plan, and platform accounts.

Release 0.3 does **not** include creator dashboards, campaigns, or payments.

---

## Conversion entry point

| Method | Path                                 | Permission   | Description                      |
| ------ | ------------------------------------ | ------------ | -------------------------------- |
| POST   | `/api/recruitment/leads/:id/convert` | `crm:update` | Convert a signed lead to creator |

See [Recruitment CRM API](./recruitment.md#creator-conversion) for workflow rules and preconditions.

---

## Creator record

After conversion, the creator roster record is stored on the lead metadata (`creatorProfile`, `creatorPlatformAccounts`) and linked to:

- `User` — identity (`convertedUserId` on the lead)
- `OrganizationMembership` — role `CREATOR`, status `ACTIVE`

### Creator shape

```json
{
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
  "platformAccounts": [
    {
      "id": "creator_platform_abc123",
      "organizationId": "clx...",
      "creatorId": "creator_abc123",
      "platform": "TIKTOK",
      "username": "janecreates",
      "profileUrl": "https://www.tiktok.com/@janecreates",
      "followers": 125000,
      "verified": false,
      "status": "ACTIVE",
      "sourceLeadPlatformAccountId": "clx...",
      "createdAt": "2026-06-28T12:00:00.000Z",
      "updatedAt": "2026-06-28T12:00:00.000Z"
    }
  ],
  "createdAt": "2026-06-28T12:00:00.000Z",
  "updatedAt": "2026-06-28T12:00:00.000Z"
}
```

Validation uses `CreatorSchema` and `ConvertLeadResponseSchema` from `@kolab/types`.

---

## Platform accounts

All `LeadPlatformAccount` rows on the source lead are copied into creator platform accounts at conversion time. Each copied account references the source lead platform account id in `sourceLeadPlatformAccountId`.

Lead platform accounts remain on the lead for CRM history.

---

## Idempotency

Calling conversion again on an already converted lead returns the existing creator with `alreadyConverted: true`. No duplicate user, membership, or creator records are created. Audit events are not re-recorded.

---

## Audit events

| Action            | When                        | Target type |
| ----------------- | --------------------------- | ----------- |
| `creator.created` | First successful conversion | `creator`   |
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

## Permissions

Conversion requires `crm:update`. Roles with this permission:

| Role             | Can convert |
| ---------------- | ----------- |
| `ORG_OWNER`      | Yes         |
| `ORG_ADMIN`      | Yes         |
| `AGENCY_MANAGER` | Yes         |
| `RECRUITER`      | Yes         |
| `VIEWER`         | No          |
| `CREATOR`        | No          |

---

## Related docs

- [Recruitment CRM API](./recruitment.md)
- Shared types: `packages/types/src/creator.ts`

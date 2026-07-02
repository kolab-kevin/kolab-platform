# Creator Documents & Contracts API

**Status:** Storage helpers implemented (`/api/storage/*`). Full document/contract CRUD remains planned.  
**Base path:** `/api/creators` (nested resources)  
**Auth:** Bearer JWT with active organization context  
**Org type:** `AGENCY` (initially)

---

## Overview

Planned REST API for creator onboarding documents and versioned contracts. Binary files upload directly to object storage via presigned URLs; API endpoints manage metadata, workflow status, and audited download access.

**Available now:** presigned upload/download helpers — see [Storage API](./storage.md). Document/contract metadata routes are not implemented yet.

---

## Permissions summary

| Permission               | Used for                                          |
| ------------------------ | ------------------------------------------------- |
| `crm:read`               | List documents/contracts metadata (no file bytes) |
| `crm:documents:upload`   | Request/upload documents, complete upload         |
| `crm:documents:review`   | Approve, reject, mark under review                |
| `crm:documents:download` | Issue presigned download URLs (audited)           |
| `crm:contracts:manage`   | Create, update draft, send, cancel contracts      |
| `crm:contracts:sign`     | Manual signature capture (agency-side)            |

All routes require active `OrganizationMembership`. Sensitive downloads **always** emit `creator.document.viewed` or equivalent contract event.

---

## Endpoints (planned)

### Documents

| Method | Path                                                      | Permission               | Description                          |
| ------ | --------------------------------------------------------- | ------------------------ | ------------------------------------ |
| GET    | `/api/creators/:id/documents`                             | `crm:read`               | List documents for creator           |
| POST   | `/api/creators/:id/documents`                             | `crm:documents:upload`   | Create document + presigned upload   |
| GET    | `/api/creators/:id/documents/:documentId`                 | `crm:read`               | Get document detail + versions       |
| PATCH  | `/api/creators/:id/documents/:documentId`                 | `crm:documents:review`   | Update status, expiration, metadata  |
| POST   | `/api/creators/:id/documents/:documentId/complete-upload` | `crm:documents:upload`   | Finalize upload after PUT to storage |
| GET    | `/api/creators/:id/documents/:documentId/download-url`    | `crm:documents:download` | Presigned download (audited)         |
| POST   | `/api/creators/:id/documents/:documentId/versions`        | `crm:documents:upload`   | Upload new version (resubmit)        |

### Organization document reporting

| Method | Path                               | Permission | Description                    |
| ------ | ---------------------------------- | ---------- | ------------------------------ |
| GET    | `/api/creators/documents/expiring` | `crm:read` | List expiring approved docs    |
| GET    | `/api/creators/documents/missing`  | `crm:read` | Creators missing required docs |

### Contracts

| Method | Path                                                   | Permission               | Description                     |
| ------ | ------------------------------------------------------ | ------------------------ | ------------------------------- |
| GET    | `/api/creators/:id/contracts`                          | `crm:read`               | List contracts                  |
| POST   | `/api/creators/:id/contracts`                          | `crm:contracts:manage`   | Create draft contract + v1      |
| GET    | `/api/creators/:id/contracts/:contractId`              | `crm:read`               | Contract detail + versions      |
| PATCH  | `/api/creators/:id/contracts/:contractId`              | `crm:contracts:manage`   | Update draft fields / metadata  |
| POST   | `/api/creators/:id/contracts/:contractId/send`         | `crm:contracts:manage`   | Status → `SENT`                 |
| POST   | `/api/creators/:id/contracts/:contractId/cancel`       | `crm:contracts:manage`   | Status → `CANCELLED`            |
| POST   | `/api/creators/:id/contracts/:contractId/sign`         | `crm:contracts:sign`     | Manual sign + lock version      |
| GET    | `/api/creators/:id/contracts/:contractId/download-url` | `crm:documents:download` | Download executed PDF (audited) |

### Future e-signature webhooks

| Method | Path                            | Auth               | Description             |
| ------ | ------------------------------- | ------------------ | ----------------------- |
| POST   | `/api/webhooks/esign/:provider` | Provider signature | Envelope status updates |

---

## Document types (API enum)

`GOVERNMENT_ID`, `PASSPORT`, `TAX_FORM`, `BANK_INFO`, `PROFILE_PHOTO`, `CONTRACT_ATTACHMENT`, `OTHER`

## Document statuses (API enum)

`REQUESTED`, `UPLOADED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `EXPIRED`, `SUPERSEDED`, `ARCHIVED`

## Contract types (API enum)

`CREATOR_AGREEMENT`, `AGENCY_AGREEMENT`, `CAMPAIGN_CONTRACT`, `NDA`, `OTHER`

## Contract statuses (API enum)

`DRAFT`, `SENT`, `VIEWED`, `SIGNED`, `EXPIRED`, `CANCELLED`, `TERMINATED`

---

## POST `/api/creators/:id/documents` (planned)

Creates a document row and returns a presigned upload URL.

### Create document request

```json
{
  "documentType": "GOVERNMENT_ID",
  "title": null,
  "expiresAt": "2028-06-01T00:00:00.000Z",
  "contentType": "image/jpeg",
  "byteSize": 2048000,
  "metadata": {
    "issuingCountry": "US",
    "label": null
  }
}
```

### Create document response (201)

```json
{
  "document": {
    "id": "doc_abc123",
    "organizationId": "clx...",
    "creatorId": "creator_abc123",
    "documentType": "GOVERNMENT_ID",
    "status": "REQUESTED",
    "expiresAt": "2028-06-01T00:00:00.000Z",
    "metadata": { "issuingCountry": "US" },
    "createdAt": "2026-07-02T12:00:00.000Z",
    "updatedAt": "2026-07-02T12:00:00.000Z"
  },
  "upload": {
    "versionId": "docver_abc123",
    "uploadUrl": "https://storage.example/presigned...",
    "expiresAt": "2026-07-02T12:15:00.000Z",
    "requiredHeaders": {
      "Content-Type": "image/jpeg"
    }
  }
}
```

Client uploads via `PUT` to `uploadUrl`, then calls `complete-upload`.

**Errors:** `404` creator not found; `403` missing permission; `413` size exceeds limit.

---

## PATCH `/api/creators/:id/documents/:documentId` (planned)

Review workflow update.

### Review document request

```json
{
  "status": "APPROVED",
  "expiresAt": "2028-06-01T00:00:00.000Z",
  "metadata": {
    "reviewNotes": "Clear photo; matches profile name"
  }
}
```

Reject example:

```json
{
  "status": "REJECTED",
  "rejectionReason": "Image blurry; please re-upload"
}
```

---

## GET `/api/creators/:id/skills` — note

Skills and availability are implemented separately; see [Creators API](./creators.md).

---

## GET `/api/creators/:id/documents/:documentId/download-url` (planned)

Issues short-lived presigned GET URL. **Always audits** for sensitive types.

### Download URL response (200)

```json
{
  "downloadUrl": "https://storage.example/presigned...",
  "expiresAt": "2026-07-02T12:05:00.000Z",
  "contentType": "image/jpeg",
  "byteSize": 2048000
}
```

---

## POST `/api/creators/:id/contracts` (planned)

### Create contract request

```json
{
  "contractType": "CREATOR_AGREEMENT",
  "title": "2026 Creator Representation Agreement",
  "validUntil": "2026-08-01T00:00:00.000Z",
  "metadata": {
    "commissionPlanRef": "STANDARD",
    "jurisdiction": "US-CA"
  }
}
```

### Create contract response (201)

Returns contract in `DRAFT` with version `1`.

---

## POST `/api/creators/:id/contracts/:contractId/sign` (planned)

Manual signature path (pre–e-sign).

### Manual sign request

```json
{
  "versionNumber": 1,
  "contentType": "application/pdf",
  "byteSize": 512000,
  "contentHash": "sha256:abc...",
  "signedAt": "2026-07-02T14:00:00.000Z",
  "metadata": {
    "signingMethod": "manual_upload"
  }
}
```

Flow: presign upload for executed PDF → client uploads → API locks version and sets contract `SIGNED`.

**Rule:** Signed versions are immutable; subsequent changes require new version or amendment contract.

---

## GET `/api/creators/documents/expiring` (planned)

| Param          | Type   | Description         |
| -------------- | ------ | ------------------- |
| `withinDays`   | number | Default 30, max 365 |
| `documentType` | enum   | Optional filter     |
| `cursor`       | string | Pagination          |
| `limit`        | number | Default 20, max 100 |

---

## Zod validation (planned `@kolab/types`)

| Schema                         | Purpose         |
| ------------------------------ | --------------- |
| `CreateCreatorDocumentSchema`  | POST document   |
| `UpdateCreatorDocumentSchema`  | PATCH review    |
| `CompleteDocumentUploadSchema` | Finalize upload |
| `CreateCreatorContractSchema`  | POST contract   |
| `UpdateCreatorContractSchema`  | PATCH draft     |
| `SignCreatorContractSchema`    | Manual sign     |

`BANK_INFO` metadata schema will **reject** raw account numbers in v1 (regex guard).

---

## Audit events

| Action                        | When                         | Target type |
| ----------------------------- | ---------------------------- | ----------- |
| `creator.document.requested`  | Checklist / create requested | `creator`   |
| `creator.document.uploaded`   | Upload completed             | `creator`   |
| `creator.document.viewed`     | Download URL issued          | `creator`   |
| `creator.document.approved`   | Approved                     | `creator`   |
| `creator.document.rejected`   | Rejected                     | `creator`   |
| `creator.document.expired`    | Expired                      | `creator`   |
| `creator.contract.created`    | Contract created             | `creator`   |
| `creator.contract.sent`       | Sent to creator              | `creator`   |
| `creator.contract.viewed`     | Creator viewed               | `creator`   |
| `creator.contract.signed`     | Executed                     | `creator`   |
| `creator.contract.expired`    | Offer expired                | `creator`   |
| `creator.contract.cancelled`  | Cancelled pre-sign           | `creator`   |
| `creator.contract.terminated` | Terminated post-sign         | `creator`   |

---

## Organization isolation

Every query filters by JWT `organizationId`. Cross-org document or contract ids return `404`. Presigned URLs are scoped to org-prefixed storage keys; API validates key ownership before signing.

---

## Explicitly not in API v1

- Embedded file bytes in JSON responses
- Payment account CRUD
- E-signature OAuth flows
- Campaign contract automation
- Public unauthenticated upload links (future portal milestone)

---

## Related documents

- [Product plan](../product/creator-documents-contracts.md)
- [Architecture](../architecture/creator-documents-contracts.md)
- [Database ERD](../database/creator-documents-contracts-erd.md)
- [Creators API (implemented)](./creators.md)
- [Recruitment CRM API](./recruitment.md)

# Creator Documents & Contracts API

**Status:** Creator documents API implemented. Contract CRUD remains planned.  
**Base path:** `/api/creators` (nested resources)  
**Auth:** Bearer JWT with active organization context  
**Org type:** `AGENCY` (initially)

---

## Overview

REST API for creator onboarding documents and versioned contracts. Binary files upload directly to object storage via presigned URLs; API endpoints manage metadata, workflow status, and audited download access.

**Available now:**

- [Storage presign helpers](./storage.md)
- Creator document metadata CRUD, version registration, review workflow, and audited download (this document)

Contract routes are not implemented yet.

---

## Permissions summary

| Permission   | Used for                                                    |
| ------------ | ----------------------------------------------------------- |
| `crm:read`   | List/get documents, presigned download                      |
| `crm:update` | Create/update documents, register versions, review workflow |

All routes require active `OrganizationMembership`. Document downloads **always** emit `creator.document.downloaded`; sensitive document types include `sensitive: true` in audit metadata.

---

## Document endpoints (implemented)

| Method | Path                                                      | Permission   | Description                           |
| ------ | --------------------------------------------------------- | ------------ | ------------------------------------- |
| GET    | `/api/creators/:creatorId/documents`                      | `crm:read`   | List documents for creator            |
| POST   | `/api/creators/:creatorId/documents`                      | `crm:update` | Create document metadata row          |
| GET    | `/api/creators/:creatorId/documents/:documentId`          | `crm:read`   | Get document detail + versions        |
| PATCH  | `/api/creators/:creatorId/documents/:documentId`          | `crm:update` | Update title, expiration, metadata    |
| POST   | `/api/creators/:creatorId/documents/:documentId/versions` | `crm:update` | Register uploaded version metadata    |
| POST   | `/api/creators/:creatorId/documents/:documentId/review`   | `crm:update` | Review workflow (approve/reject/etc.) |
| POST   | `/api/creators/:creatorId/documents/:documentId/download` | `crm:read`   | Presigned download URL (audited)      |

Upload flow:

1. `POST /api/creators/:creatorId/documents` — create document (`REQUESTED`)
2. `POST /api/storage/presign-upload` — get upload URL (see [Storage API](./storage.md))
3. Client `PUT` to presigned URL
4. `POST /api/creators/:creatorId/documents/:documentId/versions` — register `storageKey`, file metadata, checksum

---

## Document types (API enum)

`GOVERNMENT_ID`, `PASSPORT`, `TAX_FORM`, `BANK_INFO`, `PROFILE_PHOTO`, `CONTRACT_ATTACHMENT`, `OTHER`

## Document statuses (API enum)

`REQUESTED`, `UPLOADED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `EXPIRED`, `ARCHIVED`

Sensitive types (`GOVERNMENT_ID`, `PASSPORT`, `TAX_FORM`, `BANK_INFO`) are flagged in download audit metadata.

---

## POST `/api/creators/:creatorId/documents`

Creates a document row. Does not accept raw file bytes.

### Create document request

```json
{
  "documentType": "GOVERNMENT_ID",
  "expiresAt": "2028-06-01T00:00:00.000Z",
  "metadata": {
    "issuingCountry": "US"
  }
}
```

`title` is required when `documentType` is `OTHER`.

### Create document response (201)

Returns a `CreatorDocument` object with status `REQUESTED`.

**Errors:** `404` creator not found; `403` missing permission; `400` validation error.

---

## PATCH `/api/creators/:creatorId/documents/:documentId`

Updates document metadata (`title`, `expiresAt`, `metadata`). Status changes use the review endpoint.

---

## POST `/api/creators/:creatorId/documents/:documentId/versions`

Registers an uploaded file version after client upload to object storage.

### Add version request

```json
{
  "storageKey": "organizations/org-1/creators/creator-1/documents/doc-1/versions/ver-1/passport.pdf",
  "fileName": "passport.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 2048000,
  "checksum": "sha256:abc..."
}
```

The `storageKey` must match the organization, creator, document, and version layout enforced by `@kolab/storage`. MIME type and file size are validated against storage policy.

On success, document status moves to `UPLOADED` when previously `REQUESTED` or `REJECTED`.

---

## POST `/api/creators/:creatorId/documents/:documentId/review`

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

`rejectionReason` is required when `status` is `REJECTED`.

Allowed review statuses: `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `EXPIRED`, `ARCHIVED`.

---

## POST `/api/creators/:creatorId/documents/:documentId/download`

Issues a short-lived presigned GET URL for the latest uploaded version (or a specific `versionId`).

### Download request

```json
{
  "versionId": "ver-1"
}
```

`versionId` is optional; defaults to the latest version with a `storageKey`.

### Download response (200)

```json
{
  "documentId": "doc-1",
  "versionId": "ver-1",
  "storageKey": "organizations/org-1/creators/creator-1/documents/doc-1/versions/ver-1/passport.pdf",
  "downloadUrl": "https://storage.example/presigned...",
  "expiresAt": "2026-07-02T12:05:00.000Z"
}
```

---

## Organization document reporting (planned)

| Method | Path                               | Permission | Description                    |
| ------ | ---------------------------------- | ---------- | ------------------------------ |
| GET    | `/api/creators/documents/expiring` | `crm:read` | List expiring approved docs    |
| GET    | `/api/creators/documents/missing`  | `crm:read` | Creators missing required docs |

---

## Contracts (planned)

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

---

## Contract types (planned)

`CREATOR_AGREEMENT`, `AGENCY_AGREEMENT`, `CAMPAIGN_CONTRACT`, `NDA`, `OTHER`

## Contract statuses (planned)

`DRAFT`, `SENT`, `VIEWED`, `SIGNED`, `EXPIRED`, `CANCELLED`, `TERMINATED`

---

## Zod validation (`@kolab/types`)

| Schema                               | Purpose              |
| ------------------------------------ | -------------------- |
| `CreateCreatorDocumentSchema`        | POST document        |
| `UpdateCreatorDocumentSchema`        | PATCH metadata       |
| `CreateCreatorDocumentVersionSchema` | POST version         |
| `ReviewCreatorDocumentSchema`        | POST review          |
| `DownloadCreatorDocumentSchema`      | POST download        |
| `CreateCreatorContractSchema`        | POST contract (plan) |
| `UpdateCreatorContractSchema`        | PATCH draft (plan)   |

Raw file fields (`file`, `base64`, `body`, etc.) are rejected on all document inputs.

---

## Audit events

| Action                           | When                  | Target type        |
| -------------------------------- | --------------------- | ------------------ |
| `creator.document.created`       | Document created      | `creator_document` |
| `creator.document.updated`       | Metadata updated      | `creator_document` |
| `creator.document.version_added` | Version registered    | `creator_document` |
| `creator.document.reviewed`      | Review status changed | `creator_document` |
| `creator.document.downloaded`    | Download URL issued   | `creator_document` |

Contract audit events remain planned.

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
- Contract CRUD

---

## Related documents

- [Product plan](../product/creator-documents-contracts.md)
- [Architecture](../architecture/creator-documents-contracts.md)
- [Database ERD](../database/creator-documents-contracts-erd.md)
- [Creators API (implemented)](./creators.md)
- [Storage API](./storage.md)
- [Recruitment CRM API](./recruitment.md)

# Creator Documents & Contracts API

**Status:** Creator documents and contracts APIs implemented.  
**Base path:** `/api/creators` (nested resources)  
**Auth:** Bearer JWT with active organization context  
**Org type:** `AGENCY` (initially)

---

## Overview

REST API for creator onboarding documents and versioned contracts. Binary files upload directly to object storage via presigned URLs; API endpoints manage metadata, workflow status, and audited download access.

**Available now:**

- [Storage presign helpers](./storage.md)
- Creator document metadata CRUD, version registration, review workflow, and audited download
- Creator contract metadata CRUD, version registration, status workflow, and audited download
- Creator onboarding checklist derived from profile, document, and contract state (see [Creators API](./creators.md#get-apicreatorsidonboarding))
- Per-creator compliance bundle combining onboarding, expiration summaries, and sensitive access requirements (see [Creators API](./creators.md#get-apicreatorsidcompliance))

---

## Permissions summary

Document and contract routes use dedicated document permissions. CRM permissions (`crm:read`, `crm:update`, etc.) remain for creator profile management and recruitment workflows.

| Permission                     | Used for                                                              |
| ------------------------------ | --------------------------------------------------------------------- |
| `documents:read`               | List/get documents and contracts, non-sensitive download, reporting   |
| `documents:write`              | Create/update documents and contracts, versions, status/sign workflow |
| `documents:review`             | Document review workflow (approve/reject/under review)                |
| `documents:download_sensitive` | Download sensitive document types (service-layer check on download)   |

Sensitive document types: `GOVERNMENT_ID`, `PASSPORT`, `TAX_FORM`, `BANK_INFO`. Non-sensitive downloads require `documents:read` only. Contract downloads require `documents:read` only (no `documents:download_sensitive`).

| Role           | Document access                                                       |
| -------------- | --------------------------------------------------------------------- |
| ORG_OWNER      | All document permissions                                              |
| ORG_ADMIN      | All document permissions                                              |
| AGENCY_MANAGER | All document permissions                                              |
| RECRUITER      | `documents:read`, `documents:write` (no review or sensitive download) |
| SUPPORT        | `documents:read` only                                                 |
| FINANCE        | `documents:read` only                                                 |
| MODERATOR      | None (CRM read for recruitment only)                                  |
| CREATOR        | None for internal API                                                 |
| VIEWER         | None                                                                  |

All routes require active `OrganizationMembership`. Downloads **always** emit audit events (`creator.document.downloaded`, `creator.contract.downloaded`). Sensitive document downloads include `sensitive: true` in audit metadata. `isSystemAdmin` bypasses permission checks.

---

## Document endpoints (implemented)

| Method | Path                                                      | Permission         | Description                           |
| ------ | --------------------------------------------------------- | ------------------ | ------------------------------------- |
| GET    | `/api/creators/:creatorId/documents`                      | `documents:read`   | List documents for creator            |
| POST   | `/api/creators/:creatorId/documents`                      | `documents:write`  | Create document metadata row          |
| GET    | `/api/creators/:creatorId/documents/:documentId`          | `documents:read`   | Get document detail + versions        |
| PATCH  | `/api/creators/:creatorId/documents/:documentId`          | `documents:write`  | Update title, expiration, metadata    |
| POST   | `/api/creators/:creatorId/documents/:documentId/versions` | `documents:write`  | Register uploaded version metadata    |
| POST   | `/api/creators/:creatorId/documents/:documentId/review`   | `documents:review` | Review workflow (approve/reject/etc.) |
| POST   | `/api/creators/:creatorId/documents/:documentId/download` | `documents:read`   | Presigned download URL (audited)      |

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

Sensitive types (`GOVERNMENT_ID`, `PASSPORT`, `TAX_FORM`, `BANK_INFO`) require `documents:download_sensitive` to download and are flagged in audit metadata.

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

Issues a short-lived presigned GET URL for the latest uploaded version (or a specific `versionId`). Route requires `documents:read`. Sensitive document types additionally require `documents:download_sensitive` (enforced in the service layer).

### Download request

```json
{
  "versionId": "ver-1"
}
```

`versionId` is optional; defaults to the latest version with a `storageKey`.

### Document download response (200)

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

## Organization reporting (implemented)

| Method | Path                               | Permission       | Description                                 |
| ------ | ---------------------------------- | ---------------- | ------------------------------------------- |
| GET    | `/api/creators/documents/expiring` | `documents:read` | Documents expiring or expired within window |
| GET    | `/api/creators/documents/missing`  | `documents:read` | Active creators missing required documents  |
| GET    | `/api/creators/contracts/expiring` | `documents:read` | Contracts expiring or expired within window |

These endpoints are organization-scoped read-only reports. Notification preview payloads are available via `POST /api/creators/documents/notifications/preview`. No scheduled jobs or outbound email/SMS delivery exists in this milestone.

### Notification preview

| Method | Path                                            | Permission       | Description                                  |
| ------ | ----------------------------------------------- | ---------------- | -------------------------------------------- |
| POST   | `/api/creators/documents/notifications/preview` | `documents:read` | Generate notification-ready preview payloads |

Preview request body options: `days` (default 30), `includeExpired` (default true), optional `creatorId`, `documentType`, `contractType`.

Each preview item includes:

- `itemType` (`missing_document`, `expiring_document`, `expired_document`, `expiring_contract`, `expired_contract`)
- `status` (`MISSING`, `EXPIRING`, `EXPIRED`)
- `creator` summary
- optional document/contract identifiers and types
- `dueDate` (nullable for missing documents)
- `recommendedAction`

Preview generation emits audit event `creator.document.notification_previewed`. Payloads never include storage keys or secrets.

### Shared query parameters

| Param            | Type    | Default | Description                                        |
| ---------------- | ------- | ------- | -------------------------------------------------- |
| `days`           | number  | `30`    | Expiration window for expiring endpoints (max 365) |
| `includeExpired` | boolean | `false` | Include already-expired rows in expiring endpoints |
| `creatorId`      | string  | —       | Filter to a single active creator                  |
| `documentType`   | enum    | —       | Filter expiring/missing document reports           |
| `contractType`   | enum    | —       | Filter expiring contract reports                   |
| `limit`          | number  | `20`    | Page size (max 100)                                |
| `cursor`         | string  | —       | Pagination cursor                                  |

### Required documents (v1)

Missing-document reporting checks for an **approved** document of type `GOVERNMENT_ID` per active creator. `CREATOR_AGREEMENT` contracts are tracked separately via contract expiration reporting.

### Report status values

| Status     | Meaning                                                |
| ---------- | ------------------------------------------------------ |
| `MISSING`  | Required approved document not present for creator     |
| `EXPIRING` | `expiresAt` / `validUntil` falls within the window     |
| `EXPIRED`  | Expiration date is in the past (`includeExpired=true`) |

Each result includes a `creator` summary object plus the related document or contract metadata.

---

## Contract endpoints (implemented)

| Method | Path                                                      | Permission        | Description                        |
| ------ | --------------------------------------------------------- | ----------------- | ---------------------------------- |
| GET    | `/api/creators/:creatorId/contracts`                      | `documents:read`  | List contracts for creator         |
| POST   | `/api/creators/:creatorId/contracts`                      | `documents:write` | Create contract metadata row       |
| GET    | `/api/creators/:creatorId/contracts/:contractId`          | `documents:read`  | Get contract detail + versions     |
| PATCH  | `/api/creators/:creatorId/contracts/:contractId`          | `documents:write` | Update title, validity, metadata   |
| POST   | `/api/creators/:creatorId/contracts/:contractId/versions` | `documents:write` | Register uploaded version metadata |
| POST   | `/api/creators/:creatorId/contracts/:contractId/status`   | `documents:write` | Update workflow status             |
| POST   | `/api/creators/:creatorId/contracts/:contractId/sign`     | `documents:write` | Manually sign contract version     |
| POST   | `/api/creators/:creatorId/contracts/:contractId/download` | `documents:read`  | Presigned download URL (audited)   |

Upload flow:

1. `POST /api/creators/:creatorId/contracts` — create contract (`DRAFT`)
2. `POST /api/storage/presign-upload` with `resourceKind: "contracts"`
3. Client `PUT` to presigned URL
4. `POST /api/creators/:creatorId/contracts/:contractId/versions` — register version metadata
5. `POST /api/creators/:creatorId/contracts/:contractId/status` — advance workflow (e.g. `DRAFT` → `SENT`)
6. `POST /api/creators/:creatorId/contracts/:contractId/sign` — manually sign an uploaded version

Manual signing sets `signedAt` and `signedByUserId` on the contract and selected version, transitions status to `SIGNED`, and emits `creator.contract.signed`. No e-signature provider or email is invoked. Calling sign on an already `SIGNED` contract is idempotent (returns current state, no duplicate audit).

### Status workflow

| From         | Allowed next statuses                      |
| ------------ | ------------------------------------------ |
| `DRAFT`      | `SENT`, `CANCELLED`                        |
| `SENT`       | `VIEWED`, `SIGNED`, `EXPIRED`, `CANCELLED` |
| `VIEWED`     | `SIGNED`, `EXPIRED`, `CANCELLED`           |
| `SIGNED`     | `TERMINATED`                               |
| `EXPIRED`    | `DRAFT`                                    |
| `CANCELLED`  | `DRAFT`                                    |
| `TERMINATED` | `DRAFT`                                    |

When status becomes `SIGNED`, `signedAt` and `signedByUserId` are set on the contract and latest uploaded version. The dedicated sign endpoint can target a specific `versionId` and optional `signedByUserId`, `signedAt`, and `note`. Signed contracts reject title/validity changes and new versions; metadata-only updates are allowed for amendment/termination notes.

---

## Contract types (API enum)

`CREATOR_AGREEMENT`, `AGENCY_AGREEMENT`, `CAMPAIGN_CONTRACT`, `NDA`, `OTHER`

## Contract statuses (API enum)

`DRAFT`, `SENT`, `VIEWED`, `SIGNED`, `EXPIRED`, `CANCELLED`, `TERMINATED`

---

## POST `/api/creators/:creatorId/contracts/:contractId/status`

### Status update request

```json
{
  "status": "SENT",
  "metadata": {
    "sentVia": "email"
  }
}
```

Transition to `SIGNED` requires at least one uploaded version with a `storageKey`.

---

## POST `/api/creators/:creatorId/contracts/:contractId/sign`

Manually records contract signing before future e-signature integration. Requires JWT organization context; creator and contract must belong to the active org.

### Sign request (all fields optional)

```json
{
  "versionId": "ver-1",
  "signedByUserId": "user-abc",
  "signedAt": "2026-07-02T14:00:00.000Z",
  "note": "Signed in person at agency office"
}
```

| Field            | Default when omitted                               |
| ---------------- | -------------------------------------------------- |
| `versionId`      | Latest uploaded version with a `storageKey`        |
| `signedByUserId` | JWT subject (`sub`) of the authenticated user      |
| `signedAt`       | Current server time                                |
| `note`           | Stored in contract metadata as `manualSigningNote` |

Contract must be in a status that allows transition to `SIGNED` (`SENT` or `VIEWED`). Already `SIGNED` contracts return `200` with the current detail (idempotent; no second audit event).

### Sign response (200)

Returns `CreatorContractDetail` with updated status, signing timestamps on the contract and selected version, and versions array.

Audit: `creator.contract.signed` with `versionId`, `previousStatus`, `signedByUserId`, and optional `note`.

---

## POST `/api/creators/:creatorId/contracts/:contractId/download`

Issues a short-lived presigned GET URL for the latest uploaded version (or a specific `versionId`).

### Contract download response (200)

```json
{
  "contractId": "contract-1",
  "versionId": "ver-1",
  "storageKey": "organizations/org-1/creators/creator-1/contracts/contract-1/versions/ver-1/agreement.pdf",
  "downloadUrl": "https://storage.example/presigned...",
  "expiresAt": "2026-07-02T12:05:00.000Z"
}
```

---

## Zod validation (`@kolab/types`)

| Schema                                              | Purpose                   |
| --------------------------------------------------- | ------------------------- |
| `CreateCreatorDocumentSchema`                       | POST document             |
| `UpdateCreatorDocumentSchema`                       | PATCH document            |
| `CreateCreatorDocumentVersionSchema`                | POST document version     |
| `ReviewCreatorDocumentSchema`                       | POST document review      |
| `DownloadCreatorDocumentSchema`                     | POST document download    |
| `CreateCreatorContractSchema`                       | POST contract             |
| `UpdateCreatorContractSchema`                       | PATCH contract            |
| `CreateCreatorContractVersionSchema`                | POST contract version     |
| `UpdateCreatorContractStatusSchema`                 | POST contract status      |
| `SignCreatorContractSchema`                         | POST contract sign        |
| `DownloadCreatorContractSchema`                     | POST contract download    |
| `CreatorExpirationNotificationPreviewRequestSchema` | POST notification preview |

Raw file fields (`file`, `base64`, `body`, etc.) are rejected on all document and contract inputs.

---

## Audit events

| Action                                    | When                           | Target type        |
| ----------------------------------------- | ------------------------------ | ------------------ |
| `creator.document.created`                | Document created               | `creator_document` |
| `creator.document.updated`                | Metadata updated               | `creator_document` |
| `creator.document.version_added`          | Version registered             | `creator_document` |
| `creator.document.reviewed`               | Review status changed          | `creator_document` |
| `creator.document.downloaded`             | Download URL issued            | `creator_document` |
| `creator.document.notification_previewed` | Notification preview generated | `creator_document` |
| `creator.contract.created`                | Contract created               | `creator_contract` |
| `creator.contract.updated`                | Metadata updated               | `creator_contract` |
| `creator.contract.version_added`          | Version registered             | `creator_contract` |
| `creator.contract.status_changed`         | Status changed                 | `creator_contract` |
| `creator.contract.signed`                 | Contract manually signed       | `creator_contract` |
| `creator.contract.downloaded`             | Download URL issued            | `creator_contract` |

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
- [Storage API](./storage.md)
- [Recruitment CRM API](./recruitment.md)

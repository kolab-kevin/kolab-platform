# Creator Documents & Contracts Data Model

**Status:** Planning — not yet in Prisma schema  
**Target schema path:** `packages/database/prisma/schema.prisma`  
**Branch:** `feature/creator-documents-contracts-planning`

---

## Overview

Planned tables extend the creator roster model with **document metadata**, **document versions**, **contracts**, and **contract versions**. Binary files are stored in object storage; PostgreSQL holds references, workflow status, expiration, and audit-friendly metadata only.

All tables include `organizationId` and are scoped to agency organizations. Records link to `CreatorProfile` and optionally `CreatorLead` during pre-conversion onboarding.

**Prisma model names (planned):** `CreatorDocument`, `CreatorDocumentVersion`, `CreatorContract`, `CreatorContractVersion`, `CreatorDocumentChecklistItem` (optional agency template).

---

## Design rules

| Rule                         | Enforcement                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------ |
| No raw files in DB           | `storageKey` + checksum on version rows only                                   |
| Signed contract immutability | DB trigger or service layer rejects version update after `signedAt`            |
| Versioning                   | Monotonic `versionNumber` per parent document/contract                         |
| Uniqueness                   | One active `APPROVED` doc per `(creator, type)` unless policy allows multiples |
| Soft delete                  | `deletedAt` on document/contract; objects retained per retention policy        |
| Sensitive fields             | Never store full bank account, SSN, or ID number in columns                    |

---

## Entity relationship diagram

```mermaid
erDiagram
  Organization ||--o{ CreatorDocument : has
  Organization ||--o{ CreatorContract : has

  CreatorProfile ||--o{ CreatorDocument : has
  CreatorProfile ||--o{ CreatorContract : has
  CreatorLead ||--o{ CreatorDocument : "pre-conversion"
  CreatorLead ||--o{ CreatorContract : "pre-conversion"

  CreatorDocument ||--o{ CreatorDocumentVersion : has
  CreatorContract ||--o{ CreatorContractVersion : has

  User ||--o{ CreatorDocumentVersion : uploadedBy
  User ||--o{ CreatorDocument : reviewedBy
  User ||--o{ CreatorContractVersion : signedBy

  CreatorDocument {
    string id PK
    string organizationId FK
    string creatorProfileId FK "nullable"
    string sourceLeadId FK "nullable"
    enum documentType
    enum status
    string title "nullable"
    datetime expiresAt "nullable"
    string reviewedById FK "nullable"
    datetime reviewedAt "nullable"
    string rejectionReason "nullable"
    json metadata
    datetime deletedAt "nullable"
    datetime createdAt
    datetime updatedAt
  }

  CreatorDocumentVersion {
    string id PK
    string organizationId FK
    string documentId FK
    int versionNumber
    string storageBucket
    string storageKey
    string contentType
    int byteSize
    string contentHash
    enum uploadStatus
    string uploadedById FK
    datetime uploadedAt
    json metadata
    datetime createdAt
  }

  CreatorContract {
    string id PK
    string organizationId FK
    string creatorProfileId FK "nullable"
    string sourceLeadId FK "nullable"
    enum contractType
    enum status
    string title
    string parentContractId FK "nullable"
    datetime validFrom "nullable"
    datetime validUntil "nullable"
    datetime signedAt "nullable"
    string externalEnvelopeId "nullable"
    json metadata
    datetime deletedAt "nullable"
    datetime createdAt
    datetime updatedAt
  }

  CreatorContractVersion {
    string id PK
    string organizationId FK
    string contractId FK
    int versionNumber
    string storageBucket "nullable"
    string storageKey "nullable"
    string contentType "nullable"
    int byteSize "nullable"
    string contentHash "nullable"
    datetime signedAt "nullable"
    string signedByUserId FK "nullable"
    string externalEnvelopeId "nullable"
    json metadata
    datetime createdAt
  }
```

---

## Enums (planned)

### `CreatorDocumentType`

`GOVERNMENT_ID`, `PASSPORT`, `TAX_FORM`, `BANK_INFO`, `PROFILE_PHOTO`, `CONTRACT_ATTACHMENT`, `OTHER`

### `CreatorDocumentStatus`

`REQUESTED`, `UPLOADED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `EXPIRED`, `SUPERSEDED`, `ARCHIVED`

### `CreatorDocumentUploadStatus`

`PENDING`, `COMPLETED`, `FAILED`, `QUARANTINED`

### `CreatorContractType`

`CREATOR_AGREEMENT`, `AGENCY_AGREEMENT`, `CAMPAIGN_CONTRACT`, `NDA`, `OTHER`

### `CreatorContractStatus`

`DRAFT`, `SENT`, `VIEWED`, `SIGNED`, `EXPIRED`, `CANCELLED`, `TERMINATED`

---

## Table details

### CreatorDocument

Logical document record (one per type instance or checklist line).

| Column             | Type        | Notes                                             |
| ------------------ | ----------- | ------------------------------------------------- |
| `id`               | cuid        | PK                                                |
| `organizationId`   | FK          | Tenant scope                                      |
| `creatorProfileId` | FK nullable | Set after conversion                              |
| `sourceLeadId`     | FK nullable | Pre-conversion uploads                            |
| `documentType`     | enum        | See types above                                   |
| `status`           | enum        | Workflow state                                    |
| `title`            | string?     | Required when type = `OTHER`                      |
| `expiresAt`        | datetime?   | For ID / tax renewal                              |
| `reviewedById`     | FK User?    | Last reviewer                                     |
| `reviewedAt`       | datetime?   |                                                   |
| `rejectionReason`  | string?     | Shown to uploader on resubmit                     |
| `metadata`         | json        | Non-sensitive labels, jurisdiction, external refs |
| `deletedAt`        | datetime?   | Soft delete                                       |

**Indexes:**

- `(organizationId, creatorProfileId, documentType, status)`
- `(organizationId, expiresAt)` — expiration reporting
- `(organizationId, sourceLeadId)`

### CreatorDocumentVersion

Immutable file reference per upload attempt.

| Column          | Type    | Notes                                      |
| --------------- | ------- | ------------------------------------------ |
| `versionNumber` | int     | Unique per `documentId`                    |
| `storageBucket` | string  |                                            |
| `storageKey`    | string  | Opaque object path                         |
| `contentType`   | string  | MIME                                       |
| `byteSize`      | int     |                                            |
| `contentHash`   | string  | SHA-256 hex                                |
| `uploadStatus`  | enum    | `PENDING` until client confirms upload     |
| `uploadedById`  | FK User |                                            |
| `metadata`      | json    | Scan result, original filename (sanitized) |

**Constraint:** No updates to `storageKey` / `contentHash` after `uploadStatus = COMPLETED` (except quarantine flag in metadata).

### CreatorContract

Logical agreement tracking status and validity window.

| Column               | Type      | Notes                                   |
| -------------------- | --------- | --------------------------------------- |
| `contractType`       | enum      |                                         |
| `status`             | enum      | See lifecycle                           |
| `title`              | string    |                                         |
| `parentContractId`   | FK self?  | Amendments                              |
| `validFrom`          | datetime? |                                         |
| `validUntil`         | datetime? | Expiration if unsigned                  |
| `signedAt`           | datetime? | Denormalized from latest signed version |
| `externalEnvelopeId` | string?   | E-sign provider id (future)             |

### CreatorContractVersion

Draft and executed PDF references.

| Column               | Type      | Notes                                          |
| -------------------- | --------- | ---------------------------------------------- |
| `versionNumber`      | int       |                                                |
| `storageKey`         | string?   | Null while draft-only (template from metadata) |
| `signedAt`           | datetime? | When set, row is **immutable**                 |
| `signedByUserId`     | FK User?  | Manual sign; null for e-sign external          |
| `externalEnvelopeId` | string?   | Per-version envelope                           |

**Rule:** Rows with non-null `signedAt` cannot be updated or deleted (application-enforced; optional DB trigger).

---

## Linkage to existing models

| Existing model   | Relationship                                         |
| ---------------- | ---------------------------------------------------- |
| `CreatorProfile` | Primary owner of documents/contracts post-conversion |
| `CreatorLead`    | Optional pre-conversion link; re-point on convert    |
| `Organization`   | Tenant root                                          |
| `User`           | Uploader, reviewer, signer                           |
| `AuditLog`       | All sensitive access and status transitions          |

### Conversion migration (planned)

On `POST /api/recruitment/leads/:id/convert`:

```text
UPDATE creator_documents SET creatorProfileId = :profileId WHERE sourceLeadId = :leadId
UPDATE creator_contracts SET creatorProfileId = :profileId WHERE sourceLeadId = :leadId
```

---

## Expiration reporting query (planned)

```sql
SELECT d.*
FROM creator_documents d
WHERE d.organization_id = :orgId
  AND d.status = 'APPROVED'
  AND d.expires_at IS NOT NULL
  AND d.expires_at <= :threshold
  AND d.deleted_at IS NULL;
```

Scheduled job additionally transitions stale `APPROVED` → `EXPIRED` and emits `creator.document.expired`.

---

## Retention and deletion

| Scenario              | DB behavior            | Object storage behavior       |
| --------------------- | ---------------------- | ----------------------------- |
| Creator offboarded    | Soft-delete rows       | Retain until `retentionUntil` |
| Wrong upload rejected | Keep version for audit | Optional delete after 90 days |
| Signed contract       | Never hard-delete      | Immutable object, legal hold  |
| GDPR erasure request  | Policy ADR required    | Coordinated purge workflow    |

---

## Migration milestone order

1. Enums + `CreatorDocument` / `CreatorDocumentVersion`
2. `CreatorContract` / `CreatorContractVersion`
3. Indexes + foreign keys to `CreatorProfile`, `CreatorLead`
4. Optional `CreatorDocumentChecklistTemplate` (agency settings) — later

---

## Related documents

- [Product plan](../product/creator-documents-contracts.md)
- [Architecture](../architecture/creator-documents-contracts.md)
- [API plan](../api/creator-documents-contracts.md)
- [Recruitment CRM ERD](./recruitment-crm-erd.md)

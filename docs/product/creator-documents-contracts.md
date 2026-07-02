# Creator Documents & Contracts

**Status:** Planning  
**Target:** Release 0.4+ (post–Recruitment CRM creator roster)  
**Depends on:** Release 0.3 identity, agency foundation, `CreatorProfile` / creator management APIs  
**Branch:** `feature/creator-documents-contracts-planning`

---

## Executive summary

KOLAB agencies must collect, review, and retain creator onboarding paperwork (IDs, tax forms, agreements) with strong privacy controls and a clear audit trail. This initiative plans **document metadata management**, **versioned contracts**, and **future e-signature** integration — without storing raw sensitive files in PostgreSQL or implementing payments in v1.

Documents and contracts are **organization-scoped**, linked to `CreatorProfile` (and optionally the source `CreatorLead` during onboarding). Binary files live in object storage; the database holds references, status, expiration, and non-sensitive metadata only.

---

## Goal

Enable agency staff to:

1. Request and track required onboarding documents per creator
2. Upload, review, approve, or reject document submissions
3. Create, send, and track contract lifecycle from draft through signature
4. Report on missing, expiring, or expired compliance items
5. Prepare for e-signature providers (DocuSign, HelloSign, etc.) without rework

Creators may eventually self-upload via **creator-portal**; v1 API planning focuses on **admin / agency** surfaces.

---

## Core product decisions

| Decision              | Rule                                                                                    |
| --------------------- | --------------------------------------------------------------------------------------- |
| File storage          | **Object storage only** — never store raw file bytes in PostgreSQL                      |
| Sensitive access      | Every view/download of sensitive documents **must be audited**                          |
| Contract immutability | **Signed** contract versions are **immutable**; amendments create a new version         |
| Bank / payment data   | **No payment rails in v1** — `BANK_INFO` stores metadata + external reference only      |
| E-signature           | **Not in v1** — status workflow and provider hooks planned for v2                       |
| Lead vs creator       | Documents may attach to **lead pre-conversion** and **migrate/link** to creator profile |
| Org scope             | All records keyed by `organizationId`; no cross-org document sharing                    |
| Retention             | Expired/rejected docs remain queryable for compliance reporting; soft-archive supported |

---

## User stories

### Recruiter / agency manager

- As a **RECRUITER**, I can see which onboarding documents are missing for a creator so I can follow up before roster activation.
- As an **AGENCY_MANAGER**, I can upload a signed PDF contract and mark it `SIGNED` when e-sign is not yet integrated.
- As an **AGENCY_MANAGER**, I can reject an unclear ID photo with a reason so the creator can resubmit.
- As an **ORG_ADMIN**, I can run a report of creators with documents expiring in the next 30 days.

### Compliance / operations

- As **operations**, I can verify that government ID and tax forms were approved before marking onboarding complete.
- As an **auditor**, I can see who viewed or downloaded sensitive documents and when.

### Creator (future — creator-portal)

- As a **CREATOR**, I can upload requested documents through a secure upload link (future milestone).
- As a **CREATOR**, I can view and sign agency agreements via e-signature (future milestone).

---

## Document lifecycle

Documents represent **onboarding and compliance files** (IDs, tax forms, photos, attachments).

```text
REQUESTED          (agency requested; no file yet)
  ↓ upload
UPLOADED           (file in storage; pending review)
  ↓ review
UNDER_REVIEW
  ↓ approve / reject
APPROVED ──────────→ EXPIRED (past expiresAt; still reportable)
  │
  └→ REJECTED      (creator may upload new version → new document row or version)
  ↓ superseded
SUPERSEDED         (replaced by newer approved document of same type)
  ↓ archive
ARCHIVED           (retained for compliance; no longer active)
```

### Document status definitions

| Status         | Meaning                                           |
| -------------- | ------------------------------------------------- |
| `REQUESTED`    | Required item flagged; awaiting upload            |
| `UPLOADED`     | File uploaded; not yet reviewed                   |
| `UNDER_REVIEW` | Compliance or manager is reviewing                |
| `APPROVED`     | Accepted for onboarding / compliance              |
| `REJECTED`     | Not acceptable; resubmission required             |
| `EXPIRED`      | Past `expiresAt`; triggers renewal workflow       |
| `SUPERSEDED`   | Replaced by a newer document of the same type     |
| `ARCHIVED`     | Historical record; excluded from active checklist |

---

## Contract lifecycle

Contracts are **legal agreements** distinct from general documents. They are **versioned** and become **immutable** once signed.

```text
DRAFT
  ↓ send to creator
SENT
  ↓ creator opens (portal or e-sign email)
VIEWED
  ↓ signature captured (manual upload or e-sign webhook)
SIGNED ────────────→ immutable version locked

Parallel terminal states:
  EXPIRED    (past validUntil without signature)
  CANCELLED  (voided before signature)
  TERMINATED (ended after signature; amendment may follow as new contract/version)
```

### Contract status definitions

| Status       | Meaning                                                  |
| ------------ | -------------------------------------------------------- |
| `DRAFT`      | Internal editing; not visible to creator                 |
| `SENT`       | Delivered to creator (email, portal, or e-sign envelope) |
| `VIEWED`     | Creator opened the contract                              |
| `SIGNED`     | Fully executed; version locked                           |
| `EXPIRED`    | Offer lapsed without signature                           |
| `CANCELLED`  | Voided before execution                                  |
| `TERMINATED` | Agreement ended post-signature                           |

**Rule:** Transition to `SIGNED` requires an associated storage object (executed PDF) or e-sign provider completion record.

---

## Document types

| Type                  | Sensitive | Typical required | Notes                                             |
| --------------------- | --------- | ---------------- | ------------------------------------------------- |
| `GOVERNMENT_ID`       | Yes       | Yes              | Driver license, national ID                       |
| `PASSPORT`            | Yes       | Optional         | Alternative to government ID                      |
| `TAX_FORM`            | Yes       | Yes              | W-9, W-8BEN, etc. (jurisdiction-specific)         |
| `BANK_INFO`           | Yes       | Optional v1      | Metadata + external token only; no PAN/IBAN in DB |
| `PROFILE_PHOTO`       | No        | Optional         | Roster / marketing headshot                       |
| `CONTRACT_ATTACHMENT` | Yes       | Contextual       | Ad-hoc signed PDF not tracked as contract row     |
| `OTHER`               | Varies    | No               | Catch-all with mandatory `metadata.label`         |

---

## Contract types

| Type                | Purpose                                      |
| ------------------- | -------------------------------------------- |
| `CREATOR_AGREEMENT` | Master creator–agency representation terms   |
| `AGENCY_AGREEMENT`  | Alternate agency-specific template           |
| `CAMPAIGN_CONTRACT` | Per-campaign scope (future campaigns module) |
| `NDA`               | Confidentiality agreement                    |
| `OTHER`             | Custom; requires `metadata.label`            |

---

## Required onboarding documents (default checklist)

Agency-configurable in a later milestone. **Recommended defaults** for US-focused agencies:

| Document type   | Required | Renewal       |
| --------------- | -------- | ------------- |
| `GOVERNMENT_ID` | Yes      | On expiration |
| `TAX_FORM`      | Yes      | Annual        |
| `BANK_INFO`     | No v1    | N/A (future)  |
| `PROFILE_PHOTO` | No       | N/A           |

Checklist completion gates (product policy — enforce in API later):

- **Lead → `SIGNED`:** `CREATOR_AGREEMENT` contract in `SIGNED` status (aligns with Recruitment CRM)
- **Conversion → `ACTIVE_CREATOR`:** Required documents `APPROVED` (configurable strict vs warn-only)

---

## In scope (planned phases)

| Phase | Deliverable                                          |
| ----- | ---------------------------------------------------- |
| M1    | Planning docs (this set)                             |
| M2    | Prisma schema: documents, contracts, versions        |
| M3    | Object storage adapter + upload/download presign API |
| M4    | Document CRUD + review workflow API                  |
| M5    | Contract CRUD + version + status workflow API        |
| M6    | Expiration reporting + audit hardening               |
| M7    | E-signature provider integration (ADR + webhooks)    |
| M8    | Creator-portal self-service uploads                  |

---

## Explicitly not in v1

| Item                         | Rationale                          |
| ---------------------------- | ---------------------------------- |
| Raw files in PostgreSQL      | Security and scalability           |
| Payment account verification | Payments vertical                  |
| E-signature provider         | Integration ADR + vendor selection |
| Campaign contract automation | Campaigns module                   |
| OCR / ID verification AI     | Future compliance enhancement      |
| Cross-org document sharing   | Policy ADR required                |
| Bulk ZIP export              | After core workflows stable        |

---

## Open decisions

| #   | Topic                         | Options                                          | Recommendation                                     |
| --- | ----------------------------- | ------------------------------------------------ | -------------------------------------------------- |
| 1   | Document versioning           | A) New row per upload B) Version sub-table       | **B** — `CreatorDocumentVersion` for audit clarity |
| 2   | Lead-attached documents       | A) Copy on convert B) Re-link same rows          | **B** — update `creatorProfileId` on conversion    |
| 3   | BANK_INFO storage             | A) External vault token B) Manual PDF only       | **A** long-term; **B** for v1 manual collection    |
| 4   | Strict onboarding gate        | A) Block convert B) Warn only                    | **B** v1; **A** configurable per agency later      |
| 5   | Permission namespace          | A) `crm:documents:*` B) `documents:*`            | **A** — extend CRM permission family               |
| 6   | Default retention after churn | A) 7 years B) Agency-configurable                | **B** with 7-year default                          |
| 7   | Virus scanning                | A) Required before APPROVED B) Async post-upload | **B** v1 with quarantine flag                      |

---

## Acceptance criteria (documentation gate)

1. Document and contract lifecycles defined with status enums.
2. Sensitive file handling rules documented (storage refs only, audited access).
3. Required onboarding checklist and expiration reporting requirements captured.
4. E-signature and payment linkage described as future phases without v1 scope creep.
5. Architecture, ERD, and API plan documents cross-reference each other and creator roster entities.
6. Feature branch breakdown approved before schema PR.

---

## Feature branch breakdown

| Branch                                         | Deliverable                             | Depends on              |
| ---------------------------------------------- | --------------------------------------- | ----------------------- |
| `feature/creator-documents-contracts-planning` | Product + architecture + ERD + API plan | creator management APIs |
| `feature/creator-documents-schema`             | Prisma models + migration               | planning approval       |
| `feature/creator-documents-types`              | `@kolab/types` Zod DTOs + enums         | schema                  |
| `feature/creator-documents-storage`            | `@kolab/storage` presign + upload flow  | schema, storage package |
| `feature/creator-documents-api`                | Document CRUD + review + audit          | storage, permissions    |
| `feature/creator-contracts-api`                | Contract CRUD + versions + status       | documents foundation    |
| `feature/creator-documents-expiration`         | Reporting queries + scheduled jobs      | documents API           |
| `feature/creator-documents-esign`              | Provider integration (future)           | contracts API, ADR      |
| `feature/creator-documents-docs`               | Implemented API docs                    | all API branches        |

---

## Related documents

- [Creator Documents & Contracts architecture](../architecture/creator-documents-contracts.md)
- [Creator Documents & Contracts ERD](../database/creator-documents-contracts-erd.md)
- [Creator Documents & Contracts API plan](../api/creator-documents-contracts.md)
- [Creators API](../api/creators.md)
- [Recruitment CRM product plan](./recruitment-crm.md)

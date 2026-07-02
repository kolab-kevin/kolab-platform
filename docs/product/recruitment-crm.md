# Release 0.3 — Creator Recruitment CRM

**Status:** Planning  
**Target:** Release 0.3 (`release/0.3.x`)  
**Depends on:** Release 0.2 identity foundation, Release 0.3 agency management foundation  
**Branch:** `feature/recruitment-crm-planning`

---

## Goal

Design the **Creator Recruitment CRM** for agency organizations so recruiters can discover, contact, qualify, and convert creator leads into signed roster members — without building campaigns, payments, TikTok integrations, or performance analytics in the first delivery.

The CRM is **organization-scoped** and intended for `Organization.type = AGENCY`.

---

## Core product decisions

| Decision            | Rule                                                                                           |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| Lead ownership      | The **first recruiter to claim or be assigned** a lead owns that lead                          |
| Reassignment        | **Managers and org admins** may reassign leads later; reassignment is audited                  |
| Creator conversion  | A lead becomes a **creator only after contract is signed** (`SIGNED` → `ACTIVE_CREATOR`)       |
| Multi-platform      | Leads may belong to **one or more platforms** via platform account records                     |
| Platform tracking   | Track **platform accounts** (username, profile URL, followers), not platform names alone       |
| Commission          | Start with **`STANDARD`** plan only; **`PREMIUM`** and **`CUSTOM`** are placeholders for later |
| Performance metrics | **Do not over-engineer** recruiter KPIs in v1                                                  |
| Recruiter profile   | Business recruiting data in `RecruiterProfile`; **permissions stay on membership**             |
| Payments            | **Out of scope** for v1                                                                        |

---

## User stories

### Recruiter

- As a **RECRUITER**, I can create and view leads assigned to me so I can manage my pipeline.
- As a **RECRUITER**, I can claim an unassigned lead so I become the owner of that lead.
- As a **RECRUITER**, I can log contact activity (call, WhatsApp, TikTok DM, email, meeting) so my outreach history is visible to the team.
- As a **RECRUITER**, I can set the next follow-up date so I do not miss callbacks.
- As a **RECRUITER**, I can attach one or more platform accounts to a lead so we track TikTok/Instagram presence accurately.
- As a **RECRUITER**, I can move a lead through statuses from `NEW` to `CONTRACT_SENT` so managers see pipeline progress.

### Agency manager / admin

- As an **AGENCY_MANAGER** or **ORG_ADMIN**, I can view all agency leads and filter by recruiter, status, platform, and follow-up date.
- As an **AGENCY_MANAGER** or **ORG_ADMIN**, I can reassign a lead to another recruiter when ownership must change.
- As an **AGENCY_MANAGER**, I can mark a lead as `REJECTED` or `INACTIVE` with a reason.
- As an **ORG_ADMIN**, I can convert a signed lead to an active creator roster record linked to the organization.

### Security / operations

- As an **auditor**, I can see who claimed, reassigned, or converted a lead via audit logs.
- As a **SYSTEM_ADMIN**, I can support cross-tenant troubleshooting without bypassing org-scoped lead ownership rules in normal product flows.

---

## Lead lifecycle

```text
NEW
  ↓ contact initiated
CONTACTED
  ↓ positive response
INTERESTED
  ↓ formal intake
APPLICATION
  ↓ contract issued
CONTRACT_SENT
  ↓ contract signed
SIGNED
  ↓ onboarding complete / roster linked
ACTIVE_CREATOR
  ↓ pause / churn
INACTIVE

Any stage before SIGNED ──→ REJECTED
```

### Status definitions

| Status           | Meaning                                             |
| ---------------- | --------------------------------------------------- |
| `NEW`            | Lead captured; no outreach logged yet               |
| `CONTACTED`      | Recruiter has initiated contact                     |
| `INTERESTED`     | Lead expressed interest in joining the agency       |
| `APPLICATION`    | Lead submitted intake / application details         |
| `CONTRACT_SENT`  | Contract sent; awaiting signature                   |
| `SIGNED`         | Contract signed; not yet fully onboarded as creator |
| `ACTIVE_CREATOR` | Lead converted to creator roster / membership       |
| `INACTIVE`       | Previously active creator or dormant lead paused    |
| `REJECTED`       | Lead declined or disqualified                       |

**Rule:** `ACTIVE_CREATOR` is reachable only from `SIGNED`. A lead is **not** a creator before contract signature.

---

## Lead score (v1)

Simple manual + rule-assisted score on a **0–100** scale:

| Signal                                                | Default weight (v1) |
| ----------------------------------------------------- | ------------------- |
| Has email + phone                                     | +10                 |
| Has ≥1 verified platform account                      | +15                 |
| Followers above agency threshold (configurable later) | +20                 |
| Recent contact within 7 days                          | +10                 |
| Status ≥ `INTERESTED`                                 | +15                 |
| Overdue follow-up                                     | −10                 |

v1 stores `score` on the lead and allows **manual override** by managers. Automated recalculation can be added later without schema changes (computed job or trigger).

---

## Commission plan (placeholder)

| Plan       | v1        | Notes                                      |
| ---------- | --------- | ------------------------------------------ |
| `STANDARD` | ✓ default | Single default plan for all new leads      |
| `PREMIUM`  | Planned   | Reserved enum value; no billing logic      |
| `CUSTOM`   | Planned   | Reserved for negotiated terms; no UI in v1 |

Commission **rates and payouts are not implemented** in v1. The field exists to avoid rework when payments vertical arrives.

---

## In scope for v1

- Lead CRUD (org-scoped, agency orgs only)
- Lead claim / assign / reassign with ownership rules
- Lead status workflow through `SIGNED`
- Platform account records per lead (multi-platform)
- Notes and contact history with typed channels
- Follow-up scheduling (`nextFollowUpAt` + follow-up history)
- Basic lead score (manual + simple rules)
- Creator conversion workflow (`SIGNED` → `ACTIVE_CREATOR`)
- Commission plan field defaulting to `STANDARD`
- Permissions for recruiters vs managers
- Audit events for assign, reassign, status change, conversion
- API + database planning and phased implementation branches

---

## Explicitly not in v1

| Item                                        | Rationale                       |
| ------------------------------------------- | ------------------------------- |
| Campaign management                         | Separate vertical module        |
| Livestream scheduling                       | Future agency operations module |
| TikTok Shop / TikTok API sync               | Integration phase               |
| Payments, payouts, invoicing                | Payments vertical (Phase 3)     |
| Messaging inbox / two-way chat              | Notifications module later      |
| Recruiter performance dashboards            | Avoid over-engineering KPIs     |
| AI lead scoring                             | Future enhancement              |
| Public lead capture forms                   | Future marketing integration    |
| Cross-agency lead sharing                   | Policy ADR required             |
| Contract document storage / e-sign provider | Integration ADR required        |
| Bulk import from CSV                        | Nice-to-have after core CRM     |

---

## Open decisions

| #   | Topic                     | Options                                                     | Recommendation                                                    |
| --- | ------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------- |
| 1   | Unassigned lead pool      | A) Shared queue B) Manager-assigned only                    | **A** — recruiters can claim from pool; managers can assign       |
| 2   | Claim vs assign semantics | A) Same endpoint B) Separate claim action                   | **B** — explicit `POST /claim` for first ownership                |
| 3   | Creator conversion target | A) Link to `User` + membership B) Separate `Creator` entity | **A** for v1 — reuse `OrganizationMembership` with role `CREATOR` |
| 4   | Contract proof            | A) Status only B) Upload metadata                           | **A** in v1; document upload in v1.1                              |
| 5   | Lead deletion             | A) Hard delete B) Soft archive                              | **B** — use `REJECTED` / `INACTIVE`; no hard delete in v1         |
| 6   | Duplicate detection       | A) Email unique per org B) Email + platform username        | **B** — warn on duplicate platform username per org               |
| 7   | Notes visibility          | A) All org members B) Recruiter + managers                  | **B** — recruiters see own leads; managers see all                |
| 8   | Permission names          | A) `leads:*` B) `recruitment:*`                             | **A** — shorter; map in `@kolab/auth`                             |

---

## Acceptance criteria (Release 0.3 CRM v1)

1. Agency org member with `leads:read` can list leads scoped to their organization.
2. Recruiter can create a lead and automatically become owner, or claim an unassigned lead.
3. Only one active owner (`assignedRecruiterId`) exists per lead at a time.
4. Manager with `leads:assign` can reassign lead; audit log records previous and new owner.
5. Lead supports multiple platform account rows with username, profile URL, followers, verified flag.
6. Contact history entries support types `CALL`, `WHATSAPP`, `TIKTOK`, `FACEBOOK`, `EMAIL`, `MEETING`, `OTHER`.
7. Status transitions enforce `ACTIVE_CREATOR` only after `SIGNED`.
8. Converting to `ACTIVE_CREATOR` creates or links org membership with role `CREATOR`.
9. Commission plan defaults to `STANDARD`; `PREMIUM` / `CUSTOM` accepted but not enforced.
10. Non-agency organizations receive `403` on CRM routes.
11. Documentation set (product, architecture, database ERD, API plan) approved before schema PR.

---

## Feature branch breakdown

Implement in small reviewable PRs after planning approval:

| Branch                                   | Deliverable                             | Depends on          |
| ---------------------------------------- | --------------------------------------- | ------------------- |
| `feature/recruitment-crm-schema`         | Prisma models + migration               | agency foundation   |
| `feature/recruiter-profile-schema`       | `RecruiterProfile` model + shared types | recruitment schema  |
| `feature/recruitment-crm-types`          | `@kolab/types` Zod DTOs + enums         | schema              |
| `feature/recruitment-crm-permissions`    | Permission matrix in `@kolab/auth`      | types               |
| `feature/recruitment-crm-api-leads`      | Lead CRUD, claim, assign, list/filter   | permissions         |
| `feature/recruitment-crm-api-platforms`  | Platform account sub-resource           | leads API           |
| `feature/recruitment-crm-api-activities` | Notes + contact history + follow-ups    | leads API           |
| `feature/recruitment-crm-api-conversion` | Signed → active creator conversion      | leads API, identity |
| `feature/recruitment-crm-audit`          | Audit events for CRM mutations          | audit module        |
| `feature/recruitment-crm-docs`           | Final API docs (implemented status)     | all API branches    |

---

## Related documents

- [Recruitment CRM architecture](../architecture/recruitment-crm.md)
- [Recruitment CRM database ERD](../database/recruitment-crm-erd.md)
- [Recruitment CRM API plan](../api/recruitment-crm.md)
- [Agency management API](../api/agency.md)

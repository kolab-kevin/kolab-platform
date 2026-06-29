# Release 0.2 — Identity & Organization Foundation

**Status:** Planning  
**Target:** Release 0.2 (`release/0.2.x`)  
**Depends on:** Phase 0 (foundation), Phase 1 (auth), Phase 1.5 (engineering)

---

## Goal

Build the **identity and organization foundation** for KŌLAB Platform so every future vertical (Agency, TikTok Creator, Shop, AI, Streaming) operates inside a consistent **multi-tenant org model** with auditable access control.

Release 0.2 replaces the flat, global-role model from Phase 1 with **organization-scoped identity**, while preserving existing login flows and backward-compatible migration paths.

---

## Product goals

| Goal           | Outcome                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------- |
| Multi-tenancy  | Every user belongs to one or more **Organizations**; data and permissions are scoped by org |
| Identity       | Canonical **User** + **UserProfile** records decoupled from auth credentials                |
| Access control | Fine-grained **Roles & Permissions** per organization, not global enums only                |
| Onboarding     | **Invitations** for admins to add members without open registration                         |
| Security       | **Sessions**, refresh token rotation, and **Audit logs** for compliance and support         |
| Operations     | **Admin user management** and **Organization settings** in `@kolab/admin`                   |

---

## Non-goals (Release 0.2)

| Item                                        | Rationale                     | Target             |
| ------------------------------------------- | ----------------------------- | ------------------ |
| SSO / OAuth (Google, TikTok)                | Scope control                 | Release 0.3+       |
| Billing & subscriptions                     | Payments vertical             | Phase 3            |
| Domain features (campaigns, shops, streams) | Vertical shells               | Phase 2+           |
| Public API partner keys                     | Separate auth model           | Release 0.4+       |
| MFA / passkeys                              | Hardening pass                | Release 0.3        |
| Cross-org data sharing                      | Complex policy                | ADR required       |
| Prisma schema implementation                | Planning only in this doc set | Implementation PRs |

---

## User stories

### Organization owner / admin

- As an **ORG_OWNER**, I can create an organization and invite members by email so my team can collaborate securely.
- As an **ORG_ADMIN**, I can assign roles to members and revoke access without deleting their global user account.
- As an **ORG_ADMIN**, I can update organization settings (name, slug, timezone, branding placeholders).
- As an **ORG_ADMIN**, I can view audit logs for security-sensitive actions in my organization.

### Platform operator

- As a **SYSTEM_ADMIN**, I can list and suspend organizations and users across the platform for support and abuse response.
- As a **SYSTEM_ADMIN**, I can impersonate read-only context for troubleshooting (with audit trail) — _open decision_.

### Member

- As an **invited user**, I can accept an invitation, set my password, and land in the correct organization context.
- As a **member**, I can switch organization context when I belong to multiple orgs (_open decision: UI scope_).
- As a **member**, I can view and edit my profile (display name, avatar URL, locale).

### Security / compliance

- As a **security reviewer**, I can trace who changed roles, revoked sessions, or accepted invitations via immutable audit records.
- As an **operator**, I can force-revoke all sessions for a user or organization.

---

## Initial roles (Release 0.2)

| Role             | Scope        | Purpose                                                       |
| ---------------- | ------------ | ------------------------------------------------------------- |
| `SYSTEM_ADMIN`   | Platform     | Cross-tenant operations, support                              |
| `ORG_OWNER`      | Organization | Full org control, billing placeholder, ownership transfer     |
| `ORG_ADMIN`      | Organization | User/role management, settings, audit read                    |
| `AGENCY_MANAGER` | Organization | Agency vertical prep — roster/campaign admin (_future hooks_) |
| `RECRUITER`      | Organization | Talent pipeline prep (_future hooks_)                         |
| `CREATOR`        | Organization | Creator portal access                                         |
| `MODERATOR`      | Organization | Trust & safety portal access                                  |
| `FINANCE`        | Organization | Payout/reporting prep (_future hooks_)                        |
| `SUPPORT`        | Organization | Read-heavy support access                                     |
| `VIEWER`         | Organization | Read-only member                                              |

**Note:** Phase 1 global roles (`USER`, `ADMIN`, `SUPER_ADMIN`, etc.) map to this model during migration — see [Release 0.2 migration plan](../releases/release-0.2.md#migration-plan).

---

## Success metrics

- 100% of authenticated API calls carry **organization context** (header or token claim) for org-scoped routes
- Zero regression on Phase 1 login/register/refresh flows during migration window
- Audit log coverage for all role changes, invitation lifecycle events, and session revocations
- Admin can complete invite → accept → assign role → login flow in staging without manual DB edits

---

## Related documents

| Document                                                 | Purpose                                   |
| -------------------------------------------------------- | ----------------------------------------- |
| [Release 0.2 execution plan](../releases/release-0.2.md) | Branches, milestones, acceptance criteria |
| [Identity architecture](../architecture/identity.md)     | System design, auth flow, RBAC            |
| [Identity ERD](../database/identity-erd.md)              | Planned data model                        |
| [Authentication API](../api/authentication.md)           | Endpoint contracts                        |

---

## Open decisions

See [Release 0.2 — Open decisions](../releases/release-0.2.md#open-decisions) for the canonical list. Product-level highlights:

1. **Default org on register** — auto-create personal org vs require invite-only
2. **Multi-org UX** — org switcher in all apps vs admin-only
3. **SYSTEM_ADMIN** — separate `@kolab/admin` super surface vs API-only

---

## Approval

Implementation must not begin until this plan and linked architecture/API/database docs are reviewed and approved.

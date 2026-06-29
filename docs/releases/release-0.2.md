# Release 0.2 — Execution Plan

**Codename:** Identity & Organization Foundation  
**Version target:** `0.2.0`  
**Planning branch:** `feature/phase-2-planning`  
**Status:** Awaiting approval — **no implementation until signed off**

---

## Summary

Release 0.2 evolves KŌLAB Platform from Phase 1 flat auth to **multi-tenant organizations** with invitations, org-scoped RBAC, sessions, audit logs, and admin management surfaces.

| Document                                             | Role                             |
| ---------------------------------------------------- | -------------------------------- |
| [Product brief](../product/release-0.2.md)           | Goals, stories, roles, non-goals |
| [Identity architecture](../architecture/identity.md) | Auth flow, RBAC, sessions, audit |
| [Identity ERD](../database/identity-erd.md)          | Planned data model               |
| [Authentication API](../api/authentication.md)       | Endpoint contracts               |

---

## Milestones

| Milestone                 | Deliverable                        | Exit criteria                            |
| ------------------------- | ---------------------------------- | ---------------------------------------- |
| **M0 — Planning**         | This doc set                       | Stakeholder approval                     |
| **M1 — Schema**           | Prisma migrations + seed           | Migrations apply clean; rollback tested  |
| **M2 — Core API**         | Org, membership, auth claims       | Contract tests pass                      |
| **M3 — Invitations**      | Invite accept flow                 | E2E invite → member in staging           |
| **M4 — Sessions & audit** | Session CRUD + audit write path    | All listed events audited                |
| **M5 — Admin UI**         | `@kolab/admin` user/org management | Admin can manage members without API     |
| **M6 — Migration**        | Phase 1 → 0.2 data migration       | Existing dev users migrated; login works |
| **M7 — Release**          | `release/0.2.0` tag, CI green      | `pnpm validate` + staging sign-off       |

---

## Feature branch breakdown

Work merges to `main` via small PRs from `feature/*` branches. Suggested sequence:

| Branch                          | Scope                                      | Depends on         |
| ------------------------------- | ------------------------------------------ | ------------------ |
| `feature/identity-schema`       | Prisma models, enums, migrations           | M0 approval        |
| `feature/identity-types`        | `@kolab/types` Zod schemas                 | schema             |
| `feature/identity-auth-claims`  | JWT claims, session model, refresh link    | schema, types      |
| `feature/identity-rbac`         | Permission matrix, guards in `@kolab/auth` | types              |
| `feature/org-api-crud`          | Organization + settings endpoints          | rbac               |
| `feature/membership-api`        | Members list/update/remove                 | org-api            |
| `feature/invitations-api`       | Invite create/accept/revoke                | membership-api     |
| `feature/audit-api`             | AuditLog write interceptor + read API      | org-api            |
| `feature/sessions-api`          | Session list/revoke                        | auth-claims        |
| `feature/admin-platform-routes` | SYSTEM_ADMIN endpoints                     | rbac               |
| `feature/auth-me-v2`            | Extended `/auth/me`, login org selection   | auth-claims        |
| `feature/sdk-identity`          | `@kolab/sdk` client methods                | API stable         |
| `feature/ui-org-context`        | AuthProvider org + permissions             | sdk                |
| `feature/admin-user-management` | Admin UI pages                             | ui-org-context     |
| `feature/data-migration-0.2`    | Backfill script + dual-write               | all API            |
| `feature/remove-legacy-roles`   | Drop Phase 1 columns                       | migration verified |
| `docs/identity-0.2`             | Final doc sync                             | release            |

Each PR must pass `pnpm validate` and include tests per [Testing requirements](#testing-requirements).

---

## Migration plan

### Phase A — Expand (dual-write)

1. Add new tables: `Organization`, `UserProfile`, `OrganizationMembership`, `Invitation`, `Session`, `AuditLog`, `OrganizationSettings`
2. Add nullable `sessionId` on `RefreshToken`; backfill sessions from active tokens
3. Add `isSystemAdmin` on `User`; map `SUPER_ADMIN` → `true`
4. Create default org + membership for each existing user via seed/migration script
5. Deploy API that **writes** both legacy `User.role` and new membership (temporary)

### Phase B — Switch reads

1. JWT issuer adds `orgId`, `orgRole`, `sessionId`
2. Guards read membership; legacy role fallback behind feature flag `IDENTITY_V2_READS`
3. Update frontends to use new `/auth/me` shape

### Phase C — Contract

1. Enable `IDENTITY_V2_READS` by default
2. Reject JWTs without org claims
3. Stop writing legacy `User.role` and `User.platforms`

### Phase D — Cleanup

1. Remove legacy columns and enums from Prisma
2. Remove feature flags and Phase 1 role rank from `@kolab/auth`
3. Update seed users to org model only

### Rollback

- Keep Phase A migration reversible for one release
- Feature flags allow read-path rollback without data loss
- Document rollback in runbook before production cutover

---

## RBAC model (implementation checklist)

- [ ] `OrganizationRole` enum in Prisma + `@kolab/types`
- [ ] Static permission map in `@kolab/auth` (`ROLE_PERMISSIONS`)
- [ ] `@RequirePermissions()` decorator + `PermissionsGuard`
- [ ] `OrgMembershipGuard` resolves org from JWT or header
- [ ] `APP_ALLOWED_ROLES` replaced with permission checks per app (_see open decisions_)
- [ ] Audit on every permission-denied admin action (optional debug mode)

---

## Audit logging strategy (implementation)

- [ ] `AuditService.log({ action, organizationId, actorUserId, resourceType, resourceId, metadata })`
- [ ] NestJS interceptor on mutating org/member/invitation/session controllers
- [ ] `requestId` propagated from `@kolab/observability`
- [ ] No secrets in `metadata`; truncate large payloads
- [ ] Admin UI: paginated list with filters

---

## Testing requirements

| Layer         | Requirement                                                  |
| ------------- | ------------------------------------------------------------ |
| Unit          | Permission matrix, role hierarchy rules, token claim parsing |
| Unit          | Invitation token hash/verify, expiry                         |
| Integration   | Auth module: register creates org + membership               |
| Integration   | Invite accept (new user + existing user paths)               |
| Integration   | Session revoke invalidates refresh                           |
| Integration   | Audit entries created on role change                         |
| Guard         | `PermissionsGuard` deny/allow matrix                         |
| E2E (staging) | Full invite → login → admin role change → audit visible      |
| Migration     | Script idempotent; verified on copy of prod-like data        |
| Regression    | Phase 1 login/refresh/logout still pass during Phase A       |

Coverage targets per [Testing standards](../engineering/testing-standards.md): auth and RBAC modules ≥ 80% line coverage.

---

## Acceptance criteria (Release 0.2)

### Functional

- [ ] User can register and receive a default organization as ORG_OWNER
- [ ] ORG_ADMIN can invite, revoke, and list invitations
- [ ] Invitee can accept and receive correct org role
- [ ] User with multiple orgs can select org at login
- [ ] ORG_ADMIN can change member roles and remove members
- [ ] ORG_ADMIN can view audit log for org
- [ ] User can list and revoke own sessions
- [ ] SYSTEM_ADMIN can suspend organization
- [ ] `@kolab/admin` provides org member management UI

### Non-functional

- [ ] All new endpoints documented in Swagger
- [ ] `pnpm validate` passes on `main`
- [ ] No high-severity dependency audit failures
- [ ] Docker build succeeds for `api` and `admin`
- [ ] Migration runbook documented

### Security

- [ ] Invitation tokens hashed; single use
- [ ] Org isolation enforced server-side on every org route
- [ ] Audit trail for role changes and session revocations
- [ ] Rate limits on login and invitation endpoints

---

## Risks

| Risk                                        | Impact | Mitigation                                               |
| ------------------------------------------- | ------ | -------------------------------------------------------- |
| Migration breaks existing dev/staging users | High   | Dual-write, feature flags, rollback script               |
| Role sprawl (10 roles)                      | Medium | Static matrix in 0.2; ADR before dynamic roles           |
| Multi-org UX complexity                     | Medium | Defer switcher to post-0.2 if needed; API ready          |
| JWT claim change breaks clients             | High   | Grace period + SDK bump + coordinated frontend PRs       |
| Audit log volume                            | Low    | Pagination, retention policy, no sync writes in hot path |
| Email delivery for invites                  | Medium | Return accept URL in API for 0.2; email in 0.2.1         |

---

## Open decisions

| #   | Question                        | Options                                   | Recommendation                       |
| --- | ------------------------------- | ----------------------------------------- | ------------------------------------ |
| 1   | Default org on public register? | A) Auto-create B) Invite-only             | A for dev; B toggle for prod         |
| 2   | Multi-org login UX              | A) Org picker B) Header switch post-login | A at login if >1 membership          |
| 3   | Phase 1 `Platform[]`            | A) Drop B) Move to org settings           | B as JSON in OrganizationSettings    |
| 4   | `SYSTEM_ADMIN` storage          | A) `User.isSystemAdmin` B) Separate table | A for 0.2                            |
| 5   | Ownership transfer              | A) In 0.2 B) Defer                        | B — document API stub only           |
| 6   | Audit retention                 | A) 90d B) 1y C) indefinite                | A default; configurable later        |
| 7   | Impersonation                   | A) In 0.2 B) Defer                        | B                                    |
| 8   | Frontend role gates             | A) Permission-based B) Keep role lists    | A long-term; hybrid during migration |

**Action:** Resolve items 1–4 before M1 (schema). Items 5–8 before M5 (admin UI).

---

## Out of scope (explicit)

- Application code in this planning PR
- Prisma schema changes in this planning PR
- Email service integration
- OAuth / SSO
- Billing per organization

---

## Approval checklist

- [ ] Product — [release-0.2.md](../product/release-0.2.md)
- [ ] Engineering — [identity.md](../architecture/identity.md)
- [ ] Data — [identity-erd.md](../database/identity-erd.md)
- [ ] API — [authentication.md](../api/authentication.md)
- [ ] Security — audit + session strategy reviewed
- [ ] Open decisions 1–4 resolved

**Approved by:** _______________ **Date:** _______________

---

## Related links

- [Phase 1 auth (current)](../api/README.md)
- [Database (current)](../database/README.md)
- [Branch strategy](../engineering/branch-strategy.md)
- [Testing standards](../engineering/testing-standards.md)

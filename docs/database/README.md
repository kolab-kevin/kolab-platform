# Database

PostgreSQL is the single source of truth. Schema lives in `packages/database/prisma/schema.prisma`.

## Commands

```bash
# Generate Prisma client
pnpm db:generate

# Create migration (development)
pnpm db:migrate

# Apply migrations (CI / production)
pnpm db:migrate:deploy

# Open Prisma Studio
pnpm db:studio
```

## Docker

Migrations run automatically via the `migrate` service in `docker-compose.yml` before API services start.

## Core models

### Phase 1 (auth)

- **User** — identity, legacy role, platform access
- **RefreshToken** — refresh token storage for JWT auth

### Release 0.2 (identity)

Organization-scoped identity model — see [Identity ERD](./identity-erd.md):

- **Organization**, **OrganizationMembership**, **UserProfile**
- **Session**, **Invitation**, **AuditLog**

### Release 0.3 (recruitment CRM)

- **CreatorLead**, **LeadPlatformAccount**, **LeadAssignment**, **LeadNote**, **LeadStatusHistory**
- **RecruiterProfile** — recruiter business profile per org user
- **CreatorProfile**, **CreatorPlatformAccount** — creator roster schema (API migration pending)
- **RefreshToken.sessionId** — optional link to Session (Phase A migration)

Legacy `User.role` and `User.platforms` remain until Phase D cleanup.

## Roles

`USER`, `CREATOR`, `MODERATOR`, `ADMIN`, `SUPER_ADMIN`

## Platforms

`KOLAB_AGENCY`, `TIKTOK_CREATOR`, `TIKTOK_SHOP`, `AI_SERVICES`, `LIVE_STREAMING`, `SYMLCAST`

**Release 0.2 (planned):** Organization-scoped identity model — [Identity ERD](./identity-erd.md).

**Release 0.3 (implemented):** Creator Recruitment CRM — [Recruitment CRM ERD](./recruitment-crm-erd.md).

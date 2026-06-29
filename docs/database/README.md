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

## Core models (Phase 0)

- **User** — identity, role, platform access
- **RefreshToken** — refresh token storage for JWT auth (Phase 1)

## Roles

`USER`, `CREATOR`, `MODERATOR`, `ADMIN`, `SUPER_ADMIN`

## Platforms

`KOLAB_AGENCY`, `TIKTOK_CREATOR`, `TIKTOK_SHOP`, `AI_SERVICES`, `LIVE_STREAMING`, `SYMLCAST`

**Release 0.2 (planned):** Organization-scoped identity model — [Identity ERD](./identity-erd.md).

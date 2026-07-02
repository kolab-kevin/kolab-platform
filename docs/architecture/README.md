# KŌLAB Platform Architecture

Enterprise monorepo powering multiple business verticals from a single foundation.

## Platform Pillars

| Vertical                  | App surfaces          | Backend                   |
| ------------------------- | --------------------- | ------------------------- |
| Kolab Agency              | web, admin            | api                       |
| TikTok Creator Management | creator-portal, admin | api, mobile-api           |
| TikTok Shop               | web, creator-portal   | api, public-api, payments |
| AI Services               | web, ai-services      | ai-services, ai package   |
| Live Streaming            | web, creator-portal   | api, streaming            |
| SYMLCAST (future)         | web                   | streaming, api            |

## Applications (independently deployable)

| Service        | Port | Stack      |
| -------------- | ---- | ---------- |
| web            | 3000 | Next.js 15 |
| admin          | 3001 | Next.js 15 |
| creator-portal | 3002 | Next.js 15 |
| moderator      | 3003 | Next.js 15 |
| api            | 4000 | NestJS     |
| public-api     | 4001 | NestJS     |
| mobile-api     | 4002 | NestJS     |
| ai-services    | 4003 | NestJS     |

## Shared packages

`database`, `config`, `types`, `auth`, `sdk`, `notifications`, `payments`, `analytics`, `storage`, `streaming`, `ai`

## Authentication (Phase 1+)

- JWT access tokens (short-lived)
- Refresh tokens (stored in PostgreSQL, Redis-backed session cache)
- RBAC: USER, CREATOR, MODERATOR, ADMIN, SUPER_ADMIN

**Release 0.2 (planned):** Organization-scoped identity — see [Identity architecture](./identity.md) and [Release 0.2 planning](../product/release-0.2.md).

**Release 0.3 (planning):** Creator Recruitment CRM — see [Recruitment CRM architecture](./recruitment-crm.md) and [Product plan](../product/recruitment-crm.md).

## Infrastructure

- PostgreSQL 16 — primary datastore (Prisma ORM)
- Redis 7 — sessions, cache, rate limiting (Phase 1+)
- Docker Compose — local and production-like orchestration

See [deployment](../deployment/README.md) for Docker workflow.

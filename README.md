# KŌLAB Platform

Unified enterprise monorepo for Kolab's product ecosystem — agency, TikTok creator management, TikTok Shop, AI services, live streaming, and future SYMLCAST integration.

## Stack

Turborepo · Next.js 15 · NestJS · PostgreSQL · Prisma · Redis · Docker · TypeScript · Tailwind CSS · shadcn/ui (Phase 1)

## Applications

| App | Package | Port | Purpose |
|-----|---------|------|---------|
| web | `@kolab/web` | 3000 | Public-facing platform |
| admin | `@kolab/admin` | 3001 | Internal operations |
| creator-portal | `@kolab/creator-portal` | 3002 | Creator self-service |
| moderator | `@kolab/moderator` | 3003 | Trust & safety |
| api | `@kolab/api` | 4000 | Core platform API |
| public-api | `@kolab/public-api` | 4001 | Third-party integrations |
| mobile-api | `@kolab/mobile-api` | 4002 | Mobile clients |
| ai-services | `@kolab/ai-services` | 4003 | AI workloads |

## Shared packages

`@kolab/database` · `@kolab/config` · `@kolab/types` · `@kolab/auth` · `@kolab/sdk` · `@kolab/notifications` · `@kolab/payments` · `@kolab/analytics` · `@kolab/storage` · `@kolab/streaming` · `@kolab/ai`

## Quick start (Docker-first)

```bash
cp .env.example .env
docker compose up -d --build
```

Verify: http://localhost:4000/health

## Local development (without full Docker stack)

```bash
pnpm install
docker compose up postgres redis -d
cp .env.example .env
pnpm db:generate
pnpm db:migrate
pnpm dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps (Turbo) |
| `pnpm build` | Build all apps and packages |
| `pnpm lint` | Lint entire monorepo |
| `pnpm typecheck` | TypeScript check |
| `pnpm db:migrate` | Run Prisma migrations (dev) |
| `pnpm docker:up` | Start full Docker stack |
| `pnpm docker:build` | Build all Docker images |

## Documentation

- [Architecture](docs/architecture/README.md)
- [Database](docs/database/README.md)
- [API](docs/api/README.md)
- [Deployment](docs/deployment/README.md)
- [Product](docs/product/README.md)

## Development roadmap

### Phase 0 — Foundation ✅

Monorepo scaffold, all 8 apps, shared packages, PostgreSQL + Prisma, Redis in Docker, CI pipeline, health/readiness endpoints, independently deployable Docker images.

### Phase 1 — Auth & platform core ✅

JWT access tokens, refresh token rotation (SHA-256 hashed in PostgreSQL), Redis session cache, `@kolab/auth`, `@kolab/ui` (shadcn), `@kolab/sdk`, Swagger at `/api/docs`, login/register + protected dashboards on all 4 frontends.

### Phase 2 — Vertical shells

Creator portal features (TikTok Creator), admin user management, `@kolab/sdk` HTTP client, audit logging, E2E tests, staging deployment.

### Phase 3 — Domain services

`@kolab/payments` (TikTok Shop), `@kolab/notifications`, `@kolab/analytics`, `@kolab/storage`, `@kolab/ai` model routing, public-api partner endpoints.

### Phase 4 — Streaming & SYMLCAST

`@kolab/streaming` live integrations, ai-services production workloads, SYMLCAST bridge, production hardening (Sentry, rate limits, load testing).

## License

Copyright (c) 2026 kolab-kevin. See [LICENSE](LICENSE).

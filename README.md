# KŌLAB Platform

Unified enterprise monorepo for Kolab's product ecosystem — agency, TikTok creator management, TikTok Shop, AI services, live streaming, and future SYMLCAST integration.

## Stack

Turborepo · Next.js 15 · NestJS · PostgreSQL · Prisma · Redis · Docker · TypeScript · Tailwind CSS · shadcn/ui · Pino · Helmet · Husky · Commitlint

## Applications

| App            | Package                 | Port | Purpose                  |
| -------------- | ----------------------- | ---- | ------------------------ |
| web            | `@kolab/web`            | 3000 | Public-facing platform   |
| admin          | `@kolab/admin`          | 3001 | Internal operations      |
| creator-portal | `@kolab/creator-portal` | 3002 | Creator self-service     |
| moderator      | `@kolab/moderator`      | 3003 | Trust & safety           |
| api            | `@kolab/api`            | 4000 | Core platform API        |
| public-api     | `@kolab/public-api`     | 4001 | Third-party integrations |
| mobile-api     | `@kolab/mobile-api`     | 4002 | Mobile clients           |
| ai-services    | `@kolab/ai-services`    | 4003 | AI workloads             |

## Shared packages

`@kolab/database` · `@kolab/config` · `@kolab/types` · `@kolab/auth` · `@kolab/sdk` · `@kolab/ui` · `@kolab/observability` · `@kolab/notifications` · `@kolab/payments` · `@kolab/analytics` · `@kolab/storage` · `@kolab/streaming` · `@kolab/ai`

## Quick start

```bash
pnpm install
docker compose up postgres redis -d
cp apps/api/.env.example apps/api/.env
pnpm db:generate && pnpm db:migrate && pnpm db:seed
pnpm dev
```

Docker-first full stack: `docker compose up -d --build`

## Scripts

| Command               | Description                                                     |
| --------------------- | --------------------------------------------------------------- |
| `pnpm dev`            | Start all apps (Turbo)                                          |
| `pnpm build`          | Build all apps and packages                                     |
| `pnpm validate`       | Full quality gate (format, lint, typecheck, test, audit, build) |
| `pnpm lint`           | ESLint + markdown lint                                          |
| `pnpm format:check`   | Prettier check                                                  |
| `pnpm test`           | Run all unit tests                                              |
| `pnpm audit:ci`       | Production dependency audit (high severity)                     |
| `pnpm check:cycles`   | Circular dependency detection (madge)                           |
| `pnpm check:licenses` | OSS license compliance                                          |
| `pnpm db:seed`        | Seed dev users                                                  |
| `pnpm docker:build`   | Build all Docker images                                         |

## Engineering standards

**Start here:** [KOLAB Coding Standards](docs/engineering/coding-standards.md)

| Standard                                       | Document                                                         |
| ---------------------------------------------- | ---------------------------------------------------------------- |
| Overview, review checklist, Definition of Done | [Coding standards](docs/engineering/coding-standards.md)         |
| TypeScript                                     | [TypeScript standards](docs/engineering/typescript-standards.md) |
| NestJS / API                                   | [Backend standards](docs/engineering/backend-standards.md)       |
| Next.js / UI                                   | [Frontend standards](docs/engineering/frontend-standards.md)     |
| Unit, guard, E2E tests                         | [Testing standards](docs/engineering/testing-standards.md)       |
| Branches, commits, PRs                         | [Git standards](docs/engineering/git-standards.md)               |

### Git branches

`feature/*` · `bugfix/*` · `hotfix/*` · `release/*` · `docs/*` · `chore/*` → merge to `main` via PR

### Commits (Conventional Commits)

`feat:` · `fix:` · `refactor:` · `docs:` · `test:` · `ci:` · `build:` · `perf:` · `security:`

Enforced by **Husky** + **Commitlint** on every commit.

### Pull request quality gates

Every PR must pass:

- ✓ lint (ESLint + markdownlint)
- ✓ typecheck
- ✓ unit tests
- ✓ dependency review (PRs)
- ✓ security audit
- ✓ build
- ✓ Docker build verification

Run locally: `pnpm validate`

## Documentation

### Product & architecture

- [Architecture](docs/architecture/README.md)
- [Database](docs/database/README.md)
- [API](docs/api/README.md)
- [Deployment](docs/deployment/README.md)
- [Product](docs/product/README.md)

### Engineering

- [**KOLAB Coding Standards**](docs/engineering/coding-standards.md) — start here
- [TypeScript standards](docs/engineering/typescript-standards.md)
- [Backend standards](docs/engineering/backend-standards.md)
- [Frontend standards](docs/engineering/frontend-standards.md)
- [Testing standards](docs/engineering/testing-standards.md)
- [Git standards](docs/engineering/git-standards.md)
- [Developer onboarding](docs/engineering/onboarding.md)
- [Branch strategy](docs/engineering/branch-strategy.md)
- [Quality gates](docs/engineering/quality-gates.md)
- [Turbo remote cache](docs/engineering/turbo-remote-cache.md)
- [ADR process](docs/adr/README.md)

### Security & operations

- [Security overview](docs/security/README.md)
- [Security headers](docs/security/headers.md)
- [Local development runbook](docs/runbooks/local-development.md)
- [Incident response](docs/runbooks/incident-response.md)

## Development roadmap

| Phase                    | Status  | Scope                                                  |
| ------------------------ | ------- | ------------------------------------------------------ |
| 0 — Foundation           | ✅      | Monorepo, Docker, Prisma, Redis, CI                    |
| 1 — Auth                 | ✅      | JWT, refresh rotation, RBAC, shadcn, 4 frontends       |
| **1.5 — Engineering**    | **✅**  | **DX tooling, observability, security, quality gates** |
| 2 — Vertical shells      | Next    | Domain features, E2E, staging                          |
| 3 — Domain services      | Planned | Payments, AI, streaming                                |
| 4 — Production hardening | Planned | SYMLCAST, Sentry, OTel SDK                             |

## License

Copyright (c) 2026 kolab-kevin. See [LICENSE](LICENSE).

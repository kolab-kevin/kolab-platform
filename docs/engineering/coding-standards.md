# KOLAB Coding Standards

Authoritative engineering standards for the KŌLAB Platform monorepo. These rules apply to all contributors — internal team, contractors, and agents.

**Enforcement:** ESLint, Prettier, Commitlint, Husky, and CI quality gates. Standards below describe _what_ we require; tooling automates _how_ much of it is checked.

---

## Standards index

| Document                                          | Scope                                          |
| ------------------------------------------------- | ---------------------------------------------- |
| [TypeScript standards](./typescript-standards.md) | Types, strict mode, env validation, DTOs       |
| [Backend standards](./backend-standards.md)       | NestJS, Prisma, OpenAPI, errors, audit logging |
| [Frontend standards](./frontend-standards.md)     | Next.js, `@kolab/ui`, auth, accessibility      |
| [Testing standards](./testing-standards.md)       | Unit, guard, auth, E2E requirements            |
| [Git standards](./git-standards.md)               | Branches, commits, PRs, merge policy           |

Related:

- [Branch strategy](./branch-strategy.md)
- [Quality gates](./quality-gates.md)
- [Onboarding](./onboarding.md)
- [Security overview](../security/README.md)

---

## Monorepo principles

1. **Apps deploy; packages share.** Business logic belongs in `packages/` or app `services/`, not duplicated across apps.
2. **Type safety end-to-end.** Zod schemas in `@kolab/types`, env in `@kolab/config`, Prisma for persistence.
3. **Security by default.** RBAC, refresh rotation, validated input, no secrets in code.
4. **Observable and testable.** Structured logs, request IDs, unit tests on services and guards.
5. **Document decisions.** Non-obvious choices get an [ADR](../adr/README.md).

---

## Naming and formatting

| Element               | Convention                | Example                |
| --------------------- | ------------------------- | ---------------------- |
| Files (modules)       | kebab-case                | `auth.service.ts`      |
| React components      | PascalCase export         | `LoginForm`            |
| Classes / interfaces  | PascalCase                | `AuthService`          |
| Functions / variables | camelCase                 | `parseEnv`             |
| Constants             | SCREAMING_SNAKE_CASE      | `JWT_SECRET`           |
| Packages              | `@kolab/<name>`           | `@kolab/database`      |
| Tests                 | `*.spec.ts` / `*.test.ts` | `auth.service.spec.ts` |

Formatting is handled by **Prettier** (2 spaces, single quotes, trailing commas). Do not hand-format.

Imports are sorted by **eslint-plugin-simple-import-sort**: Node → external → `@kolab/*` → relative. Unused imports are errors.

---

## Code review checklist

Use this checklist on every pull request. All items must be satisfied or explicitly deferred with a tracked follow-up.

### Type safety

- [ ] No new `any` without documented exception (see [TypeScript standards](./typescript-standards.md))
- [ ] External/untrusted data parsed with Zod or equivalent before use
- [ ] Environment variables read only through `@kolab/config` `parseEnv()`
- [ ] Shared types live in `@kolab/types`; no duplicate DTO definitions

### Validation

- [ ] Every API request body has a DTO + validation pipe
- [ ] Client forms validate with shared Zod schemas where applicable
- [ ] Invalid input returns consistent 4xx responses (not 500)

### RBAC

- [ ] Protected endpoints use `@Roles()` or equivalent guard
- [ ] Frontend apps enforce `APP_ALLOWED_ROLES` via `AuthProvider`
- [ ] Role changes or new protected routes verified manually or via test

### Tests

- [ ] New/changed services have unit tests
- [ ] New/changed guards have unit tests
- [ ] Auth/security changes include dedicated tests
- [ ] Tests do not call production services or real external APIs

### Security

- [ ] No secrets, tokens, or credentials in code or commits
- [ ] No server-only env vars exposed via `NEXT_PUBLIC_*`
- [ ] Refresh token rotation logic unchanged or strengthened (never weakened)
- [ ] Sensitive actions include audit logging (or ticket to add it)

### Logging

- [ ] Errors logged via `@kolab/observability` (structured JSON in production)
- [ ] No `console.log` in production paths (ESLint warns)
- [ ] Request ID present on error responses from API

### Documentation

- [ ] Public API changes reflected in OpenAPI/Swagger decorators
- [ ] User-facing or operational changes update relevant `docs/` pages
- [ ] Breaking changes noted in PR description

### Migration safety

- [ ] Prisma migrations are backward-compatible or have a documented rollback plan
- [ ] No `db push` in staging/production — only versioned migrations
- [ ] Seed data changes do not overwrite production data paths

### Performance risk

- [ ] No unbounded queries or N+1 patterns introduced without justification
- [ ] No synchronous blocking I/O on hot paths without review
- [ ] Large payloads or file uploads considered for limits/timeouts

---

## Definition of Done

A feature, fix, or refactor is **not complete** until all of the following are true:

| Gate            | Requirement                                                                                           |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| **Lint**        | `pnpm lint` passes (ESLint + markdownlint)                                                            |
| **Format**      | `pnpm format:check` passes                                                                            |
| **Typecheck**   | `pnpm typecheck` passes                                                                               |
| **Tests**       | `pnpm test` passes; new code has appropriate coverage per [testing standards](./testing-standards.md) |
| **Build**       | `pnpm build` succeeds                                                                                 |
| **Docs**        | Relevant documentation updated (API, runbooks, or standards if behavior changed)                      |
| **Migrations**  | Database migrations reviewed for safety; applied locally and in CI                                    |
| **Security**    | Security impact considered; RBAC and auth flows verified for affected surfaces                        |
| **Role access** | Each affected app tested with allowed and denied roles                                                |
| **PR quality**  | PR includes purpose, test evidence, and risk notes per [git standards](./git-standards.md)            |
| **CI**          | All GitHub Actions quality gates green                                                                |

For local verification before opening a PR:

```bash
pnpm validate
```

---

## Escalations and exceptions

Standards exist to keep the platform maintainable at enterprise scale. Exceptions are allowed when:

1. Documented in the PR with rationale and scope
2. Approved by a code owner
3. Tracked for removal if temporary (tech-debt ticket)

Never except: secrets in code, skipping auth on protected endpoints, or weakening refresh token rotation.

---

## Related tooling

| Tool                       | Purpose                        |
| -------------------------- | ------------------------------ |
| `@kolab/eslint-config`     | Shared ESLint rules            |
| `@kolab/typescript-config` | Strict TS configs per app type |
| Husky + lint-staged        | Pre-commit lint/format         |
| Commitlint                 | Conventional Commits           |
| `pnpm validate`            | Full local quality gate        |
| `pnpm check:cycles`        | Circular dependency detection  |
| `pnpm check:licenses`      | OSS license compliance         |

# Testing Standards

Testing requirements for the KŌLAB Platform monorepo.

---

## Principles

1. **Tests prove behavior, not implementation details.**
2. **Unit tests run fast** — no network, no real database, no production services.
3. **Critical paths are non-negotiable** — auth, RBAC, payments, data mutations.
4. **CI is the source of truth** — if it fails in CI, it is not done.

---

## Test runners

| Target                                | Runner     | Location                      |
| ------------------------------------- | ---------- | ----------------------------- |
| NestJS apps (`api`, etc.)             | Jest       | `apps/*/src/**/*.spec.ts`     |
| Shared packages (`@kolab/auth`, etc.) | Vitest     | `packages/*/src/**/*.test.ts` |
| E2E (Phase 2+)                        | Playwright | `apps/*/e2e/` or root `e2e/`  |

Run all unit tests:

```bash
pnpm test
```

---

## Required coverage by artifact

### Services — unit tests required

**Every service gets unit tests.**

- Co-locate: `auth.service.ts` → `auth.service.spec.ts`
- Mock `@kolab/database`, Redis, external HTTP
- Cover happy path, validation failures, and authorization failures
- Name tests descriptively: `it('throws UnauthorizedException for invalid password')`

### Guards — unit tests required

**Every guard gets tests.**

- `JwtAuthGuard` — missing token, invalid token, valid token, `@Public()` bypass
- `RolesGuard` — allowed role, denied role, no roles required

### Auth and security — tests required

**Every auth/security change gets tests.**

Includes changes to:

- JWT signing/verification (`@kolab/auth`)
- Refresh token rotation (`AuthService`)
- Password hashing
- RBAC helpers (`hasAnyRole`, `hasMinimumRole`)
- Cookie and CORS configuration (integration or E2E where applicable)
- New protected endpoints or role mappings

Password, session, and token lifecycle changes **must** include tests before merge.

### E2E — required for critical workflows

**E2E tests required for:**

| Flow                                       | Priority      |
| ------------------------------------------ | ------------- |
| Login                                      | P0 — Phase 2  |
| Registration                               | P0 — Phase 2  |
| Role access (allowed vs denied per app)    | P0 — Phase 2  |
| Logout + token revocation                  | P1 — Phase 2  |
| Critical business workflows (per vertical) | P1+ — Phase 3 |

E2E runs against local Docker stack or CI-compose — never production.

---

## What not to do

| ❌ Forbidden                                  | ✅ Instead                               |
| --------------------------------------------- | ---------------------------------------- |
| Hit production API/DB in tests                | Mock or use CI service containers        |
| Depend on test execution order                | Isolated tests with `beforeEach` cleanup |
| Snapshot entire API responses with timestamps | Assert shape and stable fields           |
| Skip tests with `.skip` without ticket        | Fix or delete; track debt explicitly     |
| Test private methods directly                 | Test via public API surface              |

---

## Mocking guidelines

```typescript
// ✅ Mock at module boundary
jest.mock('@kolab/database', () => ({ prisma: { user: { findUnique: jest.fn() } } }));

// ✅ Mock auth utilities
jest.mock('@kolab/auth', () => ({ verifyPassword: jest.fn(), ... }));
```

- Reset mocks in `beforeEach`
- Do not mock the unit under test
- Prefer dependency injection in NestJS for test doubles

---

## CI integration

GitHub Actions `test` job:

- Starts PostgreSQL and Redis service containers
- Runs `pnpm db:generate`
- Runs `pnpm test`
- Validates Prisma schema

Local parity:

```bash
docker compose up postgres redis -d
pnpm db:generate
pnpm test
```

---

## Definition of Done (testing)

A change meets testing standards when:

- [ ] New/changed services have unit tests
- [ ] New/changed guards have unit tests
- [ ] Auth/security changes have dedicated tests
- [ ] `pnpm test` passes locally
- [ ] CI test job passes
- [ ] E2E added or ticket filed for P0 flows (Phase 2 onward)

---

## Related docs

- [Coding standards — Definition of Done](./coding-standards.md#definition-of-done)
- [Backend standards](./backend-standards.md)
- [Quality gates](./quality-gates.md)

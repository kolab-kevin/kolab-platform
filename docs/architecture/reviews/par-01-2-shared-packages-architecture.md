# PAR-01.2 Shared Packages Architecture Review

**Status:** ✅ **Complete**  
**Review date:** 2026-07-21  
**Branch reviewed:** `develop` (assessment branch: `feature/par-01-2-shared-packages-review`)  
**Framework:** [PAR-01 Platform Architecture Review](../par-01-platform-architecture-review.md)  
**Prior review:** [PAR-01.1 Repository Architecture Review](./par-01-1-repository-architecture.md)  
**Roles:** Owner — Platform Architect · Reviewer — Frontend + Backend Leads · Decision authority — Engineering Leadership

---

## Executive Summary

KŌLAB’s sixteen `@kolab/*` packages form a **recognizable platform layer**: `@kolab/types` and `@kolab/config` anchor contracts and environment validation; `@kolab/auth`, `@kolab/database`, and `@kolab/storage` implement core backend capabilities; `@kolab/sdk` and `@kolab/ui` support Next.js apps; tooling packages standardize lint and TypeScript.

The layer is **adequate for v1** but **not Phase-2-ready without structural hardening**. Strengths include clean dependency direction (no packages import apps), Zod-backed types, tested auth and storage modules, and explicit placeholder comments in stub packages. Weaknesses include a **monolithic `@kolab/types` barrel** (~21 domain modules, `live-intelligence.ts` alone ~950 lines), **runtime coupling of `@kolab/ui` to `@kolab/auth`**, **zero package READMEs**, **sparse tests** outside auth/storage, and **five buildable stub packages** with no consumers. `@kolab/observability` exports working Pino logging and a NestJS exception filter but **OpenTelemetry and Sentry are placeholders** that log warnings when configured.

**Verdict:** Shared packages are **partially ready**. Core backend packages can support Phase 2 incrementally; **types decomposition, UI boundary ADR, stub registry, and test coverage for contract packages** are conditions before scaling integrations, AI, finance, and mobile.

**Final PAR-01.2 score:** **2.7 / 5 — ★★☆☆☆ Needs Work**

| Dimension     | Score | Rating |
| ------------- | ----- | ------ |
| Correctness   | 3     | ★★★☆☆  |
| Scalability   | 2     | ★★☆☆☆  |
| Operability   | 3     | ★★★☆☆  |
| Changeability | 2     | ★★☆☆☆  |
| Risk          | 3     | ★★★☆☆  |

---

## Scope and Method

**In scope:** All packages under `packages/` — implemented, partially implemented, configuration-only, and placeholder.

**Method:** Inspected `package.json`, `exports`, `src/index.ts`, dependency graphs, test files, seed usage, and consumer `package.json` / import patterns across `apps/`. Ran repository searches for stub consumption and app→package boundary violations. No code or configuration was modified.

**Classification legend:**

| Classification            | Meaning                                                        |
| ------------------------- | -------------------------------------------------------------- |
| **Implemented**           | Production logic used by apps; more than types/scaffolding     |
| **Partially implemented** | Some real capability; known gaps or placeholders in public API |
| **Configuration-only**    | Shared config presets; no runtime product logic                |
| **Placeholder / stub**    | Reserved package name; minimal types only; not a capability    |

---

## Shared Package Inventory

| Package                    | Classification        | Current responsibility                                                           | Primary consumers                                     | Test coverage           | Readiness               | Notes                                                                               |
| -------------------------- | --------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------- | ----------------------- | ----------------------------------------------------------------------------------- |
| `@kolab/types`             | Implemented           | Zod schemas and TS types for API/domain contracts (21 modules)                   | All apps, auth, sdk, ui                               | **None**                | v1 OK / Phase 2 at risk | Monolithic barrel; largest file `live-intelligence.ts` ~950 lines                   |
| `@kolab/config`            | Implemented           | Zod env schemas (`apiEnvSchema`, storage, observability); service port constants | api, storage, apps (transitive)                       | **None**                | v1 OK                   | `SERVICE_PORTS` omits manager-portal (3004)                                         |
| `@kolab/auth`              | Implemented           | JWT, refresh tokens, password hashing, RBAC, org RBAC, permissions               | api; ui (transitive); apps via `APP_ALLOWED_ROLES`    | **4 Vitest files** (CI) | Good                    | `APP_ALLOWED_ROLES` has no `managerPortal` entry                                    |
| `@kolab/database`          | Implemented           | Prisma client singleton; re-exports `@prisma/client`                             | api, public-api, mobile-api, ai-services              | **None**                | Good for v1             | Schema owned in `packages/database/prisma/`; seed uses `@kolab/auth` as devDep only |
| `@kolab/storage`           | Implemented           | S3 presign, key layout, upload validation, filename sanitization                 | api                                                   | **5 Jest specs** (CI)   | Good                    | Depends on `@kolab/config` for env parsing                                          |
| `@kolab/observability`     | Partially implemented | Pino logger, request ID, NestJS exception filter/middleware                      | api                                                   | **None**                | Partial                 | `otel.ts` and `sentry.ts` are placeholders (warn + no-op)                           |
| `@kolab/sdk`               | Partially implemented | Browser `AuthClient` (login/register/refresh/me/logout)                          | web, admin, creator-portal, manager-portal, moderator | **None**                | v1 OK                   | Single module; no broader API client surface                                        |
| `@kolab/ui`                | Partially implemented | shadcn-style primitives, auth forms, `AuthProvider`, error boundary              | Next.js apps                                          | **None**                | Early                   | 10 source files; **runtime** deps on `@kolab/auth` + `@kolab/sdk`                   |
| `@kolab/eslint-config`     | Configuration-only    | Shared ESLint flat configs (base, nestjs, next, node)                            | All TS packages/apps                                  | N/A                     | Good                    | Subpath exports only                                                                |
| `@kolab/typescript-config` | Configuration-only    | Shared `tsconfig` presets                                                        | All TS packages/apps                                  | N/A                     | Good                    | JSON presets; no build step                                                         |
| `@kolab/tailwind-config`   | Configuration-only    | Shared Tailwind preset                                                           | Next.js apps                                          | N/A                     | Good                    | Single export                                                                       |
| `@kolab/analytics`         | Placeholder / stub    | `AnalyticsEvent` type only                                                       | **None**                                              | None                    | Not ready               | Comment: "implemented in Phase 3"                                                   |
| `@kolab/ai`                | Placeholder / stub    | `AiModelProvider` union type only                                                | **None**                                              | None                    | Not ready               | `ai-services` app does not depend on this package                                   |
| `@kolab/streaming`         | Placeholder / stub    | `StreamStatus` type only                                                         | **None**                                              | None                    | Not ready               | Comment: "Phase 4"                                                                  |
| `@kolab/payments`          | Placeholder / stub    | `PaymentProvider` union type only                                                | **None**                                              | None                    | Not ready               | Comment: "Phase 3"                                                                  |
| `@kolab/notifications`     | Placeholder / stub    | `NotificationChannel` union type only                                            | **None**                                              | None                    | Not ready               | Comment: "Phase 3"                                                                  |

**Summary:** 8 implemented or partially implemented runtime packages · 3 configuration-only · 5 placeholders · **9 package test files total** (auth 4, storage 5).

---

## Dependency and Boundary Analysis

### Expected dependency direction

```text
                    ┌─────────────────┐
                    │  apps/*         │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
   @kolab/ui            @kolab/sdk           @kolab/database
   @kolab/auth               │                     │
         │                   │                     ▼
         └─────────┬─────────┘              @prisma/client
                   ▼
              @kolab/types  ←── @kolab/config (leaf, zod only)
                   ▲
              @kolab/storage ──→ @kolab/config

   @kolab/observability (pino; optional Nest peers)
   stub packages (no incoming app deps)
   eslint-config / typescript-config / tailwind-config (dev/tooling)
```

### Observed boundaries

| Check                               | Result                                                                                         |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| Packages importing application code | **None found**                                                                                 |
| Apps importing other apps           | Not in package scope; no violation in `packages/`                                              |
| Infrastructure in types             | **Mostly clean** — Zod schemas only; permissions enum in types, role maps in auth              |
| Circular workspace deps             | **No runtime cycle** — `@kolab/database` → `@kolab/auth` is devDependency (seed only)          |
| Catch-all modules                   | **`@kolab/types`** — all domains re-exported from single entry                                 |
| Duplicated definitions              | Permission strings in `types` + role-permission maps in `auth` (intentional split, drift risk) |
| Stub packages consumed              | **None** — analytics/ai/streaming/payments/notifications unused                                |

### High-coupling risks

1. **`@kolab/ui` → `@kolab/auth` + `@kolab/sdk`** — design system pulls auth runtime into every UI consumer build.
2. **`@kolab/database` re-exports `@prisma/client`** — broad surface; apps can import Prisma types directly.
3. **`@kolab/types` single barrel** — any schema change rebuilds all dependents; no subpath exports.
4. **Manager Portal role workaround** — `apps/manager-portal/components/app-providers.tsx` uses `APP_ALLOWED_ROLES.admin` because auth package lacks `managerPortal`.

---

## Package-by-Package Findings

### `@kolab/types` — Implemented

|                        |                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Purpose**            | Canonical API and domain contracts (Zod + inferred types).                                                                                 |
| **Current state**      | 21 modules exported from `src/index.ts`; heavy domains include live-intelligence, campaigns, creator-documents-contracts, recruitment-crm. |
| **Strengths**          | Single contract source for API and frontends; Zod validation at boundaries; no runtime deps except zod.                                    |
| **Weaknesses**         | No tests; monolithic barrel; no subpath exports; large files increase merge conflict and rebuild cost.                                     |
| **Risks**              | Contract drift undetected; Phase 2 domains amplify file size and coupling.                                                                 |
| **Recommended action** | Before Phase 2: split into domain subpaths or packages; add schema snapshot/unit tests for critical DTOs.                                  |

### `@kolab/config` — Implemented

|                        |                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| **Purpose**            | Environment validation and shared service metadata.                                               |
| **Current state**      | `parseEnv`, `apiEnvSchema`, storage and observability schemas; `SERVICE_PORTS` / `SERVICE_NAMES`. |
| **Strengths**          | Fail-fast env parsing; shared storage schema reused by `@kolab/storage`.                          |
| **Weaknesses**         | No tests; service registry missing manager-portal port 3004.                                      |
| **Risks**              | Silent misconfiguration when new apps ship without registry updates.                              |
| **Recommended action** | Fix now: add manager-portal to `SERVICE_PORTS`. Before Phase 2: test env schema edge cases.       |

### `@kolab/auth` — Implemented

|                        |                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Purpose**            | Authentication and authorization primitives (JWT, bcrypt, RBAC, organization RBAC, permissions).              |
| **Current state**      | 7 exported modules; Vitest coverage on jwt, rbac, permissions, organization-rbac.                             |
| **Strengths**          | Tested; depends only on `@kolab/types`; clear separation of permission definitions (types) vs maps (auth).    |
| **Weaknesses**         | `APP_ALLOWED_ROLES` incomplete for manager-portal; apps duplicate allowed-role wiring in `app-providers.tsx`. |
| **Risks**              | Wrong role gates for new surfaces; MP using admin roles is overly permissive or incorrect long-term.          |
| **Recommended action** | Fix now: add `managerPortal` to `APP_ALLOWED_ROLES`. Before Phase 2: ADR for org-role vs legacy-role model.   |

### `@kolab/database` — Implemented

|                        |                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| **Purpose**            | Prisma client lifecycle and schema ownership.                                               |
| **Current state**      | Singleton `prisma`; exports full `@prisma/client`; 15 migrations; seed in `prisma/seed.ts`. |
| **Strengths**          | Clear ownership of schema; dev-only auth import for seed hashing.                           |
| **Weaknesses**         | No package tests; re-exporting entire Prisma client widens import surface.                  |
| **Risks**              | Apps/services may bypass repository patterns via direct Prisma imports.                     |
| **Recommended action** | Before Phase 2: document Prisma import policy; consider narrowing exports (PAR-01.4).       |

### `@kolab/storage` — Implemented

|                        |                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| **Purpose**            | S3-compatible object storage abstraction (presign, keys, validation).                                   |
| **Current state**      | Full implementation with custom error types; Jest tests on keys, presign, validation, config, filename. |
| **Strengths**          | Well-tested; tenant-scoped key layout; config separation via `@kolab/config`.                           |
| **Weaknesses**         | Only consumed by `@kolab/api`; no integration test against MinIO in CI.                                 |
| **Risks**              | Low for v1; medium when finance/adult verticals need isolated buckets.                                  |
| **Recommended action** | Before Phase 2: document bucket isolation strategy for finance/adult domains.                           |

### `@kolab/observability` — Partially implemented

|                        |                                                                                                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**            | Logging, tracing, error reporting, NestJS integration.                                                                                                      |
| **Current state**      | **Implemented:** `createLogger` (Pino), `GlobalExceptionFilter`, request-id middleware. **Placeholder:** `initTelemetry`, `initSentry`, `captureException`. |
| **Strengths**          | Structured logging works; Nest filter includes requestId in JSON errors.                                                                                    |
| **Weaknesses**         | OTel/Sentry exports suggest capability that does not exist; no tests.                                                                                       |
| **Risks**              | Operators assume tracing/error reporting is live when env vars are set.                                                                                     |
| **Recommended action** | Fix now: document placeholder status in architecture README. Before Phase 2: implement or remove placeholder exports.                                       |

### `@kolab/sdk` — Partially implemented

|                        |                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| **Purpose**            | Client-side API access layer.                                                                |
| **Current state**      | `AuthClient` + `AuthApiError` only (`src/auth-client.ts`).                                   |
| **Strengths**          | Typed against `@kolab/types`; token handling with sessionStorage.                            |
| **Weaknesses**         | No tests; no non-auth API methods; apps build parallel service layers in `apps/*/services/`. |
| **Risks**              | Phase 2 multi-platform integrations duplicate fetch logic instead of extending sdk.          |
| **Recommended action** | Before Phase 2: ADR for sdk scope; add typed resource clients or document app-local pattern. |

### `@kolab/ui` — Partially implemented

|                        |                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Purpose**            | Shared React UI and auth shell for Next.js apps.                                                                   |
| **Current state**      | Button, Card, Input, Label, auth forms, AuthProvider, ErrorBoundary, globals.css.                                  |
| **Strengths**          | Consistent primitives; uses `@kolab/types` for form validation.                                                    |
| **Weaknesses**         | Runtime dependency on `@kolab/auth` and `@kolab/sdk`; no tests; small component set vs product UI surface in apps. |
| **Risks**              | Cannot reuse UI in non-auth contexts; design system changes require auth package builds.                           |
| **Recommended action** | Before Phase 2: split headless auth shell from primitives (PAR-01.7 overlap).                                      |

### `@kolab/eslint-config` — Configuration-only

|                        |                                                                     |
| ---------------------- | ------------------------------------------------------------------- |
| **Purpose**            | ESLint 9 flat configs for NestJS, Next.js, Node, base.              |
| **Current state**      | Subpath exports in `package.json`; no build step.                   |
| **Strengths**          | Consistent lint rules across monorepo.                              |
| **Weaknesses**         | None significant.                                                   |
| **Risks**              | Low.                                                                |
| **Recommended action** | Later: add package lint coverage to CI for all packages (PAR-01.1). |

### `@kolab/typescript-config` — Configuration-only

|                        |                                                            |
| ---------------------- | ---------------------------------------------------------- |
| **Purpose**            | Shared TypeScript compiler presets (`strict: true`, etc.). |
| **Current state**      | Four JSON presets.                                         |
| **Strengths**          | Enforces strict mode platform-wide.                        |
| **Weaknesses**         | None significant.                                          |
| **Risks**              | Low.                                                       |
| **Recommended action** | None required.                                             |

### `@kolab/tailwind-config` — Configuration-only

|                        |                                              |
| ---------------------- | -------------------------------------------- |
| **Purpose**            | Shared Tailwind theme/extension.             |
| **Current state**      | Single `tailwind.config.ts` export.          |
| **Strengths**          | DRY for Next.js apps.                        |
| **Weaknesses**         | None significant.                            |
| **Risks**              | Low.                                         |
| **Recommended action** | Align with design tokens review in PAR-01.7. |

### `@kolab/analytics` — Placeholder / stub

|                        |                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------- |
| **Purpose**            | Reserved for event tracking and platform analytics (Phase 3).                   |
| **Current state**      | Single `AnalyticsEvent` type; compiles via `tsc`; **not imported by any app**.  |
| **Strengths**          | Comment clearly states future phase.                                            |
| **Weaknesses**         | Occupies package name and Turbo graph slot without capability.                  |
| **Risks**              | Mistaken for implemented analytics pipeline.                                    |
| **Recommended action** | Before Phase 2: publish stub registry in docs; do not import until implemented. |

### `@kolab/ai` — Placeholder / stub

|                        |                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------- |
| **Purpose**            | Reserved for AI abstractions and model routing (Phase 3).                       |
| **Current state**      | `AiModelProvider` type only; **`apps/ai-services` does not depend on it**.      |
| **Strengths**          | Explicit placeholder comment.                                                   |
| **Weaknesses**         | Disconnected from `ai-services` app; duplicate conceptual ownership.            |
| **Risks**              | AI Expansion Phase 2 work may target wrong module.                              |
| **Recommended action** | Before Phase 2: ADR linking `@kolab/ai` vs `apps/ai-services` responsibilities. |

### `@kolab/streaming` — Placeholder / stub

|                        |                                                          |
| ---------------------- | -------------------------------------------------------- |
| **Purpose**            | Reserved for live streaming / SYMLCAST bridge (Phase 4). |
| **Current state**      | `StreamStatus` type only; no consumers.                  |
| **Strengths**          | Honest scope comment.                                    |
| **Weaknesses**         | Not wired to Production Workspace / OBS initiative.      |
| **Risks**              | Low until OBS Phase 2 starts.                            |
| **Recommended action** | Later: implement when OBS initiative begins.             |

### `@kolab/payments` — Placeholder / stub

|                        |                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------- |
| **Purpose**            | Reserved for payments and billing (Phase 3).                                    |
| **Current state**      | `PaymentProvider` type only; no consumers.                                      |
| **Strengths**          | Clear placeholder.                                                              |
| **Weaknesses**         | Financial platform will need isolated domain package — name reserved but empty. |
| **Risks**              | Finance Phase 2 may underestimate greenfield work.                              |
| **Recommended action** | Before Phase 2 finance gate: treat as greenfield; strict domain isolation ADR.  |

### `@kolab/notifications` — Placeholder / stub

|                        |                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------ |
| **Purpose**            | Reserved for email, push, in-app notifications (Phase 3).                            |
| **Current state**      | `NotificationChannel` type only; no consumers.                                       |
| **Strengths**          | Clear placeholder.                                                                   |
| **Weaknesses**         | Notification logic currently lives in API utils (`creators-notifications.utils.ts`). |
| **Risks**              | Duplicated notification paths when package is implemented.                           |
| **Recommended action** | Before Phase 2: map existing API notification code to future package boundary.       |

---

## Cross-Cutting Findings

### Exports

- Runtime packages use single `"."` export to `dist/` — consistent but prevents tree-shaking by domain.
- `@kolab/database` exports entire Prisma client — widest surface area.
- Stub packages export types that compile to empty or minimal JS — **must not be treated as features**.

### Types

- `@kolab/types` is the de facto API contract — **correct in intent**, **risky in shape** for Phase 2 scale.
- Permission types live in types; enforcement maps in auth — document sync discipline.

### Configuration

- `@kolab/config` centralizes env validation — good pattern.
- Storage config split between config (schema) and storage (runtime load) — clean.

### Testing

| Package                                         | Tests            |
| ----------------------------------------------- | ---------------- |
| auth                                            | 4 Vitest (in CI) |
| storage                                         | 5 Jest (in CI)   |
| types, config, database, sdk, ui, observability | 0                |
| stubs                                           | 0                |

Contract packages without tests are the highest regression risk.

### Observability

- Only `@kolab/api` depends on `@kolab/observability`.
- Placeholder OTel/Sentry functions should not drive SLO or on-call assumptions.

### Error conventions

- Storage: custom error classes (`StorageKeyError`, `UploadValidationError`).
- SDK: `AuthApiError` with HTTP status.
- Config: generic `Error` with JSON field errors.
- Auth RBAC: generic `Error('Insufficient permissions')`.
- **No shared `@kolab/errors` package** — acceptable at v1; consider before public API expansion.

### Ownership

| Domain            | Owner package     | Notes         |
| ----------------- | ----------------- | ------------- |
| Prisma schema     | `@kolab/database` | Clear         |
| JWT / RBAC        | `@kolab/auth`     | Clear         |
| API DTOs          | `@kolab/types`    | Overloaded    |
| Object storage    | `@kolab/storage`  | Clear         |
| Browser auth HTTP | `@kolab/sdk`      | Minimal       |
| UI shell          | `@kolab/ui`       | Overlaps auth |

No `packages/README.md` or ownership matrix exists.

### Documentation

- **Zero package-level README files** under `packages/`.
- Stub intent only in source comments — not in architecture inventory.

### Release / versioning

- All packages at `"version": "0.0.0"` with `workspace:*` pins.
- Root has `@changesets/cli` but packages are private and unreleased.
- **No breaking-change traceability** — acceptable for single-repo deploy; risky if packages publish externally in Phase 2.

---

## Strengths

1. **Clean apps→packages direction** — no package imports from `apps/`.
2. **Core backend packages are real** — auth, database, storage, config are implemented and used in production paths.
3. **Auth and storage tested** — only packages with automated tests cover security-critical paths.
4. **Stub honesty in source** — placeholder files state phase deferral explicitly.
5. **Shared tooling packages** — eslint, typescript, tailwind configs reduce drift.
6. **Storage abstraction quality** — tenant-scoped keys, validation, presign, tests.
7. **Config fail-fast** — Zod env parsing prevents silent misconfiguration.

---

## Weaknesses

1. **`@kolab/types` monolith** — all domains in one barrel; largest scalability bottleneck.
2. **`@kolab/ui` auth coupling** — design system depends on auth runtime.
3. **No tests on types, database, sdk, ui, observability** — contract and client drift likely.
4. **Five buildable stubs with zero consumers** — inventory noise and planning hazard.
5. **Observability placeholders exported as public API** — OTel/Sentry not implemented.
6. **Incomplete app role registry** — no `managerPortal` in `APP_ALLOWED_ROLES`; MP uses admin roles.
7. **No package documentation** — onboarding and ownership unclear.
8. **`@kolab/sdk` minimal** — apps duplicate service layers instead of shared client.

---

## Risks

See risk register table below (R-PAR-006–R-PAR-013).

---

## Risk register entries

| Risk ID   | Description                                                                                                   | Likelihood | Impact | Severity   | Mitigation                                                                | Target milestone |
| --------- | ------------------------------------------------------------------------------------------------------------- | ---------- | ------ | ---------- | ------------------------------------------------------------------------- | ---------------- |
| R-PAR-006 | `@kolab/types` monolithic barrel increases rebuild scope and merge conflicts as Phase 2 domains land          | High       | Medium | **High**   | Introduce domain subpath exports or split packages; add schema tests      | Before Phase 2   |
| R-PAR-007 | Five stub packages compile and appear in workspace but provide no capability — planners may assume they exist | Medium     | High   | **High**   | Publish stub registry; block imports in Phase 2 plans until implemented   | Before Phase 2   |
| R-PAR-008 | `@kolab/ui` runtime dependency on `@kolab/auth` couples design system to auth refactors                       | Medium     | Medium | **Medium** | Extract headless primitives; ADR for UI boundaries (PAR-01.7)             | Before Phase 2   |
| R-PAR-009 | No tests on `@kolab/types`, `@kolab/database`, `@kolab/sdk`, `@kolab/ui` — silent contract breakage           | Medium     | High   | **High**   | Add Vitest/Jest for schemas, AuthClient, critical DB helpers              | Before Phase 2   |
| R-PAR-010 | `@kolab/observability` OTel/Sentry exports are placeholders — ops may assume tracing works when env set       | Medium     | Medium | **Medium** | Document placeholders; implement or remove exports before production SLOs | Before Phase 2   |
| R-PAR-011 | `APP_ALLOWED_ROLES` lacks manager-portal; MP reuses admin roles                                               | High       | Medium | **Medium** | Add `managerPortal` role map; align with org RBAC                         | Fix now          |
| R-PAR-012 | No package READMEs or ownership matrix                                                                        | Low        | Medium | **Low**    | Add `packages/README.md` with classification and owners                   | Before Phase 2   |
| R-PAR-013 | All packages `0.0.0` / `workspace:*` — no semver signal for cross-repo consumers                              | Low        | Medium | **Low**    | ADR on versioning; Changesets when publishing                             | Later            |

---

## Recommendations

### Fix Now

1. **Add `managerPortal` to `APP_ALLOWED_ROLES`** in `@kolab/auth` and update manager-portal `app-providers.tsx` to use it (finding PAR-01.2-03; R-PAR-011).
2. **Add manager-portal to `@kolab/config` `SERVICE_PORTS` / `SERVICE_NAMES`** (finding PAR-01.2-04).
3. **Document observability placeholder status** in architecture inventory — OTel/Sentry are not implemented (R-PAR-010).

### Before Phase 2

1. **Publish shared package stub registry** — list analytics, ai, streaming, payments, notifications as placeholders only (R-PAR-007; closes PAR-01.1 R-PAR-005 action).
2. **Decompose or subpath-export `@kolab/types`** by domain (live, campaigns, crm, documents) (R-PAR-006).
3. **Add tests for `@kolab/types` critical schemas** and `@kolab/sdk` AuthClient (R-PAR-009).
4. **ADR: `@kolab/ui` vs `@kolab/auth` boundary** — headless components vs auth shell (R-PAR-008).
5. **ADR: `@kolab/ai` vs `apps/ai-services` ownership** before AI Expansion (stub package).
6. **Implement or remove observability placeholder exports** before SLO-based operations (R-PAR-010).
7. **Add `packages/README.md`** with classification, consumers, and owners (R-PAR-012).
8. **Define `@kolab/sdk` expansion strategy** vs app-local services for Phase 2 integrations.

### Later

1. **Changesets / semver policy** when packages may publish outside monorepo (R-PAR-013).
2. **Narrow `@kolab/database` exports** if direct Prisma leakage becomes problematic (PAR-01.4).
3. **Implement stub packages** only when their Phase 2 initiative starts — not preemptively.

---

## Phase 2 Readiness

| Question                                          | Answer                                                                                                                 |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Is shared-package architecture ready for Phase 2? | **Conditionally no** — core backend packages yes; contract layer and client/UI boundaries need hardening.              |
| Blocking conditions                               | Types decomposition plan; stub registry; tests on contract packages; manager-portal role fix; observability honesty.   |
| Ready today                                       | `@kolab/auth`, `@kolab/storage`, `@kolab/config`, `@kolab/database` (with PAR-01.4 follow-up)                          |
| Not ready                                         | `@kolab/analytics`, `@kolab/ai`, `@kolab/streaming`, `@kolab/payments`, `@kolab/notifications` — **placeholders only** |
| Partial                                           | `@kolab/types`, `@kolab/ui`, `@kolab/sdk`, `@kolab/observability`                                                      |

---

## Scores

### Dimension detail

| Dimension         | Score | Evidence                                                                              | Reasoning                                                                        | Recommendation                                       |
| ----------------- | ----- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **Correctness**   | 3     | Auth/storage implemented and tested; types used consistently; stubs labeled in source | Core paths correct; MP role gap and observability placeholders reduce confidence | Fix APP_ALLOWED_ROLES; document observability gaps   |
| **Scalability**   | 2     | 21-module types barrel; ~950-line live-intelligence schema file                       | Single package will not scale with Phase 2 domain growth                         | Subpath exports or domain packages                   |
| **Operability**   | 3     | Pino logging works; env validation; no package runbooks                               | Placeholder telemetry; no package docs                                           | Implement OTel/Sentry or remove; add packages README |
| **Changeability** | 2     | ui→auth coupling; monolithic types; sdk minimal                                       | Refactors ripple across all apps                                                 | UI boundary ADR; types split                         |
| **Risk**          | 3     | Stubs unused but buildable; test gaps on contracts                                    | Mitigations identified; not yet tracked as tasks                                 | Execute stub registry and schema tests               |

### Final score

**2.7 / 5 — ★★☆☆☆ Needs Work** (average of dimension scores; Scalability and Changeability below Phase 2 threshold)

---

## Traceability

| Finding ID  | Finding                                         | Framework section   | Risk ID   | Affected packages                                 | Milestone      |
| ----------- | ----------------------------------------------- | ------------------- | --------- | ------------------------------------------------- | -------------- |
| PAR-01.2-01 | `@kolab/types` monolithic barrel                | PAR-01.2, PAR-01.5  | R-PAR-006 | types                                             | Before Phase 2 |
| PAR-01.2-02 | Stub packages buildable but unimplemented       | PAR-01.2, PAR-01.14 | R-PAR-007 | analytics, ai, streaming, payments, notifications | Before Phase 2 |
| PAR-01.2-03 | Manager Portal uses `APP_ALLOWED_ROLES.admin`   | PAR-01.2, PAR-01.8  | R-PAR-011 | auth, manager-portal                              | Fix now        |
| PAR-01.2-04 | `SERVICE_PORTS` missing manager-portal          | PAR-01.2, PAR-01.1  | R-PAR-003 | config                                            | Fix now        |
| PAR-01.2-05 | `@kolab/ui` depends on `@kolab/auth` at runtime | PAR-01.2, PAR-01.7  | R-PAR-008 | ui, auth                                          | Before Phase 2 |
| PAR-01.2-06 | No tests on types, database, sdk, ui            | PAR-01.2            | R-PAR-009 | types, database, sdk, ui                          | Before Phase 2 |
| PAR-01.2-07 | OTel/Sentry placeholders in observability       | PAR-01.2, PAR-01.11 | R-PAR-010 | observability                                     | Before Phase 2 |
| PAR-01.2-08 | No package-level documentation                  | PAR-01.2            | R-PAR-012 | all                                               | Before Phase 2 |
| PAR-01.2-09 | `@kolab/ai` disconnected from `ai-services` app | PAR-01.2, PAR-01.14 | R-PAR-007 | ai, ai-services                                   | Before Phase 2 |
| PAR-01.2-10 | All packages 0.0.0 workspace pins               | PAR-01.2, PAR-01.20 | R-PAR-013 | all                                               | Later          |

---

## Evidence inspected

| Area              | Paths                                                                               |
| ----------------- | ----------------------------------------------------------------------------------- |
| Package manifests | `packages/*/package.json`                                                           |
| Public APIs       | `packages/*/src/index.ts`, key source modules                                       |
| Tests             | `packages/**/*.test.ts`, `packages/**/*.spec.ts`                                    |
| Stubs             | `packages/analytics`, `ai`, `streaming`, `payments`, `notifications` `src/index.ts` |
| Observability     | `packages/observability/src/otel.ts`, `sentry.ts`, `logger.ts`                      |
| Consumers         | `apps/*/package.json`, sample imports in api and portals                            |
| Config registry   | `packages/config/src/services.ts`                                                   |
| Auth roles        | `packages/auth/src/rbac.ts`, `apps/manager-portal/components/app-providers.tsx`     |
| Database          | `packages/database/src/index.ts`, `prisma/schema.prisma`, `prisma/seed.ts`          |

---

## Related documentation

- [PAR-01 framework](../par-01-platform-architecture-review.md)
- [PAR-01.1 Repository Architecture Review](./par-01-1-repository-architecture.md)
- [System map](../system-map.md)
- [Backend standards](../../engineering/backend-standards.md)
- [Frontend standards](../../engineering/frontend-standards.md)

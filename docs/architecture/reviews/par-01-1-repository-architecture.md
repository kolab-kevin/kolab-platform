# PAR-01.1 — Repository Architecture Review

**Status:** ✅ **Complete**  
**Review date:** 2026-07-06  
**Branch reviewed:** `develop` (assessment branch: `feature/par-01-1-repository-review`)  
**Framework:** [PAR-01 Platform Architecture Review](../par-01-platform-architecture-review.md)  
**Roles:** Owner — Platform Architect · Reviewer — Engineering Lead · Decision authority — CTO / Head of Engineering

---

## Executive summary

The KŌLAB monorepo is a **sound Turborepo + pnpm workspace** with clear `apps/` and `packages/` separation, consistent `@kolab/*` naming, and mature local developer workflow scripts. It is **appropriate for the current post-v1 stage** — Creator Studio and Manager Portal ship as distinct Next.js apps; the core NestJS API and shared packages form a credible platform spine.

The repository is **not yet Phase-2-ready from a quality-governance perspective**. CI enforces backend (`@kolab/api`) and docs markdown only. Shipped frontends (`@kolab/creator-portal`, `@kolab/manager-portal`) have Vitest suites and Turbo tasks but **do not run in CI**. Platform inventory docs (`README.md`, `docs/architecture/README.md`, `docker-compose.yml`) **omit Manager Portal** (port 3004), which creates onboarding and deployment drift. Branch documentation conflicts: [branch-strategy.md](../../engineering/branch-strategy.md) bases features on `main`; workflow scripts and CI use `develop`.

**Verdict:** Repository structure is **acceptable (★★★☆☆)** with known gaps. No structural rewrite is required before Phase 2, but **CI scope, inventory docs, and branch-model clarity must be fixed before Phase 2 kickoff**.

**Final PAR-01.1 score:** **3.2 / 5 — ★★★☆☆ Acceptable**

| Dimension     | Score | Rating |
| ------------- | ----- | ------ |
| Correctness   | 3     | ★★★☆☆  |
| Scalability   | 3     | ★★★☆☆  |
| Operability   | 4     | ★★★★☆  |
| Changeability | 3     | ★★★☆☆  |
| Risk          | 3     | ★★★☆☆  |

---

## Specific review questions

| Question                                                         | Answer                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Is the monorepo structure appropriate for KŌLAB’s current stage? | **Yes.** Nine apps and sixteen packages match multi-surface delivery without premature service extraction.                                                                                                                                                 |
| Are apps and packages separated clearly?                         | **Mostly yes.** Deployable surfaces live in `apps/`; shared code in `packages/`. Some domain logic remains in app `services/` layers (expected for v1).                                                                                                    |
| Are shared packages well-scoped or becoming dumping grounds?     | **Mixed.** Core packages (`types`, `auth`, `database`, `ui`, `sdk`) are purposeful. Phase placeholders (`analytics`, `ai`, `streaming`, `payments`, `notifications`) are single-file stubs — acceptable if labeled, risky if mistaken for implementations. |
| Is the frontend/backend split clear?                             | **Yes structurally** (NestJS in `apps/api`, Next.js portals). **No operationally** — CI treats backend as the gate; frontends are second-class in automation.                                                                                              |
| Are docs organized well enough for future developers?            | **Yes at hub level** (`docs/README.md`, 75 docs markdown files). **Stale at inventory level** — architecture README and root README lag shipped apps.                                                                                                      |
| Are build/test/lint scripts discoverable and reliable?           | **Locally yes** (`pnpm validate`, workflow scripts). **In CI partially** — `pnpm validate` is broader than what CI runs.                                                                                                                                   |
| Are generated files and artifacts controlled properly?           | **Mostly yes** (`.gitignore` covers `dist/`, `.next/`, `.turbo/`, `*.tsbuildinfo`). Manager Portal requires `fix-next-env.mjs` workaround — minor smell.                                                                                                   |
| Is the feature branch workflow sustainable?                      | **Yes for day-to-day** — Windows-friendly scripts, `verify:backend`, PR helpers. **Needs ADR** to reconcile `develop` vs `main` documentation.                                                                                                             |
| What should be improved before Phase 2?                          | Extend CI to shipped frontends; sync platform inventory docs; unify branch strategy docs; widen cycle checks; add Manager Portal to Docker Compose / CORS.                                                                                                 |
| What can wait?                                                   | Changesets adoption; legacy per-app Dockerfiles cleanup; full Turbo `validate` in CI; stub package implementation.                                                                                                                                         |

---

## Current repository map

Evidence: `pnpm stats:project` (2026-07-06), `package.json`, `pnpm-workspace.yaml`, directory listing.

```text
kolab-platform/
├── apps/                    # 9 deployable applications
│   ├── api                  # @kolab/api — NestJS core API (port 4000) — primary backend
│   ├── public-api           # @kolab/public-api (4001)
│   ├── mobile-api           # @kolab/mobile-api (4002)
│   ├── ai-services          # @kolab/ai-services (4003)
│   ├── web                  # @kolab/web (3000)
│   ├── admin                # @kolab/admin (3001)
│   ├── creator-portal       # @kolab/creator-portal (3002) — CS v1 shipped
│   ├── moderator            # @kolab/moderator (3003)
│   └── manager-portal       # @kolab/manager-portal (3004) — MP v1 shipped [missing from root README]
├── packages/                # 16 shared packages (@kolab/*)
│   ├── types, config, auth, database, storage, observability  # platform core
│   ├── sdk, ui, tailwind-config, eslint-config, typescript-config  # client/tooling
│   └── analytics, ai, streaming, payments, notifications     # phase stubs (minimal src)
├── docs/                    # 75 markdown files (~18k lines)
├── scripts/                 # workflow, quality, stats (14 files)
├── docker/                  # generic + legacy per-app Dockerfiles
├── .github/workflows/       # ci.yml, secret-scanning.yml
├── turbo.json               # build graph, remote cache enabled
├── pnpm-workspace.yaml      # apps/*, packages/*
├── docker-compose.yml       # postgres, redis, migrate, 7 app services (no manager-portal)
└── package.json             # root scripts: turbo, validate, feature:*, ci:backend
```

**Scale snapshot:** 1,017 tracked files · 93,201 code/schema lines · 17 API modules · 156 test files · 34 Prisma models · 15 migrations.

### Dependency direction (observed)

```text
@kolab/types  →  @kolab/auth, @kolab/sdk
@kolab/auth   →  @kolab/database (package dependency)
@kolab/types  →  @kolab/ui  (+ auth, sdk)
apps/*        →  workspace packages (no app-to-app imports observed in package.json)
```

Turbo `build` uses `dependsOn: ["^build"]` — correct upstream-first ordering.

---

## Scoring dimensions

### Correctness — 3 / 5 (★★★☆☆)

|                    |                                                                                                                                                                                                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Evidence**       | `pnpm-workspace.yaml`; `apps/api/package.json` depends only on `@kolab/*` packages; `turbo.json` build graph; `README.md` apps table lists 8 apps (no manager-portal); `docs/architecture/README.md` same gap; `docker-compose.yml` CORS allows ports 3000–3003 only                       |
| **Reasoning**      | Physical layout matches intended monorepo model. Documented platform inventory and local orchestration **do not match shipped reality** for Manager Portal. Branch strategy doc says features branch from `main`; `scripts/lib/workflow-utils.mjs` sets `DEFAULT_BASE_BRANCH = 'develop'`. |
| **Recommendation** | Reconcile branch docs with actual workflow (ADR). Update root README, architecture README, and `docker-compose.yml` to include `@kolab/manager-portal` and port 3004 CORS.                                                                                                                 |

### Scalability — 3 / 5 (★★★☆☆)

|                    |                                                                                                                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Evidence**       | `turbo.json` `remoteCache.enabled: true`; `pnpm-workspace.yaml` flat globs; CI builds only `@kolab/api` + Docker for `web`; 9 apps share one repo; stub packages reserved for Phase 2+ verticals                         |
| **Reasoning**      | Turborepo + pnpm scales for more apps/packages without repo splits. CI and Docker pipelines **do not yet scale with app count** — adding Phase 2 surfaces will increase undetected breakages if gate stays backend-only. |
| **Recommendation** | Before Phase 2: add CI matrix (or Turbo filter) for `@kolab/creator-portal`, `@kolab/manager-portal` lint/typecheck/test/build. Parameterize Docker builds for new apps.                                                 |

### Operability — 4 / 5 (★★★★☆)

|                    |                                                                                                                                                                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Evidence**       | Root `package.json` scripts (`dev`, `validate`, `ci:backend`, `feature:*`, `pr:*`, `verify:backend`, `docker:*`); `docs/engineering/developer-workflow.md`; `scripts/stats-project.mjs`; Husky + lint-staged; `docker-compose.yml` for local stack  |
| **Reasoning**      | Developers have discoverable commands and Windows-safe automation. `pnpm verify:backend` mirrors backend CI closely. `pnpm validate` is the full local gate but **not what CI runs**, which can surprise contributors who only watch GitHub checks. |
| **Recommendation** | Document CI vs `validate` delta in quality-gates.md (partially present — reinforce). Add `pnpm verify:frontend` mirroring proposed CI scope.                                                                                                        |

### Changeability — 3 / 5 (★★★☆☆)

|                    |                                                                                                                                                                                                                                                                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Evidence**       | `scripts/check-cycles.mjs` scans only `apps/api/src`, `packages/auth/src`, `packages/config/src`, `packages/types/src`; 16 packages with explicit `exports` in core libs; `@kolab/ui` depends on `@kolab/auth` and `@kolab/sdk`; duplicate Docker patterns (`docker/next-service.Dockerfile` + legacy `docker/creator-portal.Dockerfile`) |
| **Reasoning**      | Package boundaries support safe extension for backend core. Cycle detection **does not cover** creator/manager portals or most packages. UI coupling to auth/sdk increases change blast radius for design-system refactors.                                                                                                               |
| **Recommendation** | Expand `check:cycles` to all `apps/*/src` and `packages/*/src`. Document UI→auth dependency as intentional or extract headless primitives before Phase 2.                                                                                                                                                                                 |

### Risk — 3 / 5 (★★★☆☆)

|                    |                                                                                                                                                                                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Evidence**       | `.github/workflows/ci.yml` — lint/test/build scoped to `@kolab/api`; creator-portal and manager-portal have `vitest` tests not in CI; `scripts/check-licenses.mjs` exits 0 when `pnpm licenses list` unavailable; shipped MP/CS apps absent from Docker Compose |
| **Reasoning**      | Highest risk is **false confidence from green CI** while primary v1 UIs are ungated. License check soft-fail weakens supply-chain gate. Inventory drift causes misconfigured local/prod CORS and missing services.                                              |
| **Recommendation** | Treat frontend CI gap as Phase 2 blocker. Harden license check to fail in CI. Add manager-portal to compose and CORS lists.                                                                                                                                     |

---

## Strengths

1. **Clear monorepo skeleton** — `apps/*` + `packages/*` with `@kolab/*` naming and pnpm workspaces (`pnpm-workspace.yaml`).
2. **Turbo task graph** — `build`, `lint`, `typecheck`, `test` with `^build` dependency ordering and remote cache enabled (`turbo.json`).
3. **Strong local workflow** — `feature:start|finish|clean`, `pr:*`, `verify:backend`, `stats:project`; Windows-compatible Node `.mjs` scripts.
4. **Quality tooling at root** — ESLint shared config (`@kolab/eslint-config`), TypeScript presets (`@kolab/typescript-config`), Prettier, Husky, commitlint, markdownlint for docs.
5. **Comprehensive documentation hub** — 75 files under `docs/` with roadmap, architecture, API, engineering standards (~18k lines).
6. **Artifact hygiene** — `.gitignore` excludes build outputs; `.dockerignore` excludes `node_modules`, `.next`, `dist`.
7. **Backend CI spine** — Prisma validate, package build chain, API lint/test/typecheck, audit, cycle check, Docker build for API.

---

## Weaknesses

1. **CI scope mismatch** — CI gates backend only; Creator Studio and Manager Portal Vitest suites not executed in `.github/workflows/ci.yml`.
2. **Platform inventory drift** — `@kolab/manager-portal` missing from root `README.md`, `docs/architecture/README.md`, and `docker-compose.yml`.
3. **Branch model documentation conflict** — `branch-strategy.md` → `main`; workflow scripts → `develop`; CI runs on both branches.
4. **Narrow cycle detection** — `check-cycles.mjs` covers four paths, not full monorepo.
5. **Phase stub packages** — `analytics`, `ai`, `streaming`, `payments`, `notifications` are placeholder exports; easy to misread as implemented.
6. **Dual Docker file patterns** — generic `nest-service.Dockerfile` / `next-service.Dockerfile` coexist with legacy per-app Dockerfiles under `docker/`.
7. **Manager Portal Next.js workaround** — `fix-next-env.mjs` runs on build/lint/typecheck (`apps/manager-portal/package.json`).

---

## Risks

| ID        | Description                                                              | Severity | Likelihood |
| --------- | ------------------------------------------------------------------------ | -------- | ---------- |
| R-PAR-001 | Shipped frontends ungated by CI — regressions merge undetected           | High     | Medium     |
| R-PAR-002 | Branch strategy doc vs `develop` workflow causes wrong merge targets     | Medium   | Medium     |
| R-PAR-003 | Manager Portal omitted from compose/CORS/inventory — deployment friction | Medium   | High       |
| R-PAR-004 | Partial cycle checks miss coupling in portals and UI packages            | Medium   | Low        |
| R-PAR-005 | Stub packages mistaken for production-ready modules in Phase 2 planning  | Low      | Medium     |

Full register entries below.

---

## Recommendations

| #   | Recommendation                                                                                                  | Priority |
| --- | --------------------------------------------------------------------------------------------------------------- | -------- |
| 1   | Add CI jobs for `@kolab/creator-portal` and `@kolab/manager-portal` (lint, typecheck, test, build)              | P0       |
| 2   | Update root README, `docs/architecture/README.md`, `docker-compose.yml`, and API CORS for manager-portal (3004) | P0       |
| 3   | ADR: canonical integration branch (`develop` vs `main`) and update `branch-strategy.md`                         | P0       |
| 4   | Expand `check:cycles.mjs` to all apps and packages                                                              | P1       |
| 5   | Add `pnpm verify:frontend` script aligned with CI                                                               | P1       |
| 6   | Label stub packages in README/architecture docs as placeholders                                                 | P2       |
| 7   | Consolidate Docker strategy (generic Dockerfiles only)                                                          | Later    |
| 8   | Adopt Changesets when multi-app versioning becomes necessary                                                    | Later    |

---

## Fix now / before Phase 2 / later

| Item                                                                 | Timeline           | Rationale                                         |
| -------------------------------------------------------------------- | ------------------ | ------------------------------------------------- |
| Frontend CI for creator-portal + manager-portal                      | **Fix now**        | v1 surfaces are shipped; green CI must cover them |
| Platform inventory sync (README, architecture README, compose, CORS) | **Fix now**        | Onboarding and local dev correctness              |
| Branch strategy ADR + doc update                                     | **Fix now**        | Prevents merge/process errors                     |
| Expand cycle checks                                                  | **Before Phase 2** | Phase 2 adds integrations and packages            |
| `verify:frontend` script                                             | **Before Phase 2** | Matches expanded CI                               |
| Stub package labeling                                                | **Before Phase 2** | Prevents architectural assumptions                |
| Docker file consolidation                                            | **Later**          | Technical debt; not blocking                      |
| Turbo `validate` in CI                                               | **Later**          | Cost/time tradeoff; staged rollout preferred      |
| Changesets adoption                                                  | **Later**          | No multi-app release cadence yet                  |

---

## Traceability

| Finding ID  | Finding                                                                   | Evidence                                                                                                     | Related ADR / decision                      | Follow-up task                       | Target milestone |
| ----------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------- | ------------------------------------ | ---------------- |
| PAR-01.1-01 | CI does not run frontend lint/test/build for shipped v1 portals           | `.github/workflows/ci.yml`; `apps/creator-portal/package.json`; `apps/manager-portal/package.json`           | TBD — ADR: CI scope for monorepo            | TBD — issue: extend CI to CS/MP      | Fix now          |
| PAR-01.1-02 | Manager Portal missing from platform inventory and Docker Compose         | `README.md`; `docs/architecture/README.md`; `docker-compose.yml` (no manager-portal service; CORS 3000–3003) | TBD — doc sync policy                       | TBD — issue: inventory sync          | Fix now          |
| PAR-01.1-03 | Branch strategy doc conflicts with workflow scripts (`main` vs `develop`) | `docs/engineering/branch-strategy.md`; `scripts/lib/workflow-utils.mjs` `DEFAULT_BASE_BRANCH`                | TBD — ADR: git integration branch           | TBD — issue: reconcile branch docs   | Fix now          |
| PAR-01.1-04 | Cycle check covers minority of codebase                                   | `scripts/check-cycles.mjs` roots array                                                                       | —                                           | TBD — issue: expand madge roots      | Before Phase 2   |
| PAR-01.1-05 | Phase stub packages look like implementations                             | `packages/analytics/src/index.ts`; `packages/streaming/src/index.ts`                                         | —                                           | TBD — doc: stub package registry     | Before Phase 2   |
| PAR-01.1-06 | License check soft-fails when tooling unavailable                         | `scripts/check-licenses.mjs` catch block exits 0                                                             | —                                           | TBD — issue: fail CI on license skip | Before Phase 2   |
| PAR-01.1-07 | `@kolab/ui` depends on `@kolab/auth` and `@kolab/sdk`                     | `packages/ui/package.json`                                                                                   | TBD — design system boundary ADR (PAR-01.7) | TBD — PAR-01.7 review                | Before Phase 2   |

---

## Consolidated risk register entries

| Risk ID   | Section  | Risk description                                                                            | Severity | Likelihood | Business impact                                                            | Mitigation                                      | Timeline       | Owner              | Status |
| --------- | -------- | ------------------------------------------------------------------------------------------- | -------- | ---------- | -------------------------------------------------------------------------- | ----------------------------------------------- | -------------- | ------------------ | ------ |
| R-PAR-001 | PAR-01.1 | Creator Studio and Manager Portal are not in CI; UI regressions can merge with green checks | High     | Medium     | v1 product surfaces break silently; Phase 2 builds on broken UI foundation | Add Turbo-filtered CI jobs for both apps        | Fix now        | Platform Architect | Open   |
| R-PAR-002 | PAR-01.1 | Documented branch base (`main`) differs from automation base (`develop`)                    | Medium   | Medium     | PRs target wrong branch; release confusion                                 | ADR + update branch-strategy and git-standards  | Fix now        | Engineering Lead   | Open   |
| R-PAR-003 | PAR-01.1 | Manager Portal absent from compose, CORS, and top-level app tables                          | Medium   | High       | Local/prod misconfiguration; delayed MP deployments                        | Sync README, architecture README, compose, CORS | Fix now        | Platform Architect | Open   |
| R-PAR-004 | PAR-01.1 | Circular dependency scan skips portals and most packages                                    | Medium   | Low        | Hidden coupling blocks Phase 2 package splits                              | Expand `check:cycles.mjs` coverage              | Before Phase 2 | Platform Architect | Open   |
| R-PAR-005 | PAR-01.1 | Stub packages (`analytics`, `ai`, etc.) may be assumed production-ready                     | Low      | Medium     | Phase 2 plans overestimate existing capabilities                           | Document stub registry; enforce in PAR-01.2     | Before Phase 2 | Platform Architect | Open   |

---

## Review roles (framework compliance)

| Role                   | Assignment                |
| ---------------------- | ------------------------- |
| **Owner**              | Platform Architect        |
| **Reviewer**           | Engineering Lead          |
| **Decision authority** | CTO / Head of Engineering |

---

## Evidence inspected

| Area      | Paths                                                                              |
| --------- | ---------------------------------------------------------------------------------- |
| Workspace | `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.gitignore`, `.dockerignore` |
| Apps      | `apps/*/package.json`, source layout (api, creator-portal, manager-portal)         |
| Packages  | `packages/*/package.json`, stub `src/index.ts` files                               |
| Docs      | `docs/README.md`, `docs/architecture/README.md`, engineering standards             |
| Scripts   | `scripts/*.mjs`, `scripts/lib/workflow-utils.mjs`                                  |
| CI        | `.github/workflows/ci.yml`, `docs/engineering/quality-gates.md`                    |
| Docker    | `docker-compose.yml`, `docker/*.Dockerfile`                                        |
| Tooling   | `packages/eslint-config/`, `packages/typescript-config/`, `.husky/`                |
| Stats     | `pnpm stats:project` output (2026-07-06)                                           |

---

## Related documentation

- [PAR-01 framework](../par-01-platform-architecture-review.md)
- [Developer workflow](../../engineering/developer-workflow.md)
- [Branch strategy](../../engineering/branch-strategy.md)
- [Quality gates](../../engineering/quality-gates.md)
- [System map](../system-map.md)

# Quality Gates

Every pull request to `main` or `develop` must pass all quality gates before merge. CI enforces these in [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml); run `pnpm ci:backend` locally to mirror the backend gate.

## Gate summary

| Gate                            | Local command         | CI job                 | Blocks merge |
| ------------------------------- | --------------------- | ---------------------- | ------------ |
| Backend platform                | `pnpm ci:backend`     | Lint, Test, Build      | Yes          |
| Backend verify (local workflow) | `pnpm verify:backend` | —                      | No           |
| Security audit                  | `pnpm audit:ci`       | Security audit         | Yes          |
| License check                   | `pnpm check:licenses` | Security audit         | Yes          |
| Cycle check                     | `pnpm check:cycles`   | Security audit         | Yes          |
| Docker build                    | —                     | Docker build           | Yes          |
| Dependency review               | —                     | dependency-review (PR) | Yes          |
| Aggregate gate                  | —                     | Quality gate           | Yes          |

Branch protection requires these GitHub check names: **Lint**, **Test**, **Build**, **Docker build**, and **Quality gate**.

The **Quality gate** job aggregates all results — any failure blocks the PR.

## Backend gate steps

Runs on every push and pull request to `develop` or `main`:

1. Install dependencies with pnpm 9.15.0
2. Prisma validate (**Test** job)
3. Prisma generate (Lint, Test, Build jobs)
4. Build `@kolab/types` (**Build** job)
5. Build `@kolab/config` (**Build** job)
6. Test `@kolab/auth` (**Test** job)
7. Test `@kolab/storage` (**Test** job)
8. Typecheck `@kolab/api` (**Build** job)
9. Test `@kolab/api` (**Test** job)
10. Lint `@kolab/api` (**Lint** job)
11. Markdownlint `docs/**/*.md` (**Lint** job)

CI sets a dummy `DATABASE_URL` for Prisma validation and client generation. Storage tests mock the AWS SDK and do not require real S3 credentials.

## Local validation

Run the backend gate before opening a PR:

```bash
pnpm ci:backend
```

For day-to-day feature work on Windows, use the workflow scripts documented in [Developer workflow](./developer-workflow.md):

```bash
pnpm verify:backend
```

`pnpm verify:backend` runs the core backend checks used during feature development (Prisma validate/generate, types build, auth/storage/api tests, API lint, docs markdownlint). `pnpm ci:backend` remains the closest local mirror of CI and additionally builds shared packages such as `@kolab/config`.

Run the broader repo validation when touching frontend or shared formatting:

```bash
pnpm validate
```

## Pre-commit hooks

Husky runs `lint-staged` on every commit:

- `*.{ts,tsx,js,jsx,mjs,cjs}` — ESLint fix + Prettier
- `*.{json,md,yml,yaml,css}` — Prettier
- `*.md` — markdownlint fix

Commit messages are validated by Commitlint via the `commit-msg` hook.

## CI details

### Lint job

- `@kolab/api` ESLint
- Docs markdownlint (`docs/**/*.md`)

### Test job

- Prisma schema validation
- Prisma client generation
- `@kolab/auth`, `@kolab/storage`, and `@kolab/api` tests

### Build job

- Prisma client generation
- `@kolab/types` and `@kolab/config` builds
- `@kolab/api` typecheck

### Docker build job

- Validates `docker/nest-service.Dockerfile` (API) and `docker/next-service.Dockerfile` (Web)
- Runs after the Build job succeeds

### Security audit

- `pnpm audit:ci` — high-severity vulnerabilities in production dependencies
- `pnpm check:licenses` — allowed license policy (`scripts/check-licenses.mjs`)
- `pnpm check:cycles` — no circular package dependencies (`scripts/check-cycles.mjs`)

### Dependency review (PRs only)

- GitHub Dependency Review action fails on high-severity dependency changes

## PR checklist

Use the [PR template](../../.github/pull_request_template.md):

- [ ] `pnpm ci:backend` or `pnpm verify:backend` passes locally
- [ ] Conventional Commits used
- [ ] Branch follows naming convention
- [ ] Documentation updated if needed
- [ ] No secrets committed

## Troubleshooting

| Failure      | Fix                                                       |
| ------------ | --------------------------------------------------------- |
| Prisma       | Run `pnpm db:generate`; fix schema validation errors      |
| Type errors  | Build `@kolab/types` and `@kolab/config` first            |
| Test failure | Run `pnpm --filter <package> test` for targeted debugging |
| ESLint       | Run `pnpm --filter @kolab/api lint`                       |
| Docs lint    | Run `pnpm lint:md:docs`                                   |
| Audit        | Update vulnerable dependency or document exception        |
| Cycle        | Refactor imports to break circular dependency             |

## Related docs

- [Developer workflow](./developer-workflow.md)
- [Onboarding](./onboarding.md)
- [Turbo remote cache](./turbo-remote-cache.md)
- [Security](../security/README.md)

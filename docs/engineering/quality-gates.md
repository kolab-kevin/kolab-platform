# Quality Gates

Every pull request to `main` or `develop` must pass all quality gates before merge. CI enforces these in [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml); run `pnpm ci:backend` locally to mirror the backend gate.

## Gate summary

| Gate              | Local command         | CI job                 | Blocks merge |
| ----------------- | --------------------- | ---------------------- | ------------ |
| Backend platform  | `pnpm ci:backend`     | backend-quality-gate   | Yes          |
| Security audit    | `pnpm audit:ci`       | audit                  | Yes          |
| License check     | `pnpm check:licenses` | audit                  | Yes          |
| Cycle check       | `pnpm check:cycles`   | audit                  | Yes          |
| Dependency review | —                     | dependency-review (PR) | Yes          |

The `ci-gate` job aggregates all results — any failure blocks the PR.

## Backend gate steps

Runs on every push and pull request to `develop` or `main`. Steps execute in order:

1. Install dependencies with pnpm 9.15.0
2. Prisma validate (`@kolab/database`)
3. Prisma generate
4. Build `@kolab/types`
5. Build `@kolab/config`
6. Test `@kolab/auth`
7. Test `@kolab/storage`
8. Typecheck `@kolab/api`
9. Test `@kolab/api`
10. Lint `@kolab/api`
11. Markdownlint `docs/**/*.md`

CI sets a dummy `DATABASE_URL` for Prisma validation and client generation. Storage tests mock the AWS SDK and do not require real S3 credentials.

## Local validation

Run the backend gate before opening a PR:

```bash
pnpm ci:backend
```

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

### Backend quality gate job

- Node 20, pnpm 9.15.0, frozen lockfile install
- Explicit package-scoped commands for backend packages
- Docs markdownlint scoped to `docs/**/*.md`

### Security audit

- `pnpm audit:ci` — high-severity vulnerabilities in production dependencies
- `pnpm check:licenses` — allowed license policy (`scripts/check-licenses.mjs`)
- `pnpm check:cycles` — no circular package dependencies (`scripts/check-cycles.mjs`)

### Dependency review (PRs only)

- GitHub Dependency Review action fails on high-severity dependency changes

## PR checklist

Use the [PR template](../../.github/pull_request_template.md):

- [ ] `pnpm ci:backend` passes locally
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

- [Onboarding](./onboarding.md)
- [Turbo remote cache](./turbo-remote-cache.md)
- [Security](../security/README.md)

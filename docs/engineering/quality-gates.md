# Quality Gates

Every pull request to `main` must pass all quality gates before merge. CI enforces these in [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml); run `pnpm validate` locally to catch failures early.

## Gate summary

| Gate              | Local command         | CI job                       | Blocks merge |
| ----------------- | --------------------- | ---------------------------- | ------------ |
| Format            | `pnpm format:check`   | lint                         | Yes          |
| Lint              | `pnpm lint`           | lint                         | Yes          |
| Typecheck         | `pnpm typecheck`      | typecheck                    | Yes          |
| Test              | `pnpm test`           | test                         | Yes          |
| Security audit    | `pnpm audit:ci`       | audit                        | Yes          |
| License check     | `pnpm check:licenses` | audit                        | Yes          |
| Cycle check       | `pnpm check:cycles`   | audit                        | Yes          |
| Build             | `pnpm build`          | build                        | Yes          |
| Docker build      | —                     | docker                       | Yes          |
| Dependency review | —                     | dependency-review (PRs only) | Yes          |

The `ci-gate` job aggregates all results — any failure blocks the PR.

## Local validation

Run the full suite before opening a PR:

```bash
pnpm validate
```

Equivalent to:

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && \
  pnpm audit:ci && pnpm check:cycles && pnpm check:licenses && pnpm build
```

## Pre-commit hooks

Husky runs `lint-staged` on every commit:

- `*.{ts,tsx,js,jsx,mjs,cjs}` — ESLint fix + Prettier
- `*.{json,md,yml,yaml,css}` — Prettier
- `*.md` — markdownlint fix

Commit messages are validated by Commitlint via the `commit-msg` hook.

## CI details

### Lint

- Prettier format check across the repo
- ESLint via Turbo (`turbo lint`) plus markdownlint on all `.md` files

### Typecheck

- Requires `pnpm db:generate` first (Prisma client)
- Turbo runs `typecheck` across all packages with dependency ordering

### Test

- PostgreSQL 16 and Redis 7 service containers
- `pnpm test` via Turbo
- Prisma schema validation

### Security audit

- `pnpm audit:ci` — high-severity vulnerabilities in production dependencies
- `pnpm check:licenses` — allowed license policy (`scripts/check-licenses.mjs`)
- `pnpm check:cycles` — no circular package dependencies (`scripts/check-cycles.mjs`)

### Build

- Full monorepo build via Turbo
- Build artifacts uploaded for 7 days

### Docker build

- Validates `docker/nest-service.Dockerfile` (API) and `docker/next-service.Dockerfile` (Web)
- Runs after build job succeeds

### Dependency review (PRs only)

- GitHub Dependency Review action fails on high-severity dependency changes

## PR checklist

Use the [PR template](../../.github/pull_request_template.md):

- [ ] `pnpm validate` passes locally
- [ ] Conventional Commits used
- [ ] Branch follows naming convention
- [ ] Documentation updated if needed
- [ ] No secrets committed

## Troubleshooting

| Failure      | Fix                                                       |
| ------------ | --------------------------------------------------------- |
| Format       | `pnpm format`                                             |
| ESLint       | `pnpm lint:fix` or fix reported issues                    |
| Type errors  | Fix types; ensure `pnpm db:generate` ran                  |
| Test failure | Run `pnpm --filter <package> test` for targeted debugging |
| Audit        | Update vulnerable dependency or document exception        |
| Cycle        | Refactor imports to break circular dependency             |
| Build        | Check Turbo task outputs and env vars in `turbo.json`     |

## Related docs

- [Onboarding](./onboarding.md)
- [Turbo remote cache](./turbo-remote-cache.md)
- [Security](../security/README.md)

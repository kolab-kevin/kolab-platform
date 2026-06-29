# Developer Onboarding

Get the KŌLAB Platform monorepo running locally and contributing with confidence.

## Prerequisites

| Tool    | Version | Notes                                                      |
| ------- | ------- | ---------------------------------------------------------- |
| Node.js | ≥ 20    | Enforced via `engines` in root `package.json`              |
| pnpm    | 9.15.0  | Enforced via `packageManager` field; use `corepack enable` |
| Docker  | Latest  | PostgreSQL 16 and Redis 7 via `docker-compose.yml`         |
| Git     | Latest  | Husky hooks run on commit                                  |

Recommended: VS Code with extensions from [`.vscode/extensions.json`](../../.vscode/extensions.json).

## Repository setup

```bash
git clone <repo-url> kolab-platform
cd kolab-platform
corepack enable
pnpm install
```

`pnpm install` triggers the `prepare` script, which installs Husky git hooks.

## Environment configuration

```bash
cp .env.example .env
```

Key variables (see [`.env.example`](../../.env.example)):

- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `JWT_SECRET` — Minimum 32 characters (validated by `@kolab/config`)

For local dev without the full Docker stack, point `DATABASE_URL` at `localhost:5432` and `REDIS_URL` at `localhost:6379`.

## Start infrastructure

**Infrastructure only (recommended for daily dev):**

```bash
docker compose up postgres redis -d
pnpm db:generate
pnpm db:migrate
```

**Full stack (Docker-first):**

```bash
docker compose up -d --build
```

Verify API health: <http://localhost:4000/health>

## Run applications

```bash
pnpm dev
```

Turbo runs all apps in parallel. Filter to a single app when needed:

```bash
pnpm --filter @kolab/api dev
pnpm --filter @kolab/web dev
```

| App            | Package                 | Port |
| -------------- | ----------------------- | ---- |
| web            | `@kolab/web`            | 3000 |
| admin          | `@kolab/admin`          | 3001 |
| creator-portal | `@kolab/creator-portal` | 3002 |
| moderator      | `@kolab/moderator`      | 3003 |
| api            | `@kolab/api`            | 4000 |
| public-api     | `@kolab/public-api`     | 4001 |
| mobile-api     | `@kolab/mobile-api`     | 4002 |
| ai-services    | `@kolab/ai-services`    | 4003 |

Swagger docs: <http://localhost:4000/api/docs>

## Validate before pushing

Run the full local quality gate:

```bash
pnpm validate
```

This runs format check, lint, typecheck, test, security audit, cycle detection, license check, and build — matching CI expectations.

Individual commands:

```bash
pnpm lint          # ESLint + markdownlint
pnpm typecheck     # TypeScript across the monorepo
pnpm test          # Unit/integration tests
pnpm audit:ci      # pnpm audit (high severity, prod deps)
pnpm build         # Turbo build all packages
```

## Commit conventions

This repo uses [Conventional Commits](https://www.conventionalcommits.org/) enforced by Commitlint (`commitlint.config.js`).

**Format:** `type(scope): subject`

**Allowed types:** `feat`, `fix`, `refactor`, `docs`, `test`, `ci`, `build`, `perf`, `security`, `chore`, `revert`

**Examples:**

```text
feat(auth): add refresh token rotation
fix(api): handle expired JWT gracefully
docs(engineering): add onboarding guide
```

**Rules:**

- Subject max 100 characters
- No PascalCase or ALL CAPS in subject
- Pre-commit hook runs `lint-staged` (ESLint, Prettier, markdownlint on staged files)
- Commit-msg hook validates message format

## Branch and PR workflow

See [branch strategy](./branch-strategy.md) and [quality gates](./quality-gates.md).

1. Create a branch: `feature/`, `bugfix/`, `hotfix/`, or `release/`
2. Make changes; run `pnpm validate` locally
3. Open a PR against `main` using the [PR template](../../.github/pull_request_template.md)
4. Ensure CI passes before requesting review

## Useful commands

| Command            | Purpose                               |
| ------------------ | ------------------------------------- |
| `pnpm db:studio`   | Open Prisma Studio                    |
| `pnpm db:seed`     | Seed development data                 |
| `pnpm format`      | Auto-format with Prettier             |
| `pnpm lint:fix`    | Auto-fix lint issues                  |
| `pnpm docker:logs` | Tail Docker service logs              |
| `pnpm clean`       | Clear Turbo cache and build artifacts |

## Next steps

- [Coding standards](./coding-standards.md)
- [Architecture](../architecture/README.md)
- [Local development runbook](../runbooks/local-development.md)
- [Turbo remote cache setup](./turbo-remote-cache.md)

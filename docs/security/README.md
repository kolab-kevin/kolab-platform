# Security

Security practices for the KŌLAB Platform monorepo — automated scanning, dependency management, HTTP hardening, and secret handling.

## Overview

| Control             | Mechanism      | Location                                                                               |
| ------------------- | -------------- | -------------------------------------------------------------------------------------- |
| Dependency updates  | Dependabot     | [`.github/dependabot.yml`](../../.github/dependabot.yml)                               |
| Secret scanning     | Gitleaks       | [`.github/workflows/secret-scanning.yml`](../../.github/workflows/secret-scanning.yml) |
| Vulnerability audit | pnpm audit     | `pnpm audit:ci` in CI                                                                  |
| License compliance  | Custom script  | `scripts/check-licenses.mjs`                                                           |
| HTTP headers        | Helmet         | NestJS APIs (`apps/api/src/main.ts`)                                                   |
| JWT secrets         | Zod validation | `@kolab/config` (`jwtEnvSchema`)                                                       |
| Dependency review   | GitHub Action  | CI on pull requests                                                                    |

## Dependabot

Automated dependency PRs on a weekly schedule:

| Ecosystem      | Schedule  | Grouping                        |
| -------------- | --------- | ------------------------------- |
| npm (pnpm)     | Monday    | Production + development groups |
| Docker         | Tuesday   | Per Dockerfile                  |
| GitHub Actions | Wednesday | Workflow actions                |

- Open PR limit: 10 concurrent npm PRs
- Review and merge Dependabot PRs through the normal [quality gate](../engineering/quality-gates.md) process
- High-severity changes are flagged by Dependency Review in CI

## Secret scanning

Gitleaks runs on every push and pull request to `main`:

- Scans full git history (`fetch-depth: 0`)
- Detects API keys, tokens, private keys, and common secret patterns
- Fails the workflow if secrets are found

**Prevention:**

- Never commit `.env` files — only `.env.example` with placeholder values
- Use gitignored local env files for development
- Pre-commit hooks do not replace secret scanning; Gitleaks catches historical leaks

## Dependency audit

```bash
pnpm audit:ci    # CI: high severity, production deps only
pnpm audit       # Local: high severity, all deps
```

CI fails on high-severity vulnerabilities. Remediation:

1. Update the affected package via Dependabot or manual bump
2. If no fix exists, assess risk and document in [dependency-audit.md](./dependency-audit.md)
3. Never suppress audit failures without team review

Additional checks in CI:

- `pnpm check:licenses` — blocks disallowed open-source licenses
- `pnpm check:cycles` — prevents architectural coupling that complicates security reviews

## Helmet (HTTP security headers)

NestJS APIs apply [Helmet](https://helmetjs.github.io/) middleware for secure HTTP defaults. See [headers.md](./headers.md) for the full header reference.

Currently configured in `@kolab/api`:

```typescript
app.use(helmet());
```

Apply the same pattern to other NestJS services as they reach production readiness.

## JWT secrets

Authentication uses JWT access tokens with refresh token rotation (Phase 1).

| Variable             | Requirement           | Default                   |
| -------------------- | --------------------- | ------------------------- |
| `JWT_SECRET`         | Minimum 32 characters | Must be set in production |
| `JWT_ACCESS_EXPIRY`  | Duration string       | `15m`                     |
| `JWT_REFRESH_EXPIRY` | Duration string       | `7d`                      |

Validation in `@kolab/config`:

```typescript
JWT_SECRET: z.string().min(32);
```

**Requirements:**

- Generate cryptographically random secrets for each environment
- Never reuse development secrets in staging or production
- Rotate secrets via deployment config, not source code
- Docker Compose uses a dev default — override via `.env` for any shared environment

## Environment variables

- Root template: [`.env.example`](../../.env.example)
- Per-app templates: `apps/*/.env.example`
- Parsed and validated at startup via `@kolab/config` Zod schemas
- `DATABASE_URL`, `REDIS_URL`, and `JWT_SECRET` are required for API services

## Reporting vulnerabilities

If you discover a security issue:

1. Do not open a public GitHub issue
2. Contact the platform security team directly
3. Follow the [incident response runbook](../runbooks/incident-response.md) for active exploits

## Related docs

- [Dependency audit remediation](./dependency-audit.md)
- [Security headers](./headers.md)
- [Quality gates](../engineering/quality-gates.md)
- [Coding standards — security](../engineering/coding-standards.md#security-in-code)
- [Architecture — authentication](../architecture/README.md)

# Git Standards

Version control, branching, commits, and pull request requirements for KŌLAB Platform.

Enforced locally by **Husky** + **Commitlint** + **lint-staged**. Enforced remotely by **GitHub branch protection** and CI quality gates.

---

## Branch naming

All branches use lowercase kebab-case after the prefix.

| Prefix      | Purpose                             | Example                               |
| ----------- | ----------------------------------- | ------------------------------------- |
| `feature/*` | New functionality                   | `feature/creator-analytics-dashboard` |
| `bugfix/*`  | Non-urgent defect fixes             | `bugfix/login-redirect-loop`          |
| `hotfix/*`  | Urgent production fixes             | `hotfix/refresh-token-leak`           |
| `release/*` | Release preparation                 | `release/v1.2.0`                      |
| `docs/*`    | Documentation-only changes          | `docs/coding-standards`               |
| `chore/*`   | Tooling, deps, CI, no product logic | `chore/dependabot-eslint`             |

Include ticket/issue IDs when available:

```text
feature/KOL-142-tiktok-oauth
bugfix/KOL-198-jwt-expiry
```

See also [branch strategy](./branch-strategy.md) for workflow diagrams.

---

## Conventional Commits

**Conventional Commits are required** on every commit. Commitlint rejects invalid messages at commit time.

### Allowed types

| Type        | Use for                                                                  |
| ----------- | ------------------------------------------------------------------------ |
| `feat:`     | New feature                                                              |
| `fix:`      | Bug fix                                                                  |
| `refactor:` | Code change without behavior change                                      |
| `docs:`     | Documentation only                                                       |
| `test:`     | Tests only                                                               |
| `ci:`       | CI/CD changes                                                            |
| `build:`    | Build system or dependencies                                             |
| `perf:`     | Performance improvement                                                  |
| `security:` | Security fix or hardening                                                |
| `chore:`    | Maintenance (allowed by Commitlint; prefer specific types when possible) |
| `revert:`   | Revert a prior commit                                                    |

### Format

```text
<type>: <subject>

[optional body]

[optional footer]
```

Rules:

- Subject in imperative mood: "add auth guard" not "added auth guard"
- No trailing period on subject
- Header max 100 characters
- Subject not start-case or ALL CAPS

### Examples

```text
feat: add creator portal dashboard shell
fix: reject expired refresh tokens on rotation
security: enforce minimum JWT secret length
docs: add backend coding standards
test: cover RolesGuard denied access path
ci: parallelize lint and typecheck jobs
```

---

## Merge policy

| Phase                       | Policy                                                   |
| --------------------------- | -------------------------------------------------------- |
| **Initial solo setup**      | Direct commits to `main` acceptable for bootstrapping    |
| **Team development begins** | **PR required for all changes to `main`**                |
| **Ongoing**                 | No direct commits to `main` once team development begins |

`main` is protected:

- Require pull request before merge
- Require CI quality gate to pass
- Require Conventional Commit messages
- Require code review (recommended: at least one approval)

Hotfixes still use PRs — expedited review, minimal diff.

---

## Pull request requirements

Every PR must include:

### 1. Purpose

Clear description of **why** the change exists and **what** it affects. Link issues/tickets.

### 2. Test evidence

Demonstrate verification:

```markdown
## Test plan

- [ ] pnpm validate passes locally
- [ ] Manual: logged in as admin@kolab.test on admin app
- [ ] Unit: auth.service.spec.ts — 3 new cases
```

Include screenshots for UI changes.

### 3. Risk notes

Call out:

- Breaking API or schema changes
- Migration impact (forward/backward compatibility)
- Security or RBAC surface changes
- Performance implications
- Rollback plan for hotfixes

Use the [PR template](../../.github/pull_request_template.md).

---

## Pre-commit workflow

On every commit, Husky runs:

1. **pre-commit** → `lint-staged` (ESLint + Prettier + markdownlint on staged files)
2. **commit-msg** → Commitlint validates message format

Bypassing hooks (`--no-verify`) is **forbidden** except emergencies — document in PR if unavoidable.

---

## Related docs

- [Branch strategy](./branch-strategy.md)
- [Coding standards — review checklist](./coding-standards.md#code-review-checklist)
- [Quality gates](./quality-gates.md)
- [Onboarding — commit conventions](./onboarding.md)

# Developer Workflow

Windows-friendly automation for repetitive KOLAB feature development tasks. Scripts are implemented as Node `.mjs` files so they work in PowerShell, CMD, and Git Bash.

All commands run from the repository root.

---

## Quick reference

| Command                                  | Purpose                                            |
| ---------------------------------------- | -------------------------------------------------- |
| `pnpm feature:start <branch-name>`       | Create or checkout a feature branch from `develop` |
| `pnpm verify:backend`                    | Run backend verification before a PR               |
| `pnpm feature:finish "<commit message>"` | Verify, commit, push, print PR URL                 |
| `pnpm feature:clean <branch-name>`       | Remove merged feature branch locally/remotely      |
| `pnpm stats:project`                     | Print repository stats                             |

---

## 1. Start a feature branch

```powershell
pnpm feature:start live-timeline-replay
```

Branch name normalization:

- `live-timeline-replay` → `feature/live-timeline-replay`
- `feature/live-timeline-replay` → unchanged

What it does:

1. `git checkout develop`
2. `git pull origin develop`
3. Create the branch if missing, otherwise checkout the existing branch
4. `git push -u origin <branch>`
5. Print next steps

Help:

```powershell
pnpm feature:start --help
```

---

## 2. Backend verification

```powershell
pnpm verify:backend
```

Runs, in order:

1. Prisma validate
2. Prisma generate
3. `@kolab/types` build
4. `@kolab/auth` test
5. `@kolab/storage` test
6. `@kolab/api` typecheck
7. `@kolab/api` test
8. `@kolab/api` lint
9. Docs markdownlint (`pnpm lint:md:docs`)

The script exits non-zero on the first failure and prints the failing command. Output is not hidden.

Use this before opening a backend PR. For the broader CI mirror that also builds additional packages, use `pnpm ci:backend` ([quality gates](./quality-gates.md)).

---

## 3. Finish a feature branch

```powershell
pnpm feature:finish "feat: add live timeline replay API"
```

What it does:

1. `git status`
2. `pnpm verify:backend`
3. `git add .`
4. `git commit -m "<commit message>"`
5. `git push`
6. Print a suggested GitHub PR URL (`develop` → current branch)

Safety:

- Refuses to run on `develop` or `main`
- Does **not** merge automatically
- Uses your commit message verbatim — follow [Conventional Commits](./git-standards.md)

Help:

```powershell
pnpm feature:finish --help
```

---

## 4. Clean a merged feature branch

```powershell
pnpm feature:clean live-timeline-replay
pnpm feature:clean feature/live-timeline-replay --delete-remote
```

What it does:

1. Checkout `develop`
2. Pull latest `develop`
3. Fetch/prune `origin`
4. Delete the **local** branch only if it is merged into `develop` (`git branch -d`, never `-D`)
5. Delete the **remote** branch if it is merged into `origin/develop`
6. With `--delete-remote`, prompt before deleting an unmerged remote branch

Safe mode defaults:

- No force delete
- No remote delete unless merged, or explicitly confirmed with `--delete-remote`

---

## 5. Project stats

```powershell
pnpm stats:project
```

Prints:

- Tracked file count
- Docs markdown file count
- Markdown line count under `docs/`
- Code/schema line count
- Prisma model and enum counts
- Migration count
- API module directory count
- Test file count

Useful for progress snapshots during large feature work.

---

## Script locations

| Script           | File                             |
| ---------------- | -------------------------------- |
| Shared helpers   | `scripts/lib/workflow-utils.mjs` |
| `feature:start`  | `scripts/feature-start.mjs`      |
| `verify:backend` | `scripts/verify-backend.mjs`     |
| `feature:finish` | `scripts/feature-finish.mjs`     |
| `feature:clean`  | `scripts/feature-clean.mjs`      |
| `stats:project`  | `scripts/stats-project.mjs`      |

---

## Troubleshooting

| Problem                            | Fix                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------ |
| `develop` branch missing           | Fetch/create `develop` or update the base branch in `scripts/lib/workflow-utils.mjs` |
| `feature:start` push rejected      | Resolve remote conflicts manually, then rerun                                        |
| `feature:finish` blocked on verify | Fix the failing step from `pnpm verify:backend` output                               |
| `feature:clean` kept local branch  | Branch is not merged into `develop` yet                                              |
| PR URL not printed                 | Ensure `origin` is a GitHub remote (`git remote -v`)                                 |

---

## Related docs

- [Quality gates](./quality-gates.md)
- [Branch strategy](./branch-strategy.md)
- [Git standards](./git-standards.md)
- [Onboarding](./onboarding.md)

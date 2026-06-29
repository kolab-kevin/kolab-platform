# Turbo Remote Cache

Turbo remote caching shares build, lint, typecheck, and test results across machines and CI. Remote cache is enabled in [`turbo.json`](../../turbo.json):

```json
"remoteCache": {
  "enabled": true
}
```

Without credentials, Turbo falls back to local caching only.

## Why enable it

- **Faster CI** — Cache hits skip redundant work across workflow runs
- **Faster local dev** — Reuse artifacts from CI or teammates
- **Consistent inputs** — Same cache key = same output across environments

## Setup

### 1. Create a Vercel account and link the repo

Remote cache is hosted by [Vercel Turborepo](https://turbo.build/docs/core-concepts/remote-caching). Link your repository through the Vercel dashboard or CLI.

### 2. Obtain credentials

From the Vercel Turborepo settings for your team:

| Variable      | Source                               | Scope    |
| ------------- | ------------------------------------ | -------- |
| `TURBO_TOKEN` | Vercel → Team Settings → Tokens      | Secret   |
| `TURBO_TEAM`  | Vercel team slug (e.g. `team_kolab`) | Variable |

### 3. Configure locally

Add to your shell profile or a local env file (never commit):

```bash
export TURBO_TOKEN="your-token-here"
export TURBO_TEAM="your-team-slug"
```

Verify:

```bash
pnpm build
# Second run should show cache hits from remote
```

Alternatively, run `npx turbo login` and `npx turbo link` to configure interactively.

### 4. Configure CI

CI already reads these in [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml):

```yaml
env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}
```

**GitHub setup:**

1. Add `TURBO_TOKEN` as a repository **Secret**
2. Add `TURBO_TEAM` as a repository **Variable**

## Cache behavior

Turbo caches task outputs defined in `turbo.json`:

| Task        | Cached | Notes                          |
| ----------- | ------ | ------------------------------ |
| `build`     | Yes    | Outputs: `.next/**`, `dist/**` |
| `lint`      | Yes    | Depends on upstream `build`    |
| `typecheck` | Yes    | Outputs: `*.tsbuildinfo`       |
| `test`      | Yes    | Outputs: `coverage/**`         |
| `dev`       | No     | `cache: false`, persistent     |
| `clean`     | No     | `cache: false`                 |

Global dependencies that invalidate cache: `.env`, `tsconfig.json`, `.npmrc`.

Global env vars tracked: `NODE_ENV`, `CI`.

## Security notes

- Treat `TURBO_TOKEN` as a secret — it grants write access to your team's remote cache
- Do not commit tokens to the repo or `.env` files
- CI uses read/write access; local dev tokens should use team-scoped permissions
- Cache artifacts contain compiled output — ensure no secrets are embedded in build outputs

## Troubleshooting

| Symptom                 | Solution                                                        |
| ----------------------- | --------------------------------------------------------------- |
| No remote cache hits    | Verify `TURBO_TOKEN` and `TURBO_TEAM` are set                   |
| Cache miss on every run | Check `globalDependencies` changes; env vars may differ         |
| Auth errors             | Regenerate token; confirm team slug matches Vercel              |
| Stale cache             | Run `pnpm clean` locally; remote cache expires per Turbo policy |

## Related docs

- [Quality gates](./quality-gates.md)
- [Turbo docs — Remote Caching](https://turbo.build/docs/core-concepts/remote-caching)

# Dependency Audit Remediation

This document records deliberate dependency decisions when upstream packages have not yet published patched transitive dependencies.

## Audit gate

CI and local validation run:

```bash
pnpm audit:ci    # high severity, production dependencies only
```

The threshold is **not** lowered and audit is **not** silenced globally.

## Current overrides (root `package.json`)

| Package  | Override | Patched advisory floor | Transitive path                       |
| -------- | -------- | ---------------------- | ------------------------------------- |
| `multer` | `2.2.0`  | `>=2.2.0`              | `@nestjs/platform-express` → `multer` |
| `lodash` | `4.18.1` | `>=4.18.0`             | `@nestjs/swagger` → `lodash`          |

### Why upgrades alone were insufficient

- **`multer`:** `@nestjs/platform-express@10.4.22` (latest Nest 10 line) pins `multer@2.0.2`. Nest 11.1.x pins up to `multer@2.1.1`. No published `@nestjs/platform-express` release yet depends on `multer@2.2.0`, which is required for [GHSA-72gw-mp4g-v24j](https://github.com/advisories/GHSA-72gw-mp4g-v24j) (deeply nested field names DoS).
- **`lodash`:** `@nestjs/swagger@8.x` and `@nestjs/swagger@11.x` still pin `lodash@4.17.21`. No upstream swagger release yet depends on `lodash@4.18.x`, which is required for [GHSA-r5fr-rjxr-66jc](https://github.com/advisories/GHSA-r5fr-rjxr-66jc) (`_.template` code injection).

Upgrading Nest major versions was rejected for this fix because it would expand scope beyond security remediation and risk breaking changes across all Nest services.

### Why overrides are safe

- **`multer@2.2.0`** is a patch/minor release in the same major line Nest already uses (`2.x`). Nest only uses multer for multipart upload middleware; `2.2.0` preserves the public API used by `@nestjs/platform-express`.
- **`lodash@4.18.1`** is a patch release in the `4.x` line already required by `@nestjs/swagger`. Swagger uses lodash for internal object utilities, not runtime template evaluation from user input in this codebase.

### Review cadence

1. Check Dependabot PRs for `@nestjs/platform-express`, `@nestjs/swagger`, `multer`, and `lodash`.
2. When upstream pins patched versions, remove the corresponding override and run `pnpm audit:ci`.
3. Re-document any remaining overrides here.

## Verification

```bash
pnpm install
pnpm why multer
pnpm why lodash
pnpm audit:ci
pnpm validate
```

Expected: `multer@2.2.0` and `lodash@4.18.1` resolved across Nest services; no high-severity production advisories for these paths.

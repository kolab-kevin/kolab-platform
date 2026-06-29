# TypeScript Standards

TypeScript rules for all KŌLAB Platform code — NestJS APIs, Next.js apps, and shared packages.

---

## Compiler strictness

**Strict mode is required.** All projects extend configs from `@kolab/typescript-config`:

| Config               | Used by         |
| -------------------- | --------------- |
| `base.json`          | Shared packages |
| `nestjs.json`        | NestJS apps     |
| `nextjs.json`        | Next.js apps    |
| `react-library.json` | `@kolab/ui`     |

Required compiler behavior (enforced in shared configs):

- `strict: true`
- `noImplicitAny` (via strict)
- `strictNullChecks`
- `forceConsistentCasingInFileNames`
- `incremental: true` for faster builds

Do not disable strict checks in individual files with `@ts-ignore` unless documented with a reason and linked issue.

---

## The `any` rule

| Rule                              | Detail                                                                                                |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **No implicit `any`**             | Fix type errors; do not suppress                                                                      |
| **Avoid explicit `any`**          | Use proper types, generics, or `unknown`                                                              |
| **Use `unknown` for unsafe data** | Parse/narrow before use (API responses, `JSON.parse`, webhook payloads)                               |
| **Documented exceptions only**    | If `any` is unavoidable (e.g. third-party lib gap), add a comment: `// any: <reason> — issue KOL-XXX` |

```typescript
// ✅ Good — narrow unknown after validation
const parsed = RegisterSchema.safeParse(body);
if (!parsed.success) throw new BadRequestException(parsed.error);

// ❌ Bad — unchecked external data
const user = body as User;
```

---

## Types and schemas

### Prefer type-safe DTOs and Zod

- **API contracts:** Zod schemas in `@kolab/types`; infer types with `z.infer<typeof Schema>`
- **Environment:** Zod schemas in `@kolab/config`; always use `parseEnv(schema)`
- **NestJS bodies:** Validate with `ZodValidationPipe` or equivalent; types come from `@kolab/types`

Single source of truth:

```text
@kolab/types (Zod) → shared by API, SDK, and UI forms
@kolab/config (Zod) → server env only
Prisma schema → database shape (server only)
```

Do not duplicate the same field definitions in multiple packages.

### Interfaces vs types

- **`interface`** — object shapes that may be extended
- **`type`** — unions, intersections, mapped types, tuples

### Exported APIs

Exported functions and public module APIs should have **explicit return types**. Internal helpers may use inference.

### Nullability

- Avoid non-null assertions (`!`)
- Prefer `??`, optional chaining, and early returns
- Use Zod `.optional()` / `.nullable()` to match domain semantics

---

## Environment variables

**No unchecked environment variables.**

```typescript
// ✅ Required pattern in server code
import { apiEnvSchema, parseEnv } from '@kolab/config';
const env = parseEnv(apiEnvSchema);

// ❌ Forbidden in app/package code
const secret = process.env.JWT_SECRET!;
```

Rules:

- All server env vars validated at startup via `@kolab/config`
- Missing or invalid env → fail fast with clear error
- Never read `process.env` directly in apps or shared packages (exception: `@kolab/config` itself)

Browser-safe variables only via `NEXT_PUBLIC_*` — see [frontend standards](./frontend-standards.md).

---

## Architecture boundaries

| Layer                            | TypeScript responsibility             |
| -------------------------------- | ------------------------------------- |
| **Controllers / route handlers** | HTTP mapping only — no business logic |
| **Services**                     | Business logic, orchestration         |
| **Guards**                       | Authorization                         |
| **Pipes**                        | Input validation/transform            |
| **Packages**                     | Pure utilities, no app imports        |

Controllers must not contain conditional business rules, database calls, or token logic — delegate to services.

---

## Imports and modules

1. Import workspace packages by name: `@kolab/auth`, not `../../packages/auth`
2. No circular dependencies — `pnpm check:cycles` in CI
3. Unused imports are ESLint errors
4. Sort order enforced by `eslint-plugin-simple-import-sort`

---

## Error typing

Catch blocks:

```typescript
// ✅ Good
catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
}

// ❌ Bad
catch (error: any) { ... }
```

---

## Related docs

- [Coding standards — review checklist](./coding-standards.md#code-review-checklist)
- [Backend standards](./backend-standards.md)
- [Frontend standards](./frontend-standards.md)

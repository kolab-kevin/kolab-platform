# Backend Standards (NestJS)

Standards for all NestJS services: `api`, `public-api`, `mobile-api`, `ai-services`.

---

## Layer responsibilities

```text
Request → Middleware → Guard → Pipe → Controller → Service → Database/Redis
                         ↑        ↑         ↑          ↑
                      Auth/RBAC  Validate  Thin    Business logic
```

| Layer          | Responsibility                                 | Must not                                         |
| -------------- | ---------------------------------------------- | ------------------------------------------------ |
| **Controller** | Route mapping, HTTP status, Swagger decorators | Business logic, Prisma calls, token/crypto logic |
| **Service**    | Business rules, transactions, orchestration    | HTTP concerns, `@Req()` parsing                  |
| **Guard**      | Authentication and RBAC                        | Database mutations                               |
| **Pipe**       | Input validation and transformation            | Authorization decisions                          |
| **Module**     | Wiring, exports                                | Implementation details                           |

**Controllers stay thin.** A controller method should typically: validate input (via pipe), call one service method, return the result.

---

## Validation and DTOs

Every endpoint that accepts a body, query, or param must validate input.

| Approach                                         | When                                                            |
| ------------------------------------------------ | --------------------------------------------------------------- |
| `ZodValidationPipe` + schema from `@kolab/types` | Preferred — matches SDK and UI                                  |
| class-validator DTOs                             | Acceptable for Swagger-heavy endpoints if kept in sync with Zod |

Rules:

- **DTO required for every request body**
- Invalid input → `400 Bad Request` with clear messages
- Shared schemas live in `@kolab/types`; do not redefine shapes in controllers

---

## OpenAPI / Swagger

Public and partner-facing endpoints **must** include OpenAPI decorators:

- `@ApiTags()` on controllers
- `@ApiOperation()` on each route
- `@ApiResponse()` for success and common errors
- `@ApiBearerAuth()` for protected routes
- `@ApiCookieAuth()` where refresh cookies apply

Swagger UI: `http://localhost:4000/api/docs` (`api` service).

Internal-only endpoints still benefit from decorators — treat as required for all new routes.

---

## Authorization (RBAC)

- **JWT access tokens** for authenticated requests (`Authorization: Bearer`)
- **Refresh tokens** in httpOnly cookies — rotation logic in `AuthService` must not be weakened
- **`@Public()`** explicitly marks unauthenticated routes
- **`@Roles(...)`** + `RolesGuard` for role-restricted routes
- **`JwtAuthGuard`** validates access tokens globally unless `@Public()`

Every new protected endpoint must declare required roles. Default-deny: if roles are omitted, only authentication is required — document intentional choices.

See [security overview](../security/README.md) and auth implementation in `apps/api/src/auth/`.

---

## Database access

**All database access through the service/database layer.**

| Rule                     | Detail                                                 |
| ------------------------ | ------------------------------------------------------ |
| Prisma client            | Import from `@kolab/database`                          |
| No Prisma in controllers | Services only                                          |
| Migrations               | Versioned under `packages/database/prisma/migrations/` |
| Transactions             | Use `prisma.$transaction()` for multi-step mutations   |
| Raw SQL                  | Rare; must be parameterized; reviewed in PR            |

Never use `prisma db push` in staging or production.

---

## Errors and responses

**All errors use a consistent exception format.**

Global `GlobalExceptionFilter` from `@kolab/observability` returns:

```json
{
  "statusCode": 400,
  "message": "...",
  "requestId": "uuid",
  "timestamp": "ISO-8601"
}
```

Rules:

- Use NestJS built-in exceptions (`BadRequestException`, `UnauthorizedException`, `ForbiddenException`, `ConflictException`)
- Do not leak stack traces or internal details in production responses
- Log full context server-side via structured Pino logger
- Include `requestId` from `x-request-id` middleware

---

## Audit logging

**All sensitive actions require audit logging.**

Sensitive actions include (non-exhaustive):

- Login, logout, failed login attempts
- Role or permission changes
- Password or token lifecycle events
- Admin mutations on user accounts
- Payment or payout operations
- Data export or bulk delete

Until the dedicated audit module lands (Phase 2+), new sensitive endpoints must either:

1. Emit structured log entries with `action`, `actorId`, `targetId`, `metadata`, or
2. Include a PR note with a linked ticket to add formal audit records

Never ship sensitive mutations with zero observability.

---

## Observability

| Concern     | Standard                                              |
| ----------- | ----------------------------------------------------- |
| Logging     | `@kolab/observability` Pino — JSON in production      |
| Request IDs | `x-request-id` on every request/response              |
| Health      | `GET /health` (liveness), `GET /ready` (dependencies) |
| Metrics     | `GET /metrics` (process stats)                        |
| Secrets     | Validated via `@kolab/config`; never logged           |

---

## Security headers

`helmet` is applied in `apps/api/src/main.ts`. Do not disable security headers without security review. See [security headers](../security/headers.md).

---

## Redis

- Session and refresh token cache via `RedisService`
- Connection config from `@kolab/config` (`REDIS_URL`)
- No secrets stored in Redis — only token hashes and session metadata

---

## Testing requirements

See [testing standards](./testing-standards.md):

- Every service → unit tests
- Every guard → unit tests
- Auth/security changes → dedicated tests
- Mock Prisma and Redis in unit tests

---

## Related docs

- [TypeScript standards](./typescript-standards.md)
- [API documentation](../api/README.md)
- [Database](../database/README.md)

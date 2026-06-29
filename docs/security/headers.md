# Security Headers

HTTP security headers applied to NestJS API services via [Helmet](https://helmetjs.github.io/) v8.

## Configuration

`@kolab/api` applies default Helmet middleware in `apps/api/src/main.ts`:

```typescript
import helmet from 'helmet';

app.use(helmet());
```

No custom options are set — Helmet's secure defaults apply. Other NestJS services should adopt the same pattern before production deployment.

## Headers set by default

Helmet v8 enables the following middleware. Headers marked "HTTPS only" are omitted on plain HTTP (local development).

| Header                              | Value (default)                       | Purpose                                  |
| ----------------------------------- | ------------------------------------- | ---------------------------------------- |
| `Content-Security-Policy`           | Restrictive default CSP               | Mitigates XSS and data injection         |
| `Cross-Origin-Embedder-Policy`      | `require-corp`                        | Controls cross-origin resource embedding |
| `Cross-Origin-Opener-Policy`        | `same-origin`                         | Isolates browsing context                |
| `Cross-Origin-Resource-Policy`      | `same-origin`                         | Restricts cross-origin resource loading  |
| `Origin-Agent-Cluster`              | `?1`                                  | Enables origin-keyed agent clusters      |
| `Referrer-Policy`                   | `no-referrer`                         | Limits referrer information leakage      |
| `Strict-Transport-Security`         | `max-age=31536000; includeSubDomains` | Forces HTTPS (HTTPS only)                |
| `X-Content-Type-Options`            | `nosniff`                             | Prevents MIME-type sniffing              |
| `X-DNS-Prefetch-Control`            | `off`                                 | Disables DNS prefetching                 |
| `X-Download-Options`                | `noopen`                              | Prevents IE from executing downloads     |
| `X-Frame-Options`                   | `SAMEORIGIN`                          | Clickjacking protection                  |
| `X-Permitted-Cross-Domain-Policies` | `none`                                | Restricts Adobe cross-domain policies    |
| `X-Powered-By`                      | Removed                               | Hides Express/NestJS fingerprint         |

## Interaction with other middleware

Helmet runs before other middleware in the bootstrap sequence:

1. Helmet (security headers)
2. Cookie parser
3. CORS (configured per environment via `CORS_ORIGINS`)
4. Global prefix (`/api`)

CORS and Helmet serve different purposes — CORS controls cross-origin **requests**; Helmet sets **response** security headers.

## Swagger / API docs

Swagger UI is mounted at `/api/docs`. If CSP blocks inline scripts in Swagger, configure Helmet's `contentSecurityPolicy` directive for that route:

```typescript
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  }),
);
```

Only apply relaxed CSP where necessary — prefer route-specific overrides over global weakening.

## Next.js frontends

Next.js apps (`web`, `admin`, `creator-portal`, `moderator`) set headers via `next.config.ts` or middleware. Helmet applies to NestJS backends only.

Recommended Next.js headers for production:

- `X-Frame-Options: DENY` or `SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security` (production HTTPS only)

## Verification

Check headers on a running API:

```bash
curl -I http://localhost:4000/health
```

Expected headers include `X-Content-Type-Options`, `X-Frame-Options`, and `Content-Security-Policy`.

## Related docs

- [Security overview](./README.md)
- [Architecture](../architecture/README.md)

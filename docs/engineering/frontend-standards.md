# Frontend Standards (Next.js)

Standards for all Next.js apps: `web`, `admin`, `creator-portal`, `moderator`.

---

## UI components

**Use shared UI from `@kolab/ui` first.**

Before creating a new component in an app:

1. Check `@kolab/ui` for existing primitives (`Button`, `Input`, `Card`, `LoginForm`, etc.)
2. If reusable across apps → add to `@kolab/ui`
3. If app-specific layout only → keep in `apps/<name>/components/`

Do not copy-paste shadcn primitives into individual apps.

---

## Forms and auth UI

**No duplicated form logic.**

| Concern           | Shared location                             |
| ----------------- | ------------------------------------------- |
| Login/register UI | `@kolab/ui` — `LoginForm`, `RegisterForm`   |
| Validation        | `@kolab/types` Zod schemas                  |
| API calls         | `@kolab/sdk` — `AuthClient`                 |
| Auth state        | `@kolab/ui` — `AuthProvider`, `useAuth`     |
| Role gating       | `@kolab/auth` — `APP_ALLOWED_ROLES` per app |

Each app’s `components/app-providers.tsx` wires `AuthProvider` with the correct `allowedRoles` — do not reimplement auth state locally.

---

## Server vs client components

Next.js App Router requires explicit boundaries.

| Use Server Components (default)    | Use Client Components (`'use client'`) |
| ---------------------------------- | -------------------------------------- |
| Static layout shells               | Interactive forms, buttons, hooks      |
| Data that never needs browser APIs | `useAuth`, `useRouter`, `useState`     |
| SEO/metadata pages                 | Event handlers, `sessionStorage`       |

Rules:

- Add `'use client'` only when required — keep client bundles small
- Do not import server-only modules (`@kolab/database`, raw env) into client components
- Document non-obvious client boundaries with a brief file-level comment when helpful

---

## Protected routes

**Protected routes must use the auth provider.**

Standard pattern (already in place):

```text
app/(auth)/login/page.tsx      → public
app/(auth)/register/page.tsx   → public
app/(dashboard)/layout.tsx     → redirects to /login if !user
app/(dashboard)/dashboard/     → protected content inside DashboardShell
```

Rules:

- Dashboard layouts call `useAuth()` and redirect unauthenticated users
- Do not implement parallel auth checks with ad-hoc `localStorage` reads
- Each app enforces its own `APP_ALLOWED_ROLES` — users with wrong roles are rejected at login

---

## API communication

**No direct `fetch` to the API outside `@kolab/sdk` unless justified.**

| ✅ Default                            | ❌ Avoid                                               |
| ------------------------------------- | ------------------------------------------------------ |
| `AuthClient` from `@kolab/sdk`        | Raw `fetch('http://localhost:4000/...')` in components |
| Future domain clients in `@kolab/sdk` | Axios instances per app                                |

Exceptions (require PR justification):

- Next.js Route Handlers acting as BFF proxies
- Server Components calling internal services over Docker network
- One-off health/debug tooling

When adding SDK methods:

- Types from `@kolab/types`
- `credentials: 'include'` for cookie-based refresh
- Access token via `Authorization` header from client storage

---

## Environment variables

| Prefix          | Visibility   | Example                           |
| --------------- | ------------ | --------------------------------- |
| `NEXT_PUBLIC_*` | Browser-safe | `NEXT_PUBLIC_API_URL`             |
| No prefix       | Server-only  | Never import in client components |

**Never expose server env vars to the browser.**

```typescript
// ✅ Client component
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// ❌ Client component — leaks to browser bundle
const secret = process.env.JWT_SECRET;
```

---

## Accessibility

**Accessibility is required for forms, buttons, and navigation.**

Minimum requirements:

- `<Label htmlFor="...">` associated with every form input
- Buttons have discernible text or `aria-label`
- Error messages use `role="alert"` (see `@kolab/ui` auth forms)
- Focus states visible (Tailwind `focus-visible:ring-*`)
- Color contrast meets WCAG AA for text and interactive elements
- Keyboard navigation works for login flows and dashboard nav

Before merging UI changes, manually tab through the flow without a mouse.

---

## Error boundaries

Wrap app providers with `@kolab/ui` `ErrorBoundary`:

```tsx
<ErrorBoundary>
  <AuthProvider>...</AuthProvider>
</ErrorBoundary>
```

Wire Sentry capture via `onError` when `SENTRY_DSN` is enabled (Phase 4).

---

## Styling

- **Tailwind CSS** with shared tokens from `@kolab/tailwind-config`
- Use `cn()` from `@kolab/ui` for conditional classes
- No inline styles except dynamic values
- Prefer design tokens (`bg-primary`, `text-muted-foreground`) over hard-coded hex

---

## Testing

- Component tests when logic exceeds trivial rendering (future Phase 2)
- E2E required for login and role-gated flows — see [testing standards](./testing-standards.md)
- Auth/security UI changes require tests

---

## Related docs

- [TypeScript standards](./typescript-standards.md)
- [Testing standards](./testing-standards.md)
- [API documentation](../api/README.md)

# Manager Portal Architecture

**Status:** MP-01 Shell implemented  
**Application:** `apps/manager-portal` (Next.js 15 App Router)  
**Port:** 3004 (local dev)  
**Related:** [Product brief](../product/manager-portal.md) · [Frontend standards](../engineering/frontend-standards.md)

---

## Overview

Manager Portal is the agency-facing experience layer for portfolio oversight, campaign operations, recruiting, and team accountability. MP-01 ships the authenticated shell and mock dashboard only — no new backend domain or API integration yet.

```mermaid
flowchart LR
  subgraph managerPortal [apps/manager-portal]
    SHELL[Portal shell MP-01]
    DASH[Mock dashboard]
    PLACE[Placeholder workspaces]
  end
  subgraph future [Future MP-02 to MP-09]
    API[@kolab/api composition]
  end
  SHELL --> DASH
  SHELL --> PLACE
  PLACE -.-> API
  DASH -.-> API
```

**Engineering boundary:** Presentation-only UI. Do not add Manager Portal-specific backend tables or scoring logic in frontend components.

---

## Frontend architecture

| Layer               | Responsibility                                          |
| ------------------- | ------------------------------------------------------- |
| **App Router**      | Routes under `/portal/*`, auth layout, error boundaries |
| **`@kolab/ui`**     | AuthProvider, ErrorBoundary, Card, Button, auth forms   |
| **`@kolab/auth`**   | `APP_ALLOWED_ROLES.admin` gate for manager access       |
| **`@kolab/sdk`**    | Auth client only in MP-01                               |
| **Local Zod types** | `types/manager-dashboard.ts` for mock dashboard DTO     |
| **Services**        | Mock dashboard fetch; live mode throws until API ships  |

---

## Auth and organization flow

1. User visits `/portal/*` → auth layout checks `useAuth()`
2. Unauthenticated users redirect to `/login`
3. Role failures redirect to `/unauthorized`
4. `OrganizationBridge` provides placeholder organizations and manager profile summary
5. Organization selector in top nav is UI-only in MP-01

---

## Route structure

```text
apps/manager-portal/
  app/
    (auth)/login|register
    (portal)/
      layout.tsx              # Auth guard + PortalShell
      dashboard/page.tsx      # Mock dashboard (MP-01)
      creators/               # Placeholder (MP-02)
      live/                   # Placeholder (MP-03)
      campaigns/              # Placeholder (MP-04)
      recruiting/             # Placeholder (MP-05)
      tasks/                  # Placeholder (MP-06)
      reports/                # Placeholder (MP-07)
      admin/                  # Placeholder (MP-08)
      settings/               # Placeholder (MP-09)
  components/
    layouts/                  # Shell, sidebar, top nav, breadcrumbs
    dashboard/                # Dashboard cards and view
    common/                   # Loading, errors, workspace page
  contexts/organization-context.tsx
  hooks/use-portal-navigation.ts
  hooks/use-manager-dashboard.ts
  services/dashboard-mock.ts
  services/dashboard-service.ts
  types/navigation.ts
  types/manager-dashboard.ts
```

---

## MP-01 dashboard mock

Mock dashboard sections (display-only):

- Agency overview
- Creator health
- Live operations
- Campaign health
- Recruiting pipeline
- Tasks and alerts
- Revenue placeholder
- Compliance blockers

Validated by `ManagerDashboardResponseSchema` in tests.

---

## MP-01 exit criteria

- Manager logs in and lands on authenticated shell ✅
- All primary nav routes exist (dashboard + placeholders) ✅
- Mock dashboard renders typed cards without client-side business logic ✅
- Global loading, error, 404, and unauthorized pages present ✅

---

## Related documentation

- [Product brief](../product/manager-portal.md)
- [System Map — Manager Portal](./system-map.md)
- [Master Roadmap — Manager Portal](../roadmap/master-roadmap.md#manager-portal)

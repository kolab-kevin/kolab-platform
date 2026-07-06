# Manager Portal Architecture

**Status:** MP-02 Creator Management implemented  
**Application:** `apps/manager-portal` (Next.js 15 App Router)  
**Port:** 3004 (local dev)  
**Related:** [Product brief](../product/manager-portal.md) · [Frontend standards](../engineering/frontend-standards.md)

---

## Overview

Manager Portal is the agency-facing experience layer for portfolio oversight, campaign operations, recruiting, and team accountability. MP-01 ships the authenticated shell and mock dashboard. MP-02 adds the Creator Management workspace with mock/live data modes identical to Creator Studio.

```mermaid
flowchart LR
  subgraph managerPortal [apps/manager-portal]
    SHELL[Portal shell MP-01]
    DASH[Mock dashboard]
    CREATORS[Creator workspace MP-02]
    PLACE[Placeholder workspaces MP-03+]
  end
  subgraph api [@kolab/api]
    CRM[Creator CRM endpoints]
  end
  SHELL --> DASH
  SHELL --> CREATORS
  SHELL --> PLACE
  CREATORS --> CRM
  DASH -.-> CRM
```

**Engineering boundary:** Presentation-only UI. Do not add Manager Portal-specific backend tables or scoring logic in frontend components.

---

## Frontend architecture

| Layer               | Responsibility                                              |
| ------------------- | ----------------------------------------------------------- |
| **App Router**      | Routes under `/portal/*`, auth layout, error boundaries     |
| **`@kolab/ui`**     | AuthProvider, ErrorBoundary, Card, Button, auth forms       |
| **`@kolab/auth`**   | `APP_ALLOWED_ROLES.admin` gate for manager access           |
| **`@kolab/sdk`**    | Auth client                                                 |
| **`@kolab/types`**  | Creator list/detail response schemas (live mode)            |
| **Local Zod types** | `types/creator-management.ts`, `types/manager-dashboard.ts` |
| **Services**        | Mock/live fetch, API composition for creator detail         |
| **Hooks**           | Workspace state, search/sort/filter/pagination              |

---

## Auth and organization flow

1. User visits `/portal/*` → auth layout checks `useAuth()`
2. Unauthenticated users redirect to `/login`
3. Role failures redirect to `/unauthorized`
4. `OrganizationBridge` provides placeholder organizations and manager profile summary
5. Organization selector in top nav is UI-only in MP-01/MP-02

---

## Route structure

```text
apps/manager-portal/
  app/
    (auth)/login|register
    (portal)/
      layout.tsx                    # Auth guard + PortalShell
      portal/
        dashboard/page.tsx          # Mock dashboard (MP-01)
        creators/page.tsx           # Creator Management (MP-02)
        live/                       # Placeholder (MP-03)
        campaigns/                  # Placeholder (MP-04)
        recruiting/                 # Placeholder (MP-05)
        tasks/                      # Placeholder (MP-06)
        reports/                    # Placeholder (MP-07)
        admin/                      # Placeholder (MP-08)
        settings/                   # Placeholder (MP-09)
  components/
    layouts/                        # Shell, sidebar, top nav, breadcrumbs
    dashboard/                      # Dashboard cards and view
    creators/                       # List, detail, filters, quick actions
    common/                         # Loading, errors, workspace page
  contexts/organization-context.tsx
  hooks/use-portal-navigation.ts
  hooks/use-manager-dashboard.ts
  hooks/use-creator-management-workspace.ts
  services/
    api-client.ts
    dashboard-mock.ts
    dashboard-service.ts
    creator-management-mock.ts
    creator-management-service.ts
    creator-management-loader.ts
  types/
    navigation.ts
    manager-dashboard.ts
    creator-management.ts
    creator-adapters.ts
```

---

## MP-02 Creator Management

### Data modes

| Mode | Trigger                                      | Behavior                                       |
| ---- | -------------------------------------------- | ---------------------------------------------- |
| Mock | `NEXT_PUBLIC_USE_MOCK_DASHBOARD !== 'false'` | Typed fixtures in `creator-management-mock.ts` |
| Live | Mock disabled                                | Composes existing Creator CRM endpoints        |

### Live API mapping

| UI section                      | Endpoint(s)                               |
| ------------------------------- | ----------------------------------------- |
| Creator list                    | `GET /api/creators`                       |
| Profile & contact               | `GET /api/creators/:id`                   |
| Platform accounts               | Included in creator detail                |
| Skills                          | `GET /api/creators/:id/skills`            |
| Availability                    | `GET /api/creators/:id/availability`      |
| Compliance                      | `GET /api/creators/:id/compliance`        |
| Onboarding progress             | Derived from detail + compliance payloads |
| Goals summary                   | `GET /api/creators/:id/goals`             |
| Performance summary             | `GET /api/creators/:id/performance-score` |
| Intelligence summary            | `GET /api/creators/:id/intelligence`      |
| Recent campaigns & live summary | `GET /api/creators/:id/dashboard`         |

List rows in live mode show fields returned by the list endpoint; full scores and compliance load on detail selection via parallel fetches in `creator-management-loader.ts`.

### Client-side presentation

- Search, sort, pagination, and filter UI apply on the loaded list (mock fully; live partially via query params where supported).
- Quick actions are disabled UI placeholders.
- No score recalculation or business logic in components.

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

## Exit criteria

### MP-01

- Manager logs in and lands on authenticated shell ✅
- All primary nav routes exist ✅
- Mock dashboard renders typed cards without client-side business logic ✅
- Global loading, error, 404, and unauthorized pages present ✅

### MP-02

- `/portal/creators` renders searchable, sortable creator list ✅
- Detail panel loads profile through live summary on selection ✅
- Mock/live modes share typed DTOs ✅
- Filters and quick actions present as UI-only controls ✅
- Service and adapter tests validate schemas and mapping ✅

---

## Related documentation

- [Product brief](../product/manager-portal.md)
- [Creators API](../api/creators.md)
- [System Map — Manager Portal](./system-map.md)
- [Master Roadmap — Manager Portal](../roadmap/master-roadmap.md#manager-portal)

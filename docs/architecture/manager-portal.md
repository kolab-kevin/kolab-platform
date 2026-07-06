# Manager Portal Architecture

**Status:** MP-04 Campaign Operations implemented  
**Application:** `apps/manager-portal` (Next.js 15 App Router)  
**Port:** 3004 (local dev)  
**Related:** [Product brief](../product/manager-portal.md) · [Frontend standards](../engineering/frontend-standards.md)

---

## Overview

Manager Portal is the agency-facing experience layer for portfolio oversight, campaign operations, recruiting, and team accountability. MP-01 ships the authenticated shell and mock dashboard. MP-02 adds Creator Management. MP-03 adds Live Operations. MP-04 adds Campaign Operations with mock/live data modes identical to Creator Studio.

```mermaid
flowchart LR
  subgraph managerPortal [apps/manager-portal]
    SHELL[Portal shell MP-01]
    DASH[Mock dashboard]
    CREATORS[Creator workspace MP-02]
    LIVE[Live operations MP-03]
    CAMPAIGNS[Campaign ops MP-04]
    PLACE[Placeholder workspaces MP-05+]
  end
  subgraph api [@kolab/api]
    CRM[Creator CRM endpoints]
    LIVEAPI[Live Intelligence endpoints]
    CAMP[Campaign endpoints]
  end
  SHELL --> DASH
  SHELL --> CREATORS
  SHELL --> LIVE
  SHELL --> CAMPAIGNS
  SHELL --> PLACE
  CREATORS --> CRM
  LIVE --> LIVEAPI
  LIVE --> CRM
  CAMPAIGNS --> CAMP
  CAMPAIGNS --> CRM
  DASH -.-> CRM
```

**Engineering boundary:** Presentation-only UI. Do not add Manager Portal-specific backend tables or scoring logic in frontend components.

---

## Frontend architecture

| Layer               | Responsibility                                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **App Router**      | Routes under `/portal/*`, auth layout, error boundaries                                                                 |
| **`@kolab/ui`**     | AuthProvider, ErrorBoundary, Card, Button, auth forms                                                                   |
| **`@kolab/auth`**   | `APP_ALLOWED_ROLES.admin` gate for manager access                                                                       |
| **`@kolab/sdk`**    | Auth client                                                                                                             |
| **`@kolab/types`**  | Shared API response schemas (live mode)                                                                                 |
| **Local Zod types** | `types/creator-management.ts`, `types/live-operations.ts`, `types/campaign-operations.ts`, `types/manager-dashboard.ts` |
| **Services**        | Mock/live fetch, API composition for creator, live, and campaign workspaces                                             |
| **Hooks**           | Workspace state for creators, live operations, and campaign operations                                                  |

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
        live/page.tsx               # Live Operations (MP-03)
        campaigns/page.tsx          # Campaign Operations (MP-04)
        recruiting/                 # Placeholder (MP-05)
        tasks/                      # Placeholder (MP-06)
        reports/                    # Placeholder (MP-07)
        admin/                      # Placeholder (MP-08)
        settings/                   # Placeholder (MP-09)
  components/
    layouts/                        # Shell, sidebar, top nav, breadcrumbs
    dashboard/                      # Dashboard cards and view
    creators/                       # List, detail, filters, quick actions
    live/                           # Sessions, monitoring, coach queue, timeline
    campaigns/                      # Overview, board, detail, deliverables, applications
    common/                         # Loading, errors, workspace page, layout
  contexts/organization-context.tsx
  hooks/use-portal-navigation.ts
  hooks/use-manager-dashboard.ts
  hooks/use-creator-management-workspace.ts
  hooks/use-live-operations-workspace.ts
  hooks/use-campaign-operations.ts
  services/
    api-client.ts
    dashboard-mock.ts
    dashboard-service.ts
    creator-management-mock.ts
    creator-management-service.ts
    creator-management-loader.ts
    live-operations-mock.ts
    live-operations-service.ts
    live-operations-loader.ts
    agency-live-service.ts
    live-session-service.ts
    timeline-service.ts
    campaign-operations-mock.ts
    campaign-operations-service.ts
    campaign-operations-loader.ts
    campaign-board-service.ts
    campaign-detail-service.ts
    campaign-deliverables-service.ts
    campaign-applications-service.ts
  types/
    navigation.ts
    manager-dashboard.ts
    creator-management.ts
    creator-adapters.ts
    live-operations.ts
    live-operations-adapters.ts
    campaign-operations.ts
    campaign-operations-adapters.ts
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

## MP-03 Live Operations

### MP-03 data modes

| Mode | Trigger                                      | Behavior                                    |
| ---- | -------------------------------------------- | ------------------------------------------- |
| Mock | `NEXT_PUBLIC_USE_MOCK_DASHBOARD !== 'false'` | Typed fixtures in `live-operations-mock.ts` |
| Live | Mock disabled                                | Composes Live Intelligence endpoints        |

### MP-03 live API mapping

| UI section        | Endpoint(s)                                                   |
| ----------------- | ------------------------------------------------------------- |
| Live sessions     | `GET /api/live/sessions`                                      |
| Session health    | `GET /api/live/sessions/:id/intelligence`                     |
| Agency monitoring | Derived from live sessions + coach payloads                   |
| Coach queue       | `GET /api/live/sessions/:id/coach/alerts`, `/recommendations` |
| Session timeline  | `GET /api/live/sessions/:id/timeline`                         |
| Creator names     | `GET /api/creators` (join by creator profile id)              |

Session selection loads timeline and coach detail in parallel via `live-operations-loader.ts`.

### MP-03 client-side presentation

- Quick actions are disabled UI placeholders.
- Adapter layer maps API DTOs to manager view models; no new scoring logic in components.

---

## MP-04 Campaign Operations

### MP-04 data modes

| Mode | Trigger                                      | Behavior                                        |
| ---- | -------------------------------------------- | ----------------------------------------------- |
| Mock | `NEXT_PUBLIC_USE_MOCK_DASHBOARD !== 'false'` | Typed fixtures in `campaign-operations-mock.ts` |
| Live | Mock disabled                                | Composes Campaign endpoints                     |

### MP-04 live API mapping

| UI section        | Endpoint(s)                                                    |
| ----------------- | -------------------------------------------------------------- |
| Campaign list     | `GET /api/campaigns`                                           |
| Campaign detail   | `GET /api/campaigns/:id`                                       |
| Deliverables      | `GET /api/campaigns/:id/deliverables`, assignment deliverables |
| Applications      | `GET /api/campaigns/:id/applications`                          |
| Assigned creators | `GET /api/campaigns/:id/assignments`                           |
| Creator names     | `GET /api/creators` (join by creator profile id)               |

Campaign selection loads detail, deliverables, and applications in parallel via `campaign-operations-loader.ts`. Status history is synthesized from campaign timestamps (no dedicated history API).

### MP-04 client-side presentation

- Campaign board columns are mapped from campaign status and pending application counts.
- Quick actions are disabled UI placeholders.
- No new business logic or scoring in components.

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

### MP-03

- `/portal/live` renders live sessions, agency monitoring, coach queue, and timeline ✅
- Mock/live modes share typed DTOs ✅
- Quick actions present as UI-only controls ✅
- Service and adapter tests validate schemas and mapping ✅

### MP-04

- `/portal/campaigns` renders overview, board, detail, deliverables, and applications ✅
- Mock/live modes share typed DTOs ✅
- Quick actions present as UI-only controls ✅
- Service and adapter tests validate schemas and mapping ✅

---

## Related documentation

- [Product brief](../product/manager-portal.md)
- [Creators API](../api/creators.md)
- [Live Intelligence API](../api/live-intelligence.md)
- [Campaigns API](../api/campaigns.md)
- [System Map — Manager Portal](./system-map.md)
- [Master Roadmap — Manager Portal](../roadmap/master-roadmap.md#manager-portal)

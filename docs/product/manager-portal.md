# Manager Portal

**Status:** MP-04 Campaign Operations — **Implemented**  
**Target:** Release 0.8 (`release/0.8.x`)  
**Application:** `apps/manager-portal`  
**Depends on:** v0.7 Creator Studio patterns; existing Creator CRM, Live Intelligence, and Campaign APIs

---

## Goal

Deliver **Manager Portal** — the agency command center where managers oversee creators, live operations, campaigns, recruiting, tasks, reporting, and administration in one place.

MP-01 establishes the authenticated application shell and mock dashboard. MP-02 ships Creator Management. MP-03 ships Live Operations. MP-04 ships Campaign Operations. Remaining domain workspaces ship in MP-05 through MP-09.

---

## MP-01 capabilities

| Capability                                           | Status |
| ---------------------------------------------------- | ------ |
| Next.js app shell (`apps/manager-portal`)            | ✅     |
| Auth provider with existing `@kolab/sdk` conventions | ✅     |
| Organization context (placeholder selector)          | ✅     |
| Dark-first layout with sidebar and top navigation    | ✅     |
| Breadcrumbs, user menu, notification placeholder     | ✅     |
| Global loading and error boundaries                  | ✅     |
| 404 and unauthorized pages                           | ✅     |
| Mock dashboard with typed placeholder cards          | ✅     |
| Placeholder routes for remaining primary nav items   | ✅     |

---

## MP-02 capabilities

| Capability                                                      | Status     |
| --------------------------------------------------------------- | ---------- |
| Creator list (search, sort, pagination placeholder)             | ✅         |
| Status, onboarding, compliance, score, and activity cols        | ✅         |
| Manager assignment and platform badges                          | ✅         |
| Creator detail panel (profile through live summary)             | ✅         |
| Quick actions (UI-only)                                         | ✅         |
| Filters (status, country, language, platform, band, compliance) | ✅ UI-only |
| Mock/live data modes (Creator Studio pattern)                   | ✅         |
| Typed creator workspace DTO with Zod validation                 | ✅         |

---

## MP-03 capabilities

| Capability                                             | Status |
| ------------------------------------------------------ | ------ |
| Live sessions list (status, viewers, revenue, health)  | ✅     |
| Agency monitoring (live roster, alerts, spike counts)  | ✅     |
| Coach queue (high-priority alerts and recommendations) | ✅     |
| Session timeline (key events, PK, gifts, milestones)   | ✅     |
| Quick actions (UI-only)                                | ✅     |
| Mock/live data modes                                   | ✅     |
| Typed live operations workspace DTO                    | ✅     |

---

## MP-04 capabilities

| Capability                                              | Status |
| ------------------------------------------------------- | ------ |
| Campaign overview (active, upcoming, completed, health) | ✅     |
| Campaign board (draft through completed columns)        | ✅     |
| Campaign detail (profile, timeline, assignments)        | ✅     |
| Deliverables (pending through overdue buckets)          | ✅     |
| Applications (waiting, accepted, rejected)              | ✅     |
| Quick actions (UI-only)                                 | ✅     |
| Mock/live data modes                                    | ✅     |
| Typed campaign operations workspace DTO                 | ✅     |

---

## Navigation

| Route                | Purpose                      | Status                                |
| -------------------- | ---------------------------- | ------------------------------------- |
| `/portal/dashboard`  | Agency command overview      | Mock dashboard                        |
| `/portal/creators`   | Portfolio creator management | Creator workspace (MP-02)             |
| `/portal/live`       | Live operations dashboard    | Live operations workspace (MP-03)     |
| `/portal/campaigns`  | Campaign operations          | Campaign operations workspace (MP-04) |
| `/portal/recruiting` | Recruiting CRM               | Placeholder (MP-05)                   |
| `/portal/tasks`      | Notifications and tasks      | Placeholder (MP-06)                   |
| `/portal/reports`    | Reporting                    | Placeholder (MP-07)                   |
| `/portal/admin`      | Administration               | Placeholder (MP-08)                   |
| `/portal/settings`   | Settings                     | Placeholder (MP-09 polish)            |

---

## Data modes

| Variable                         | Purpose                                                         |
| -------------------------------- | --------------------------------------------------------------- |
| `NEXT_PUBLIC_USE_MOCK_DASHBOARD` | `true` (default) serves typed mock dashboard and workspace data |
| `NEXT_PUBLIC_API_URL`            | API host for auth and live API endpoints                        |
| `NEXT_PUBLIC_ORGANIZATION_ID`    | Default mock organization id                                    |

Live workspaces compose existing Creator CRM, Live Intelligence, and Campaign endpoints. Live dashboard API integration remains deferred.

---

## Implementation phases (v0.8)

| Phase | Scope                     | Status |
| ----- | ------------------------- | ------ |
| MP-01 | Manager shell             | ✅     |
| MP-02 | Creator management        | ✅     |
| MP-03 | Live operations dashboard | ✅     |
| MP-04 | Campaign operations       | ✅     |
| MP-05 | Recruiting CRM            | 📋     |
| MP-06 | Notifications & tasks     | 📋     |
| MP-07 | Reporting                 | 📋     |
| MP-08 | Administration            | 📋     |
| MP-09 | Integration & polish      | 📋     |

---

## Related documentation

- [Manager Portal architecture](../architecture/manager-portal.md)
- [Release v0.8](../roadmap/releases.md#v08--manager-portal)
- [Master Roadmap — Manager Portal](../roadmap/master-roadmap.md#manager-portal)

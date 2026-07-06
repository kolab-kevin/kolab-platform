# Manager Portal

**Status:** MP-01 Shell — **Implemented**  
**Target:** Release 0.8 (`release/0.8.x`)  
**Application:** `apps/manager-portal`  
**Depends on:** v0.7 Creator Studio patterns; existing CRM, campaign, and intelligence APIs (future milestones)

---

## Goal

Deliver **Manager Portal** — the agency command center where managers oversee creators, live operations, campaigns, recruiting, tasks, reporting, and administration in one place.

MP-01 establishes the authenticated application shell and mock dashboard. Domain workspaces ship in MP-02 through MP-09.

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
| Placeholder routes for all primary nav items         | ✅     |

---

## Navigation

| Route                | Purpose                      | MP-01 status               |
| -------------------- | ---------------------------- | -------------------------- |
| `/portal/dashboard`  | Agency command overview      | Mock dashboard             |
| `/portal/creators`   | Portfolio creator management | Placeholder (MP-02)        |
| `/portal/live`       | Live operations dashboard    | Placeholder (MP-03)        |
| `/portal/campaigns`  | Campaign operations          | Placeholder (MP-04)        |
| `/portal/recruiting` | Recruiting CRM               | Placeholder (MP-05)        |
| `/portal/tasks`      | Notifications and tasks      | Placeholder (MP-06)        |
| `/portal/reports`    | Reporting                    | Placeholder (MP-07)        |
| `/portal/admin`      | Administration               | Placeholder (MP-08)        |
| `/portal/settings`   | Settings                     | Placeholder (MP-09 polish) |

---

## Mock mode

| Variable                         | Purpose                                           |
| -------------------------------- | ------------------------------------------------- |
| `NEXT_PUBLIC_USE_MOCK_DASHBOARD` | `true` (default) serves typed mock dashboard data |
| `NEXT_PUBLIC_API_URL`            | API host for auth (`http://localhost:4000`)       |
| `NEXT_PUBLIC_ORGANIZATION_ID`    | Default mock organization id                      |

Live dashboard API integration is deferred to a future milestone.

---

## Implementation phases (v0.8)

| Phase | Scope                     | Status |
| ----- | ------------------------- | ------ |
| MP-01 | Manager shell             | ✅     |
| MP-02 | Creator management        | 📋     |
| MP-03 | Live operations dashboard | 📋     |
| MP-04 | Campaign operations       | 📋     |
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

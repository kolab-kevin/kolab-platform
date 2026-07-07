# Manager Portal

**Status:** MP-09 Integration & Polish — **Implemented**  
**Target:** Release 0.8 (`release/0.8.x`)  
**Application:** `apps/manager-portal`  
**Depends on:** v0.7 Creator Studio patterns; existing Creator CRM, Live Intelligence, and Campaign APIs

---

## Goal

Deliver **Manager Portal** — the agency command center where managers oversee creators, live operations, campaigns, recruiting, tasks, reporting, and administration in one place.

MP-01 establishes the authenticated application shell and mock dashboard. MP-02 ships Creator Management. MP-03 ships Live Operations. MP-04 ships Campaign Operations. MP-05 ships Recruiting CRM. MP-06 ships the Operations Center. MP-07 ships Reporting & Analytics. MP-08 ships Administration. MP-09 completes integration polish across shared shell, navigation, preferences, performance, and accessibility.

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

## MP-05 capabilities

| Capability                                                  | Status |
| ----------------------------------------------------------- | ------ |
| Recruiting overview (prospects, funnel, follow-ups, signed) | ✅     |
| Prospect pipeline (new through declined columns)            | ✅     |
| Prospect detail (contact, platforms, notes, history)        | ✅     |
| Follow-up queue (overdue, today, upcoming)                  | ✅     |
| Recruiter performance (contact, response, conversion)       | ✅     |
| Quick actions (UI-only)                                     | ✅     |
| Mock/live data modes                                        | ✅     |
| Typed recruiting workspace DTO                              | ✅     |

---

## MP-06 capabilities

| Capability                                                    | Status |
| ------------------------------------------------------------- | ------ |
| Operations overview (tasks, alerts, deadlines, issues)        | ✅     |
| My tasks (assigned through completed columns)                 | ✅     |
| Alerts center (live, coach, compliance, campaign, recruiting) | ✅     |
| Upcoming deadlines (deliverables through documents)           | ✅     |
| Activity feed (chronological manager activity)                | ✅     |
| AI recommendations (read-only priority queue)                 | ✅     |
| Quick actions (UI-only)                                       | ✅     |
| Mock/live data modes                                          | ✅     |
| Typed operations center workspace DTO                         | ✅     |

---

## MP-07 capabilities

| Capability                                                | Status |
| --------------------------------------------------------- | ------ |
| Executive overview (creators, revenue, health score)      | ✅     |
| Creator analytics (growth, distribution, retention)       | ✅     |
| Campaign analytics (completion, deliverables, ROI)        | ✅     |
| Recruiting analytics (sources, funnel, recruiters)        | ✅     |
| Live analytics (sessions, hours, engagement)              | ✅     |
| Intelligence dashboard (recommendations, risks, coaching) | ✅     |
| Export center (UI-only)                                   | ✅     |
| Mock/live data modes                                      | ✅     |
| Typed reporting workspace DTO                             | ✅     |

---

## MP-08 capabilities

| Capability                                                   | Status |
| ------------------------------------------------------------ | ------ |
| Organization profile (name, contact, timezone, statistics)   | ✅     |
| User management (users, roles, status, invitations)          | ✅     |
| Roles & permissions (summaries, read-only permission matrix) | ✅     |
| Organization settings (general, branding, feature flags)     | ✅     |
| Audit center (audit log, admin actions, security events)     | ✅     |
| System health (API, storage, version, environment)           | ✅     |
| Integrations (services, masked API keys, webhooks)           | ✅     |
| Quick actions (UI-only)                                      | ✅     |
| Mock/live data modes                                         | ✅     |
| Typed administration workspace DTO                           | ✅     |

---

## MP-09 capabilities

| Capability                                             | Status |
| ------------------------------------------------------ | ------ |
| Shared workspace shell (`WorkspaceDataPage`, toolbars) | ✅     |
| Shared metric cards and metrics grid                   | ✅     |
| Shared quick actions bar                               | ✅     |
| Portal preferences (theme, sidebar, workspace views)   | ✅     |
| Persisted organization selection                       | ✅     |
| Workspace data cache (deduplicated fetches)            | ✅     |
| Lazy-loaded reporting and admin panels                 | ✅     |
| Navigation keyboard support and skip link              | ✅     |
| Accessibility pass (ARIA, focus-visible, headings)     | ✅     |
| Settings workspace at `/portal/settings`               | ✅     |

---

## Navigation

| Route                | Purpose                      | Status                                |
| -------------------- | ---------------------------- | ------------------------------------- |
| `/portal/dashboard`  | Agency command overview      | Mock dashboard                        |
| `/portal/creators`   | Portfolio creator management | Creator workspace (MP-02)             |
| `/portal/live`       | Live operations dashboard    | Live operations workspace (MP-03)     |
| `/portal/campaigns`  | Campaign operations          | Campaign operations workspace (MP-04) |
| `/portal/recruiting` | Recruiting CRM               | Recruiting workspace (MP-05)          |
| `/portal/tasks`      | Operations Center            | Operations center workspace (MP-06)   |
| `/portal/reports`    | Reporting & Analytics        | Reporting workspace (MP-07)           |
| `/portal/admin`      | Administration               | Administration workspace (MP-08)      |
| `/portal/settings`   | Settings                     | Portal preferences workspace (MP-09)  |

---

## Data modes

| Variable                         | Purpose                                                         |
| -------------------------------- | --------------------------------------------------------------- |
| `NEXT_PUBLIC_USE_MOCK_DASHBOARD` | `true` (default) serves typed mock dashboard and workspace data |
| `NEXT_PUBLIC_API_URL`            | API host for auth and live API endpoints                        |
| `NEXT_PUBLIC_ORGANIZATION_ID`    | Default mock organization id                                    |

Live workspaces compose existing Creator CRM, Live Intelligence, Campaign, Recruitment, Organization, RBAC, Audit, and Agency endpoints. Live dashboard API integration remains deferred.

---

## Implementation phases (v0.8)

| Phase | Scope                     | Status |
| ----- | ------------------------- | ------ |
| MP-01 | Manager shell             | ✅     |
| MP-02 | Creator management        | ✅     |
| MP-03 | Live operations dashboard | ✅     |
| MP-04 | Campaign operations       | ✅     |
| MP-05 | Recruiting CRM            | ✅     |
| MP-06 | Operations Center         | ✅     |
| MP-07 | Reporting & Analytics     | ✅     |
| MP-08 | Administration            | ✅     |
| MP-09 | Integration & polish      | ✅     |

---

## Related documentation

- [Manager Portal architecture](../architecture/manager-portal.md)
- [Release v0.8](../roadmap/releases.md#v08--manager-portal)
- [Master Roadmap — Manager Portal](../roadmap/master-roadmap.md#manager-portal)

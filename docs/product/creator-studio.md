# Creator Studio

**Status:** ✅ **COMPLETE** — Creator Studio v1.0 (Release 0.7)  
**Target:** Release 0.7 (`release/0.7.x`) — shipped  
**Depends on:** v0.6 Creator Intelligence APIs (dashboard, goals, performance, intelligence, trends)  
**Application:** `apps/creator-portal`

---

## Creator Studio v1.0 summary

Creator Studio v1.0 is the creator-facing operating system for daily work on Kōlab. Creators sign in to a unified web workspace and review priorities, goals, campaigns, live activity, coaching signals, replay intelligence, compliance, and profile settings — all backed by existing APIs with mock or live data modes.

| Capability                | Workspaces                                                        |
| ------------------------- | ----------------------------------------------------------------- |
| **Home & priorities**     | Dashboard with quick actions and aggregated sections              |
| **Goals & performance**   | Goals tracking and performance score visualization                |
| **Campaigns**             | List, kanban, and detail views with deliverables and applications |
| **Coaching**              | Recommendations, alerts, and intelligence tabs                    |
| **Live operations**       | Session overview, timeline, summary, and live intelligence        |
| **Post-live review**      | Replay timeline, highlights, triggers, and gifter intelligence    |
| **Identity & compliance** | Profile, platform accounts, skills, compliance, and settings      |
| **Production foundation** | Mock production workspace UI (desktop/OBS deferred to v0.9)       |
| **Polish**                | Shared shells, navigation, accessibility, tab memory, and caching |

---

## Goal

Deliver **Creator Studio** — the daily workspace where creators see goals, campaigns, live activity, coaching, compliance, and performance in one place. Creator Studio is the primary creator-facing product surface for the Kōlab flywheel: intelligence and recommendations must become **action**, not another dashboard agencies interpret for them.

---

## Product purpose

Creator Studio answers one question for every signed-in creator:

> _What should I do today to grow revenue, stay compliant, and deliver on my campaigns?_

It consolidates backend capabilities shipped in v0.5–v0.6 into a cohesive experience. It does **not** introduce new domain logic — it consumes existing APIs and the aggregated [dashboard endpoint](../api/creators.md#get-apicreatorsiddashboard).

**Delivery strategy:** **Web app first** (`apps/creator-portal`). Desktop wrapper and OBS/browser-source integration follow only after the web workspace proves daily utility. See [Architecture — Client strategy](../architecture/creator-studio.md#web-first-vs-desktop-wrapper).

---

## Target users

| User                        | Role                           | Primary needs                                          |
| --------------------------- | ------------------------------ | ------------------------------------------------------ |
| **Managed creator**         | `CREATOR` membership           | Daily goals, go-live prep, deliverables, coach signals |
| **Independent creator**     | `CREATOR` in creator org       | Same workspace; fewer manager-assigned campaigns       |
| **Agency-assigned creator** | `CREATOR` linked to agency org | Campaign tasks, compliance, performance visibility     |

**Not in scope for Creator Studio UI:** recruiters, agency managers, and org admins operate through **admin** and the future **Manager Portal** — they do not use Creator Studio as their command center. Creators may only access **their own** creator profile within the active organization.

---

## Core modules

| Module                                                                         | Creator value                         |
| ------------------------------------------------------------------------------ | ------------------------------------- |
| [Home dashboard](../architecture/creator-studio.md#home-dashboard)             | Single glance: today’s priorities     |
| [Goals](../architecture/creator-studio.md#goals)                               | Track and recalculate progress        |
| [Campaign tasks](../architecture/creator-studio.md#campaign-tasks)             | Active assignments and applications   |
| [Deliverables](../architecture/creator-studio.md#deliverables)                 | Submit and track campaign work        |
| [Live schedule](../architecture/creator-studio.md#live-schedule)               | Planned sessions and go-live windows  |
| [Go Live workspace](../architecture/creator-studio.md#go-live-workspace)       | Pre-live checklist and session status |
| [Coach alerts](../architecture/creator-studio.md#coach-alerts)                 | Time-sensitive coaching signals       |
| [Recommendations](../architecture/creator-studio.md#recommendations)           | Deterministic next actions            |
| [Performance score](../architecture/creator-studio.md#performance-score)       | Explainable health index              |
| [Intelligence profile](../architecture/creator-studio.md#intelligence-profile) | Cross-session strengths and risks     |
| [Trends](../architecture/creator-studio.md#trends)                             | Live performance direction            |
| [Timeline replay](../architecture/creator-studio.md#timeline-replay)           | Session moment review                 |
| [Gifter insights](../architecture/creator-studio.md#gifter-insights)           | Supporter aggregates (no raw chat)    |
| [Compliance](../architecture/creator-studio.md#compliance)                     | Onboarding and document status        |
| [Profile / settings](../architecture/creator-studio.md#profile--settings)      | Identity and preferences              |

Module UX patterns: [Creator Studio UX](../design/creator-studio-ux.md).

---

## Manager visibility

Creator Studio is **creator-scoped**. Managers and recruiters do not impersonate creators in this app.

| Need                             | Surface                                |
| -------------------------------- | -------------------------------------- |
| Portfolio oversight              | Manager Portal (v0.8, planned)         |
| Lead and roster ops              | Admin / agency tools                   |
| Audit of creator dashboard views | `creator.dashboard.viewed` audit event |

Managers benefit indirectly when creators act on coach signals and complete deliverables without manual agency follow-up.

---

## OBS and Live Studio (future)

Creator Studio **Phase 1 (web)** links to live schedules and session status. Native capture, scene control, and browser-source overlays belong to **Live Studio / OBS layer (v0.9+)** after web workflows validate. Creator Studio will deep-link to Live Studio when available; until then, creators use platform-native streaming with Kōlab session linkage via API.

See [Architecture — OBS and Live Studio future](../architecture/creator-studio.md#obs-and-live-studio-future).

---

## Implementation phases

| Phase | ID    | Scope                                               | Status |
| ----- | ----- | --------------------------------------------------- | ------ |
| 1     | CS-01 | App shell, auth, navigation, org context            | ✅     |
| 2     | CS-02 | Home dashboard (aggregated endpoint)                | ✅     |
| 3     | CS-03 | Goals and performance surfaces                      | ✅     |
| 4     | CS-04 | Campaign workspace and deliverables                 | ✅     |
| 5     | CS-05 | Coach alerts and recommendations                    | ✅     |
| 6     | CS-06 | Live schedule and go-live workspace                 | ✅     |
| 7     | CS-07 | Replay and gifter insights                          | ✅     |
| 8     | CS-08 | Profile, settings, compliance                       | ✅     |
| 9     | CS-09 | OBS/browser-source foundation (post-web validation) | ✅     |
| 10    | CS-10 | Integration and polish                              | ✅     |

Full phase detail: [Architecture — Implementation phases](../architecture/creator-studio.md#implementation-phases).

### Dashboard live vs mock mode

| Mode     | Configuration                                   | Behavior                                                                                                              |
| -------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Mock** | `NEXT_PUBLIC_USE_MOCK_DASHBOARD=true` (default) | Typed mock data for dashboard, goals, performance, campaigns, coach, live, replay intelligence, profile, and settings |
| **Live** | `NEXT_PUBLIC_USE_MOCK_DASHBOARD=false`          | Live API with JWT from auth session                                                                                   |

| Surface     | Live endpoint                                       |
| ----------- | --------------------------------------------------- |
| Dashboard   | `GET /api/creators/:id/dashboard`                   |
| Goals       | `GET /api/creators/:id/goals`                       |
| Performance | `GET /api/creators/:id/performance-score`           |
| Campaigns   | Campaigns API (`/api/campaigns/*`)                  |
| Coach       | Live Intelligence + creator intelligence            |
| Live        | Live session, timeline, summary, intelligence       |
| Replay      | Replay, highlights, triggers, gifters, intelligence |

Set `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_CREATOR_PROFILE_ID` for live mode until creator identity mapping is implemented.

---

## Success criteria

| Criterion     | Measure                                                                               | v1.0 |
| ------------- | ------------------------------------------------------------------------------------- | ---- |
| Daily utility | Creators complete goals review, deliverable check, and go-live prep without admin API | ✅   |
| Performance   | Dashboard initial load p95 within product SLA (target &lt; 2s on broadband)           | ✅   |
| Correctness   | UI displays API DTOs only — no client-side score recomputation                        | ✅   |
| Privacy       | No raw chat or transcript bodies in any Creator Studio view                           | ✅   |
| Mobile        | Core flows usable on phone viewport (responsive, not native app)                      | ✅   |
| Audit         | Dashboard and sensitive views emit existing audit actions                             | ✅   |
| Cohesion      | All workspaces share consistent shell, loading, and navigation patterns               | ✅   |

---

## Out of scope (v1.0 complete; deferred)

- New backend domains or Prisma models for Creator Studio
- Desktop installer (Electron/Tauri) — v0.9 Live Studio
- Real-time websocket coach delivery — API summaries first
- Manager portfolio UI — Manager Portal v0.8
- AI-generated coaching copy — v1.5 AI Coach release
- Native OBS capture and streaming — v0.9 OBS Foundation

---

## Related documentation

- [Creator Studio architecture](../architecture/creator-studio.md)
- [Creator Studio UX](../design/creator-studio-ux.md)
- [Creators API](../api/creators.md)
- [Live Intelligence API](../api/live-intelligence.md)
- [Release v0.7](../roadmap/releases.md#v07--creator-studio)
- [Master Roadmap — Creator Studio](../roadmap/master-roadmap.md#creator-studio)

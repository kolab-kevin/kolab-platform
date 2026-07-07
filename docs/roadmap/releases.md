# Kōlab Release Roadmap

**Purpose:** Single canonical release sequence from platform foundation through global network. Each release defines objectives, major capabilities, success criteria, and dependencies. Tactical execution details remain in product briefs and API docs — this document is the strategic release spine.

**Related:** [Master Roadmap](./master-roadmap.md) · [Traceability Matrix](./traceability.md) · [Roadmap History](./master-roadmap.md#roadmap-history) · [Business Model](../business/business-model.md)

---

## Release overview

| Version                              | Theme                  | Status          |
| ------------------------------------ | ---------------------- | --------------- |
| [v0.1](#v01--platform-foundation)    | Platform Foundation    | Shipped         |
| [v0.2](#v02--identity)               | Identity               | Shipped         |
| [v0.3](#v03--recruitment-crm)        | Recruitment CRM        | Shipped         |
| [v0.4](#v04--campaigns)              | Campaigns              | Shipped         |
| [v0.5](#v05--live-intelligence)      | Live Intelligence      | Shipped         |
| [v0.6](#v06--creator-intelligence)   | Creator Intelligence   | Shipped         |
| [v0.7](#v07--creator-studio)         | Creator Studio         | **Complete**    |
| [v0.8](#v08--manager-portal)         | Manager Portal         | **In progress** |
| [v0.9](#v09--obs-foundation)         | OBS Foundation         | Planned         |
| [v1.0](#v10--commercial-release)     | Commercial Release     | Planned         |
| [v1.5](#v15--ai-coach)               | AI Coach               | Planned         |
| [v2.0](#v20--marketplace)            | Marketplace            | Planned         |
| [v2.5](#v25--financial-platform)     | Financial Platform     | Planned         |
| [v3.0](#v30--global-creator-network) | Global Creator Network | Planned         |

---

## v0.1 — Platform Foundation

**Objectives:** Prove the monorepo can host multiple deployable apps with shared packages, CI, and local Docker workflow.

**Major capabilities:** Monorepo (Turborepo), NestJS API shell, Next.js app shells, PostgreSQL + Redis, JWT auth, Docker Compose, quality gates.

**Success criteria:** `pnpm validate` passes; apps start independently; shared `@kolab/types` and `@kolab/database` packages build.

**Dependencies:** None (greenfield).

---

## v0.2 — Identity

**Objectives:** Replace flat auth with organization-scoped multi-tenant identity.

**Major capabilities:** Organizations, memberships, invitations, sessions, audit logs, org-scoped RBAC, admin surfaces.

**Success criteria:** Users belong to organizations; cross-org isolation returns `404`; audit coverage for identity lifecycle events.

**Dependencies:** v0.1 Platform Foundation. See [Identity architecture](../architecture/identity.md).

---

## v0.3 — Recruitment CRM

**Objectives:** Close the recruiting loop from lead to roster inside the organization graph.

**Major capabilities:** Creator leads, assignments, notes, status history, recruiter profiles, creator profiles, platform accounts.

**Success criteria:** Lead converts to creator profile in-org; recruiter activity auditable; roster list/filter operational.

**Dependencies:** v0.2 Identity. See [Recruitment CRM product brief](../product/recruitment-crm.md).

---

## v0.4 — Campaigns

**Objectives:** Run brand campaigns with assignments, deliverables, and deterministic matching inside the agency.

**Major capabilities:** Campaign CRUD, applications, assignments, deliverable workflow, creator matching with evidence.

**Success criteria:** End-to-end campaign assignment; matching returns scores and risks; audit on status changes.

**Dependencies:** v0.3 Recruitment CRM (creator profiles). See [Campaigns API](../api/campaigns.md).

---

## v0.5 — Live Intelligence

**Objectives:** Turn live streams into structured, append-only operational data.

**Major capabilities:** Live sessions, schedules, live events, gifter profiles, rollups, timeline replay, highlights, trigger analysis, session summary, coach recommendations, coach alerts, intelligence snapshots.

**Success criteria:** Events ingest append-only; rollups idempotent; session intelligence generated post-live.

**Dependencies:** v0.4 Campaigns (optional campaign link); [ADR-0002](../architecture/decision-log.md#adr-0002-append-only-live-events). See [Live Intelligence API](../api/live-intelligence.md).

---

## v0.6 — Creator Intelligence

**Objectives:** Build cross-session creator graph — intelligence profile, trends, performance score, goals, dashboard aggregation.

**Major capabilities:** Creator intelligence profile, live trend detection, performance score, goals engine, creator dashboard API.

**Success criteria:** Deterministic outputs with evidence arrays; goals recalculate from live data; dashboard composes existing services.

**Dependencies:** v0.5 Live Intelligence; [ADR-0001](../architecture/decision-log.md#adr-0001-deterministic-before-ai), [ADR-0006](../architecture/decision-log.md#adr-0006-intelligence-snapshots).

---

## v0.7 — Creator Studio

**Status:** ✅ **COMPLETE** — Creator Studio v1.0 shipped in `apps/creator-portal`.

**Objectives:** Deliver the primary creator-facing surface backed by existing APIs.

**Major capabilities:** Creator portal UX for dashboard, goals, live schedule, campaigns, compliance, coaching summaries, replay intelligence, profile/settings, and production workspace foundation. Web-first in `apps/creator-portal`; desktop wrapper and OBS integration deferred to v0.9.

**Success criteria:** Creators complete daily workflows without admin API; dashboard p95 within SLA; mobile-responsive core flows; no client-side score recomputation. ✅ Met.

**Dependencies:** v0.6 Creator Intelligence (dashboard and goals APIs).

**Documentation:** [Product brief](../product/creator-studio.md) · [Architecture](../architecture/creator-studio.md) · [UX](../design/creator-studio-ux.md)

**Implementation phases (complete):**

| Phase | Scope                           | Status |
| ----- | ------------------------------- | ------ |
| CS-01 | Shell                           | ✅     |
| CS-02 | Dashboard                       | ✅     |
| CS-03 | Goals & Performance             | ✅     |
| CS-04 | Campaign Workspace              | ✅     |
| CS-05 | Coach Workspace                 | ✅     |
| CS-06 | Live Workspace                  | ✅     |
| CS-07 | Replay & Gifter Intelligence    | ✅     |
| CS-08 | Profile & Settings              | ✅     |
| CS-09 | Production Workspace Foundation | ✅     |
| CS-10 | Integration & Polish            | ✅     |

**Completion notes:** All ten CS phases shipped. Shared workspace shell, mock/live data modes, navigation polish, and accessibility pass complete. Production workspace UI foundation (CS-09) is mock-only; native OBS/desktop integration remains v0.9 scope.

---

## v0.8 — Manager Portal

**Status:** 🚧 **IN PROGRESS** — MP-01 through MP-08 shipped; MP-09 Integration & polish next.

**Objectives:** Extend agency operations to portfolio managers and recruiters at scale.

**Major capabilities:** Authenticated manager portal shell, mock agency dashboard, creator management workspace, live operations workspace, campaign operations workspace, recruiting CRM workspace, operations center workspace, executive reporting & analytics workspace, administration workspace, placeholder workspace for settings.

**Success criteria:** Managers operate full roster without spreadsheets; permission matrix enforced; audit on bulk changes.

**Dependencies:** v0.7 Creator Studio patterns; Agency CRM backend maturity.

**Documentation:** [Product brief](../product/manager-portal.md) · [Architecture](../architecture/manager-portal.md)

**MP-01 completion notes:** `apps/manager-portal` ships with auth, organization placeholder, dark layout, sidebar/top nav, breadcrumbs, user menu, notification placeholder, global loading/error handling, 404/unauthorized pages, and typed mock dashboard cards. Live API integration deferred.

**MP-02 completion notes:** `/portal/creators` ships searchable/sortable creator list, detail panel (profile through live summary), UI-only filters and quick actions, and mock/live modes composing existing Creator CRM endpoints. Presentation-only — no frontend score calculations.

**MP-03 completion notes:** `/portal/live` ships live sessions list, agency monitoring, coach queue, session timeline, UI-only quick actions, and mock/live modes composing existing Live Intelligence endpoints. Presentation-only — no frontend score calculations.

**MP-04 completion notes:** `/portal/campaigns` ships campaign overview, board, detail, deliverables, applications, UI-only quick actions, and mock/live modes composing existing Campaign endpoints. Presentation-only — status history synthesized from campaign timestamps.

**MP-05 completion notes:** `/portal/recruiting` ships recruiting overview, prospect pipeline, detail, follow-up queue, recruiter performance, UI-only quick actions, and mock/live modes composing existing Recruitment endpoints. Presentation-only — recruiter metrics and follow-up buckets computed client-side.

**MP-06 completion notes:** `/portal/tasks` ships operations overview, task queue, alerts center, deadlines, activity feed, AI recommendations, UI-only quick actions, and mock/live modes composing Live Intelligence, Campaign, Recruitment, Audit, and Documents endpoints. Presentation-only — tasks and overview metrics derived client-side.

**MP-07 completion notes:** `/portal/reports` ships executive overview, creator/campaign/recruiting/live analytics, intelligence dashboard, export center, UI-only export actions, and mock/live modes composing Creator CRM, Campaign, Recruitment, and Live Intelligence endpoints. Presentation-only — executive metrics, health score, and intelligence derived client-side.

**MP-08 completion notes:** `/portal/admin` ships organization profile, user management, roles & permissions, organization settings, audit center, system health, integrations, UI-only quick actions, and mock/live modes composing Organization, Agency, RBAC, Audit, and Invitation endpoints. Presentation-only — permission matrix and health metadata derived client-side.

**Implementation phases:**

| Phase | Scope                     | Status |
| ----- | ------------------------- | ------ |
| MP-01 | Manager Shell             | ✅     |
| MP-02 | Creator Management        | ✅     |
| MP-03 | Live Operations Dashboard | ✅     |
| MP-04 | Campaign Operations       | ✅     |
| MP-05 | Recruiting CRM            | ✅     |
| MP-06 | Operations Center         | ✅     |
| MP-07 | Reporting                 | ✅     |
| MP-08 | Administration            | ✅     |
| MP-09 | Integration & Polish      | 📋     |

---

## v0.9 — OBS Foundation

**Objectives:** Establish Live Studio infrastructure without full OBS parity.

**Major capabilities:** Desktop shell, scene model, browser sources, Kōlab event bridge, session linkage to live intelligence.

**Success criteria:** Creator streams through Kōlab-linked session; events flow to append-only timeline; OBS research items evaluated.

**Dependencies:** v0.5 Live Intelligence; desktop packaging pipeline.

---

## v1.0 — Commercial Release

**Objectives:** First paid agency tier with production SLA, billing, and support runbooks.

**Major capabilities:** Subscription billing, agency onboarding, production observability, incident response, documentation hub complete.

**Success criteria:** Paying agency onboarded end-to-end; uptime SLO met; [Risk Register](../business/risk-register.md) high items mitigated or accepted.

**Dependencies:** v0.7 Creator Studio, v0.8 Manager Portal, enterprise security baseline.

---

## v1.5 — AI Coach

**Objectives:** Add assistive AI that explains deterministic intelligence — never replaces it.

**Major capabilities:** AI summaries of session and creator snapshots, coaching copy generation, moderation assists with human approval.

**Success criteria:** AI outputs cite snapshot evidence; no silent model changes; credits metering operational.

**Dependencies:** v1.0 Commercial Release; [ADR-0001](../architecture/decision-log.md#adr-0001-deterministic-before-ai); KOLAB Credits ledger.

---

## v2.0 — Marketplace

**Objectives:** Connect brands and creators through verified campaign marketplace flows.

**Major capabilities:** Brand discovery, campaign listings, escrow-ready deliverables, fraud controls, marketplace fees.

**Success criteria:** Marketplace transaction completes with audit trail; fraud detection flags tested; fee reconciliation.

**Dependencies:** v1.0 Commercial Release; campaign and compliance maturity; marketplace fraud mitigations in risk register.

---

## v2.5 — Financial Platform

**Objectives:** Payouts, invoicing, and financial reporting for agencies and creators.

**Major capabilities:** Payout rails, tax document collection, revenue share, financial dashboards, credits settlement.

**Success criteria:** Payout reconciliation matches ledger; tax workflows documented; no negative balance races.

**Dependencies:** v2.0 Marketplace; [ADR-0005](../architecture/decision-log.md#adr-0005-kōlab-credits-before-token).

---

## v3.0 — Global Creator Network

**Objectives:** Multi-region, localized compliance, cross-market creator and brand matching.

**Major capabilities:** Internationalization, multi-region deployment, localized compliance packs, cross-market marketplace, enterprise SSO at scale.

**Success criteria:** Kōlab operates in two or more regions with localized compliance; cross-region latency within SLO.

**Dependencies:** v2.5 Financial Platform; international compliance risk mitigations.

---

## Related documentation

- [Master Roadmap](./master-roadmap.md)
- [Traceability Matrix](./traceability.md)
- [Product overview](../product/README.md)
- [Roadmap Freeze Policy](./master-roadmap.md#roadmap-freeze-policy)

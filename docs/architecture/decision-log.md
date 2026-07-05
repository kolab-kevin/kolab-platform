# Kōlab Decision Log

<!-- markdownlint-disable MD024 -->

**Purpose:** Record major architectural and platform decisions in ADR style. Each entry captures context, the decision taken, alternatives rejected, and consequences so future contributors do not re-litigate settled choices.

**Status values:** `Proposed` · `Accepted` · `Superseded` · `Deprecated` · `Rejected`

**Related:** [Product Principles](../vision/product-principles.md) · [ADR process](../adr/README.md) · [Master Roadmap](../roadmap/master-roadmap.md) · [Event Taxonomy](./event-taxonomy.md)

---

## Index

| ADR                                              | Title                      | Status   | Date       |
| ------------------------------------------------ | -------------------------- | -------- | ---------- |
| [ADR-0001](#adr-0001-deterministic-before-ai)    | Deterministic Before AI    | Accepted | 2025-08-15 |
| [ADR-0002](#adr-0002-append-only-live-events)    | Append-only Live Events    | Accepted | 2025-11-01 |
| [ADR-0003](#adr-0003-organization-scoped-data)   | Organization Scoped Data   | Accepted | 2025-06-20 |
| [ADR-0004](#adr-0004-backend-first-development)  | Backend First Development  | Accepted | 2025-03-10 |
| [ADR-0005](#adr-0005-kōlab-credits-before-token) | Kōlab Credits Before Token | Accepted | 2026-01-12 |
| [ADR-0006](#adr-0006-intelligence-snapshots)     | Intelligence Snapshots     | Accepted | 2026-03-18 |

---

## ADR-0001: Deterministic Before AI

- **Status:** Accepted
- **Date:** 2025-08-15

### Context

Creator agencies require explainable scores, compliance outcomes, campaign matching, and goal progress. Black-box AI rankings create audit risk, inconsistent coaching, and regulatory exposure. Intelligence features were entering the roadmap alongside planned AI services.

### Decision

Ship **deterministic rules, scores, and recalculations first**. Generative AI may summarize or suggest later, but must never be the sole source of truth for compliance, payouts, matching, or goal progress. All intelligence outputs store calculation summaries, evidence arrays, and data quality warnings.

### Alternatives considered

| Option                       | Pros                              | Cons                                      | Why rejected                                |
| ---------------------------- | --------------------------------- | ----------------------------------------- | ------------------------------------------- |
| AI-first scoring             | Faster initial prototypes         | Opaque, non-reproducible, compliance risk | Fails audit and agency trust requirements   |
| Hybrid with AI as primary    | Rich narratives                   | Hard to debug regressions                 | Violates explainability principle           |
| Deterministic first (chosen) | Reproducible, auditable, testable | More engineering upfront                  | Aligns with product principles and flywheel |

### Consequences

- Positive: Intelligence APIs are testable; agencies can review evidence fields; AI layer can consume structured inputs later.
- Negative: More service-layer logic before client polish; narrative quality depends on rule design.
- Neutral: Documented in [Product Principles](../vision/product-principles.md#deterministic-before-ai) and enforced across live and creator intelligence modules.

---

## ADR-0002: Append-only Live Events

- **Status:** Accepted
- **Date:** 2025-11-01

### Context

Live intelligence requires timeline replay, trigger analysis, gifter rollups, and session summaries. Mutable event logs would break idempotency, coaching audit trails, and cross-session trend detection.

### Decision

Store live session data as **append-only `LiveEvent` rows**. Timeline reconstruction, highlights, trigger analysis, and rollups read from events without mutating them. Derived state lives on session metadata or separate rollup tables.

### Alternatives considered

| Option                                         | Pros                        | Cons                                        | Why rejected                                   |
| ---------------------------------------------- | --------------------------- | ------------------------------------------- | ---------------------------------------------- |
| Mutable event log                              | Simpler corrections         | Breaks replay integrity                     | Cannot reconstruct historical coaching context |
| External stream-only storage                   | Lower DB write load         | No unified org-scoped query model           | Fragments the data network                     |
| Append-only with compensating entries (chosen) | Audit-friendly, replay-safe | Requires correction patterns for bad ingest | Matches financial and audit patterns           |

### Consequences

- Positive: Timeline replay and trigger analysis are deterministic; rollups can be reprocessed idempotently.
- Negative: No in-place event edits; bad ingest requires explicit correction events or metadata flags.
- Neutral: Canonical taxonomy in [Event Taxonomy](./event-taxonomy.md); API docs in [Live Intelligence API](../api/live-intelligence.md).

---

## ADR-0003: Organization Scoped Data

- **Status:** Accepted
- **Date:** 2025-06-20

### Context

Kōlab serves multiple agencies on one platform. Phase 1 flat auth could not support roster isolation, campaign boundaries, or compliance separation between tenants.

### Decision

Bind **every query and mutation to `organizationId`** from authenticated membership context. Cross-tenant resource IDs return `404`, not partial data. All CRM, campaign, live, and intelligence models include organization foreign keys and membership checks.

### Alternatives considered

| Option                       | Pros                         | Cons                            | Why rejected                                |
| ---------------------------- | ---------------------------- | ------------------------------- | ------------------------------------------- |
| User-scoped only             | Simpler schema               | No multi-tenant agencies        | Cannot serve agency business model          |
| Shared global creator pool   | Easier cross-agency matching | Privacy and contract violations | Conflicts with agency operating model       |
| Organization scoped (chosen) | Clear isolation, auditable   | More joins on every query       | Required for enterprise and compliance path |

### Consequences

- Positive: Strong tenant boundary; aligns with RBAC and audit design in [Identity architecture](./identity.md).
- Negative: Cross-org features require explicit policy ADRs and legal review.
- Neutral: JWT claims and guards enforce scope; documented in [Product Principles](../vision/product-principles.md#organization-scoped).

---

## ADR-0004: Backend First Development

- **Status:** Accepted
- **Date:** 2025-03-10

### Context

Multiple client surfaces (web, admin, creator-portal, future desktop and mobile) depend on the same domain logic. Building UI before stable contracts caused rework in early monorepo phases.

### Decision

Deliver **schema, migrations, shared types, services, tests, and API documentation before client polish**. UI tracks API contracts in `@kolab/types` and `@kolab/sdk` — not the reverse. Roadmap completion weights backend delivery heavily in early phases.

### Alternatives considered

| Option                 | Pros                             | Cons                       | Why rejected                               |
| ---------------------- | -------------------------------- | -------------------------- | ------------------------------------------ |
| Design-first UI mocks  | Faster stakeholder demos         | Contract drift             | Breaks composable API principle            |
| Parallel UI and API    | Perceived speed                  | Duplicate business logic   | Violates reusable business logic principle |
| Backend first (chosen) | Single source of truth, testable | Slower visible UI progress | Proven pattern for multi-app platform      |

### Consequences

- Positive: Creator dashboard aggregates existing services; intelligence features share utils and tests.
- Negative: Frontend maturity lags backend in maturity dashboard until Creator Studio ships.
- Neutral: Reflected in [Release Roadmap](../roadmap/releases.md) and [Traceability Matrix](../roadmap/traceability.md).

---

## ADR-0005: Kōlab Credits Before Token

- **Status:** Accepted
- **Date:** 2026-01-12

### Context

Token economy features attract regulatory scrutiny. Premium AI metering, campaign incentives, and marketplace settlements need an internal ledger before any blockchain or transferable token layer.

### Decision

Implement **KOLAB Credits ledger first** — append-only, organization-scoped, auditable. Defer token bridge, peer transfer, and on-chain utility until legal and executive gates pass. See [Token Economy architecture](./token-economy.md).

### Alternatives considered

| Option                        | Pros                          | Cons                                          | Why rejected                                     |
| ----------------------------- | ----------------------------- | --------------------------------------------- | ------------------------------------------------ |
| Token-first launch            | Marketing appeal              | Regulatory and fraud risk                     | Unacceptable without measurement infrastructure  |
| No internal ledger            | Simplest v1                   | Cannot meter AI or reward verifiable outcomes | Blocks flywheel monetization                     |
| Credits before token (chosen) | Controlled utility, auditable | Two-phase delivery                            | Matches deterministic-first and audit principles |

### Consequences

- Positive: Credits tie to measurable platform outcomes; token utility follows measurement.
- Negative: Token roadmap deferred; marketplace settlement design depends on credits foundation.
- Neutral: Tracked in [Risk Register](../business/risk-register.md) under token regulation.

---

## ADR-0006: Intelligence Snapshots

- **Status:** Accepted
- **Date:** 2026-03-18

### Context

Creator intelligence, live trends, performance scores, session summaries, and coach outputs each produce rich structured data. Recomputing everything on every read is expensive and complicates trend comparison across time windows.

### Decision

Persist **versioned intelligence snapshots** on domain metadata (session, creator profile) at generation time. POST endpoints regenerate and replace; GET endpoints read stored snapshots. Missing upstream data produces warnings, not silent defaults.

### Alternatives considered

| Option                    | Pros                                      | Cons                                        | Why rejected                                   |
| ------------------------- | ----------------------------------------- | ------------------------------------------- | ---------------------------------------------- |
| Compute on read only      | Always fresh                              | Slow dashboards; inconsistent trend windows | Fails at roster scale                          |
| Opaque ML model cache     | Fast                                      | Not explainable                             | Violates ADR-0001                              |
| Stored snapshots (chosen) | Fast reads, comparable history, auditable | Stale until regenerated                     | Acceptable with explicit recalculate endpoints |

### Consequences

- Positive: Dashboard, trends, and performance score compose snapshot inputs; traceability to generation time.
- Negative: Operators must understand regenerate semantics; storage grows with profile count.
- Neutral: Entity definitions in [Data Dictionary](../database/data-dictionary.md).

---

## Related documentation

- [ADR process and template](../adr/README.md)
- [Event Taxonomy](./event-taxonomy.md)
- [System Map](./system-map.md)
- [Traceability Matrix](../roadmap/traceability.md)

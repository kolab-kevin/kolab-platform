# Kōlab Product Principles

**Status:** Strategic reference  
**Audience:** Product, engineering, design  
**Related:** [Product Strategy](./product-strategy.md) · [Master Roadmap](../roadmap/master-roadmap.md) · [Coding Standards](../engineering/coding-standards.md)

---

## Purpose

These principles guide tradeoffs across backend, frontend, desktop, and mobile. When plans conflict, the principle list resolves the decision before debate repeats.

---

## Core principles

### Deterministic before AI

Ship explainable rules, scores, and recalculations first. Generative AI may summarize or suggest, but **must not** be the only source of truth for compliance, payouts, matching, or goal progress.

**Implication:** Intelligence features store calculation summaries and audit mutations. See [Live Intelligence](../architecture/live-intelligence.md) and [Creator Goals](../database/creator-goals-erd.md).

---

### Explainable decisions

Users and auditors must understand _why_ a score, match, alert, or status changed. Avoid opaque rankings and hidden weight changes without version notes.

**Implication:** Performance scores expose strengths, risks, and data quality warnings. Campaign matching returns evidence fields.

---

### Privacy first

Collect the minimum data required for product value. Never expose raw chat, transcripts, or sensitive documents beyond permission boundaries. Dashboard and coaching surfaces aggregate; they do not leak event payloads.

**Implication:** Creator dashboard excludes raw live event bodies. Sensitive document download requires explicit permission.

---

### Organization scoped

Every query and mutation is bound to `organizationId` from authenticated context. Cross-tenant access returns `404`, not partial leaks.

**Implication:** All CRM, campaign, and live models include organization foreign keys and membership checks.

---

### Audit everything

Material state changes record actor, action, target, and metadata. Audit is not optional for CRM, campaigns, live intelligence, goals, or dashboard views that expose sensitive aggregates.

**Implication:** See [Audit logs API](../api/audit-logs.md) and per-module audit tables in API docs.

---

### Composable APIs

Features expose focused REST endpoints with shared types in `@kolab/types`. Clients compose experiences; the backend does not assume a single UI shape.

**Implication:** Creator dashboard aggregates existing services — it does not duplicate business logic.

---

### Reusable business logic

Domain rules live in services and pure utils, not controllers. Recalculation, scoring, matching, and compliance derivation are callable from multiple endpoints and tests.

**Implication:** Goals recalculation uses shared utils; performance score generation uses shared builders.

---

### Backend first

Schema, migrations, types, services, tests, and API docs land before client polish. UI tracks API contracts — not the reverse.

**Implication:** Roadmap completion percentages weight backend delivery heavily in early phases.

---

### Automation first

Design workflows so agents, schedulers, and future AI can execute them without human-only shortcuts. Manual overrides remain auditable.

**Implication:** Status transitions are explicit; recalculation endpoints are idempotent where possible.

---

### No hidden magic

Background jobs, webhooks, and caches must be documented. Developers should trace any user-visible outcome to code and data.

**Implication:** Architecture docs and ERDs stay current with schema changes.

---

### Creator success first

When agency convenience conflicts with creator transparency, prefer outcomes that improve creator trust and long-term retention — without bypassing compliance or contracts.

**Implication:** Creator Studio surfaces coaching and goals, not just agency directives.

---

### Measure before optimizing

Establish baselines and deterministic metrics before tuning scores, UX, or automation. Do not optimize what is not measured.

**Implication:** Performance scores and goals expose calculation summaries; changes require before/after evidence.

---

### Automate repetitive work

Managers and creators should not repeat the same manual checks daily. Automate recalculation, reminders, and status transitions with audit trails.

**Implication:** Background jobs and scheduled recalculation are first-class roadmap items ([Technical Debt](../roadmap/master-roadmap.md#technical-debt)).

---

### Humans approve critical decisions

Payouts, compliance overrides, contract exceptions, and irreversible roster actions require human approval — AI may recommend, not commit.

**Implication:** AI Platform features inherit permission guards and approval queues.

---

### AI explains — not decides

Generative outputs summarize or suggest; deterministic systems decide money, compliance, matching, and goal status.

**Implication:** See [Deterministic before AI](#deterministic-before-ai) and [Explainable decisions](#explainable-decisions).

---

### Deterministic first

Same inputs must produce the same outputs until a versioned rule change is documented. No silent drift.

**Implication:** Intelligence and goals store version metadata and data quality warnings.

---

### Documentation is part of the product

API docs, ERDs, roadmap truth, and runbooks ship with features — not afterthoughts.

**Implication:** [Master Roadmap](../roadmap/master-roadmap.md) and [Documentation hub](../README.md) stay current.

---

### Everything measurable

If a feature claims to improve creator success, define the metric and how it is queried from existing data.

**Implication:** Flywheel stages in [Product Strategy](./product-strategy.md#platform-flywheel) map to measurable signals.

---

### Security by default

Deny by default, least privilege, org scope, and dependency auditing are non-negotiable — not stretch goals.

**Implication:** [Security overview](../security/README.md) and permission guards on every new module.

---

## Principle checklist for new features

Before merging a feature branch, confirm:

1. Organization scoping and permission guards are in place.
2. Mutations and sensitive reads emit audit events.
3. Types are exported from `@kolab/types`.
4. Business logic is tested without controller mocks where feasible.
5. API docs updated under `docs/api/`.
6. Roadmap status updated in [Master Roadmap](../roadmap/master-roadmap.md) when the feature changes delivery truth.

---

## Anti-patterns

| Anti-pattern                               | Preferred approach                        |
| ------------------------------------------ | ----------------------------------------- |
| LLM-only scoring                           | Deterministic score + optional AI summary |
| UI-driven schema                           | Prisma schema + migration first           |
| Cross-org “admin shortcuts” in tenant APIs | System admin tools with separate guards   |
| Silent metadata writes                     | Explicit endpoints with audit             |
| Duplicate aggregation logic                | Compose existing services                 |

---

## Related documentation

- [Product Strategy](./product-strategy.md)
- [Competitive Advantages](./competitive-advantages.md)
- [Master Roadmap](../roadmap/master-roadmap.md)
- [Backend standards](../engineering/backend-standards.md)
- [Testing standards](../engineering/testing-standards.md)

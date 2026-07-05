# Kōlab Data Dictionary

**Purpose:** Business glossary of major platform entities — definitions, relationships, and implementation status. Field-level schema detail lives in ERD documents and Prisma; this dictionary answers _what_ each entity means in product terms.

**Related:** [Database overview](./README.md) · [Event Taxonomy](../architecture/event-taxonomy.md) · [Decision Log](../architecture/decision-log.md) · [Traceability Matrix](../roadmap/traceability.md)

**Implementation status:** `Implemented` · `Partial` · `Planned`

---

## User

**Definition:** A human account that authenticates to Kōlab. Users may belong to one or more organizations through memberships.

**Relationships:** One user → many `OrganizationMembership` rows; optional `UserProfile`, `RecruiterProfile`; linked to audit actors.

**Implementation status:** Implemented — see [Identity ERD](./identity-erd.md).

---

## Organization

**Definition:** The top-level tenant boundary for agencies and creator businesses. All CRM, campaign, live, and intelligence data is scoped to an organization.

**Relationships:** One organization → many memberships, creator profiles, campaigns, live sessions; owns settings and audit context.

**Implementation status:** Implemented — [ADR-0003](../architecture/decision-log.md#adr-0003-organization-scoped-data).

---

## Membership

**Definition:** Links a user to an organization with a role (for example `ORG_OWNER`, `AGENCY_MANAGER`, `RECRUITER`) and permission set.

**Relationships:** Joins `User` and `Organization`; gates all API authorization checks.

**Implementation status:** Implemented — `OrganizationMembership` in [Identity ERD](./identity-erd.md).

---

## Recruiter

**Definition:** Business profile for a user acting as a talent recruiter within an organization — territory, targets, and roster accountability.

**Relationships:** Belongs to organization and user; associated with lead assignments and recruitment activity.

**Implementation status:** Implemented — `RecruiterProfile` in [Recruitment CRM ERD](./recruitment-crm-erd.md).

---

## Creator

**Definition:** Product term for a talent managed by an agency — represented as a `CreatorProfile` in the data model, not a separate login type unless the user is also a member.

**Relationships:** One creator profile → platform accounts, documents, contracts, campaigns, live sessions, goals, intelligence snapshots.

**Implementation status:** Implemented — see [Creators API](../api/creators.md).

---

## Creator Profile

**Definition:** Organization-scoped record of a creator's identity, onboarding state, compliance status, and metadata snapshots (intelligence, performance score).

**Relationships:** Belongs to `Organization`; links to `CreatorPlatformAccount`, goals, live sessions, campaign assignments; stores generated intelligence in metadata.

**Implementation status:** Implemented.

---

## Campaign

**Definition:** A brand or agency initiative with requirements, timeline, budget context, and deliverable expectations assigned to creators.

**Relationships:** Belongs to organization; has assignments, deliverables, optional live session links; input to matching and performance scoring.

**Implementation status:** Implemented — [Campaigns ERD](./campaigns-erd.md).

---

## Campaign Assignment

**Definition:** Links a creator profile to a campaign with status, review fields, and execution tracking.

**Relationships:** Joins `Campaign` and `CreatorProfile`; parent to deliverables; affects performance score campaign execution component.

**Implementation status:** Implemented.

---

## Campaign Deliverable

**Definition:** A unit of work a creator owes under a campaign — content piece, live session, or proof of performance.

**Relationships:** Belongs to assignment and campaign; status transitions audited; may link to live sessions.

**Implementation status:** Implemented.

---

## Live Session

**Definition:** A scheduled or active broadcast instance for a creator on a live platform, with lifecycle status and derived analytics metadata.

**Relationships:** Belongs to organization and creator profile; optional campaign; parent to live events, rollups, summaries, intelligence snapshots.

**Implementation status:** Implemented — [Live Intelligence ERD](./live-intelligence-erd.md).

---

## Live Event

**Definition:** An append-only timestamped record on a session timeline — gift, chat, viewer, or session lifecycle signal.

**Relationships:** Belongs to `LiveSession`; consumed by rollups, replay, trigger analysis; never mutated in place ([ADR-0002](../architecture/decision-log.md#adr-0002-append-only-live-events)).

**Implementation status:** Implemented — see [Event Taxonomy](../architecture/event-taxonomy.md).

---

## Gifter Profile

**Definition:** Organization-scoped aggregate profile of a supporter (gifter) built from live event rollups — tiers, totals, retention signals.

**Relationships:** Linked to creator profiles via session stats; input to goals (whale retention) and intelligence profiles.

**Implementation status:** Implemented.

---

## Gifter Session Stats

**Definition:** Per-session statistics for a gifter on a specific live session — gift totals, message counts, join/leave behavior.

**Relationships:** Joins `GifterProfile`, `LiveSession`, and creator profile; produced by rollup processing.

**Implementation status:** Implemented.

---

## Creator Goal

**Definition:** A deterministic target for a creator (for example live days, revenue, whale retention) with type, period, status, and progress.

**Relationships:** Belongs to creator profile and organization; progress recalculated from live and campaign data.

**Implementation status:** Implemented — [Creator Goals ERD](./creator-goals-erd.md).

---

## Performance Score

**Definition:** Explainable 0–100 health index combining reliability, revenue, engagement, compliance, campaign execution, and growth components with narrative strengths and risks.

**Relationships:** Stored on `CreatorProfile.metadata`; consumes intelligence profile and trend snapshots; input to matching.

**Implementation status:** Implemented — [Creators API](../api/creators.md#creator-performance-score).

---

## Recommendation

**Definition:** Deterministic coaching suggestion derived from session intelligence — action type, priority, and evidence tied to triggers or session state.

**Relationships:** Generated from live session analysis; complements coach alerts; surfaced on dashboard.

**Implementation status:** Implemented — [Live Intelligence API](../api/live-intelligence.md).

---

## Coach Alert

**Definition:** Time-sensitive coaching signal during or after a live session — typed alert with severity and suggested action.

**Relationships:** Derived from session timeline and trigger analysis; consumed by creator dashboard and future real-time UI.

**Implementation status:** Implemented (API); real-time delivery UI planned.

---

## Intelligence Snapshot

**Definition:** Versioned structured output stored at generation time — session intelligence, creator intelligence profile, or live trend snapshot.

**Relationships:** Session snapshots on `LiveSession.metadata`; creator snapshots on `CreatorProfile.metadata`; replaced on regenerate ([ADR-0006](../architecture/decision-log.md#adr-0006-intelligence-snapshots)).

**Implementation status:** Implemented.

---

## Related documentation

- [Identity ERD](./identity-erd.md)
- [Recruitment CRM ERD](./recruitment-crm-erd.md)
- [Campaigns ERD](./campaigns-erd.md)
- [Live Intelligence ERD](./live-intelligence-erd.md)
- [Creator Goals ERD](./creator-goals-erd.md)

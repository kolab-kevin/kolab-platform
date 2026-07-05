# Kōlab Business Model

**Status:** Strategic reference  
**Audience:** Leadership, product, finance, investors  
**Related:** [Product Strategy](../vision/product-strategy.md) · [Master Roadmap](../roadmap/master-roadmap.md) · [Competitive Advantages](../vision/competitive-advantages.md) · [Token Economy architecture](../architecture/token-economy.md)

---

## Overview

Kōlab monetizes the **creator operating system** and **agency operating system** — not isolated feature licenses. Revenue aligns with organizations that manage creators at scale and need intelligence, compliance, and campaign execution in one auditable platform.

This document describes revenue streams and cost structure at a strategic level. It does **not** include speculative financial projections or forecast numbers.

---

## Value proposition

| Buyer          | Pays for                                       | Core outcome                                               |
| -------------- | ---------------------------------------------- | ---------------------------------------------------------- |
| **Agencies**   | Roster operations, intelligence, campaigns     | Run more creators with fewer tools and less reconciliation |
| **Creators**   | Studio access, goals, coaching (optional tier) | Clear path to better performance and earnings              |
| **Brands**     | Campaign services, marketplace (future)        | Measurable creator partnerships                            |
| **Enterprise** | SSO, compliance, dedicated support             | Deploy Kōlab at agency scale with controls                 |

---

## Revenue streams

### Agency subscriptions

Primary near-term revenue. Tiered by:

- Active creator roster size
- Enabled modules (CRM, campaigns, live intelligence, analytics)
- Seat count for managers and recruiters

Agencies pay for **organization-scoped** access to the unified platform described in the [System Map](../architecture/system-map.md).

### Creator subscriptions

Optional creator-facing tiers when **Creator Studio** and mobile apps mature. May include:

- Advanced goals and achievement history
- Extended coaching history
- Priority support

Free or agency-sponsored access remains likely for rostered creators — creator revenue is secondary to agency contracts in early phases.

### Marketplace fees

Future revenue when [Marketplace](../roadmap/master-roadmap.md#marketplace) launches:

- Listing fees or subscription for brands
- Transaction or success fees on completed campaigns
- Featured placement (transparent, auditable)

Marketplace fees depend on financial platform and trust infrastructure.

### Campaign services

Professional services and platform fees tied to [Campaign Management](../roadmap/master-roadmap.md#campaign-management):

- Managed campaign packages
- Deliverable review workflows
- Brand reporting add-ons

Distinction: **software subscription** vs **services** should remain clear in contracts.

### Enterprise licensing

Custom agreements for large agencies and multi-entity organizations:

- SSO (SAML/OIDC)
- Dedicated support and SLAs
- Audit export and data residency options
- Single-tenant deployment (future)

See [Enterprise](../roadmap/master-roadmap.md#enterprise) roadmap.

### AI premium services

Usage-based or tiered add-ons when [AI Platform](../roadmap/master-roadmap.md#ai-platform) ships:

- Manager briefing packs
- Document review assists
- Automation runs beyond base quota

AI revenue requires deterministic inputs and human approval paths ([Product Principles](../vision/product-principles.md)).

### Future token utility

Long-horizon option documented in [Token Economy architecture](../architecture/token-economy.md):

- Kōlab Credits for earn/spend on measurable platform outcomes
- Optional utility token bridge (jurisdiction-dependent)

Token utility **follows** measurement infrastructure (goals, scores, deliverables) — it does not precede it.

---

## Cost structure

### Engineering and product

Largest ongoing cost: building and maintaining the monorepo platform (API, clients, desktop, mobile, AI services). Backend-first delivery reduces rework; see [Master Roadmap](../roadmap/master-roadmap.md).

### Infrastructure

- PostgreSQL (primary datastore)
- Redis (sessions, cache, future queues)
- Object storage (documents, contracts, media)
- Compute for API, AI workloads, and future streaming

Costs scale with live event volume and stored session history — a deliberate part of the [data moat](../roadmap/master-roadmap.md#the-kōlab-data-network).

### Third-party services

- Payment processing (Financial Platform phase)
- Email and notification providers
- Optional LLM inference (AI Platform phase)
- CDN and media delivery (Live Studio phase)

### Compliance and trust

- Security reviews and dependency auditing
- Legal review for contracts, tokens, and regional expansion
- Support operations for enterprise customers

---

## Long-term sustainability

Kōlab sustains by:

1. **Land with agencies** — CRM + campaigns + compliance are daily workflows with high switching costs once data accumulates.
2. **Expand with intelligence** — Live and creator intelligence increase retention and justify tier upgrades.
3. **Monetize execution** — Marketplace and financial rails capture value from campaigns that originate on-platform.
4. **Add AI carefully** — Premium automation that saves manager time without bypassing audit or permissions.
5. **Optional token layer** — Rewards verifiable outcomes already measured by the platform.

Revenue growth should correlate with **creator success outcomes** agencies can show brands — not with speculative token appreciation.

---

## Alignment with roadmap phases

| Phase                   | Revenue relevance                               |
| ----------------------- | ----------------------------------------------- |
| Foundation–Intelligence | Agency subscriptions (core platform)            |
| Creator Studio          | Optional creator tiers; higher agency retention |
| Manager Portal          | Seat expansion; upsell analytics                |
| OBS Replacement         | Differentiation; reduces churn to point tools   |
| AI Platform             | AI premium add-ons                              |
| Marketplace             | Transaction and listing fees                    |
| Financial Platform      | Payout fees; campaign settlement                |
| Token Economy           | Credits and utility (where permitted)           |

---

## Related documentation

- [Product Strategy](../vision/product-strategy.md)
- [Master Roadmap](../roadmap/master-roadmap.md)
- [Competitive Advantages](../vision/competitive-advantages.md)
- [Token Economy product plan](../product/token-economy.md)
- [Documentation hub](../README.md)

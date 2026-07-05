# Kōlab Documentation

Central index for product, engineering, and operations documentation. For long-term strategy and delivery planning, start with the [Master Roadmap](./roadmap/master-roadmap.md).

---

## Current Platform Status

| Field                          | Value                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| **Current Platform Version**   | Creator Studio v1.0 — **Complete**                                                         |
| **Current Version**            | v0.7 — Creator Studio (shipped)                                                            |
| **Current Milestone**          | v0.8 Manager Portal — MP-01 Manager Shell (in progress)                                    |
| **Current Product Focus**      | [Manager Portal](./roadmap/master-roadmap.md#manager-portal) (v0.8)                        |
| **Current Active Development** | Manager Portal v1                                                                          |
| **Current Development Branch** | `feature/master-roadmap-update` → strategic documentation                                  |
| **Platform Maturity**          | See [Platform Maturity Dashboard](./roadmap/master-roadmap.md#platform-maturity-dashboard) |

### Operational references

| Document            | Link                                                        |
| ------------------- | ----------------------------------------------------------- |
| Decision Log        | [Architecture decision log](./architecture/decision-log.md) |
| Risk Register       | [Business risk register](./business/risk-register.md)       |
| Release Roadmap     | [Release roadmap](./roadmap/releases.md)                    |
| Traceability Matrix | [Traceability matrix](./roadmap/traceability.md)            |
| Data Dictionary     | [Data dictionary](./database/data-dictionary.md)            |
| Event Taxonomy      | [Event taxonomy](./architecture/event-taxonomy.md)          |

---

## Strategic hub

| Area             | Document                                                     | Description                                                |
| ---------------- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| **Roadmap**      | [**Master Roadmap**](./roadmap/master-roadmap.md)            | Living product roadmap — maturity, debt, research, history |
| **Vision**       | [Product Strategy](./vision/product-strategy.md)             | Mission, flywheel, five- and ten-year vision               |
| **Vision**       | [Competitive Advantages](./vision/competitive-advantages.md) | Moats and why Kōlab wins                                   |
| **Vision**       | [Product Principles](./vision/product-principles.md)         | Design and engineering principles                          |
| **Business**     | [Business Model](./business/business-model.md)               | Revenue streams and sustainability                         |
| **Business**     | [Risk Register](./business/risk-register.md)                 | Strategic and technical risk tracking                      |
| **Architecture** | [System Map](./architecture/system-map.md)                   | Platform layers and relationships                          |
| **Architecture** | [Decision Log](./architecture/decision-log.md)               | Major architectural decisions (ADR)                        |
| **Architecture** | [Creator Studio](./architecture/creator-studio.md)           | Creator portal frontend architecture                       |
| **Design**       | [Creator Studio UX](./design/creator-studio-ux.md)           | UX principles and module patterns                          |
| **Architecture** | [Event Taxonomy](./architecture/event-taxonomy.md)           | Canonical platform event classification                    |

---

## Roadmap

- [**Master Roadmap**](./roadmap/master-roadmap.md) — Platform Maturity Dashboard, flywheel, data network, technical debt, research, version history
- [Release Roadmap](./roadmap/releases.md) — v0.1 through v3.0 release sequence
- [Traceability Matrix](./roadmap/traceability.md) — Strategy-to-implementation mapping

---

## Vision

- [Product Strategy](./vision/product-strategy.md)
- [Competitive Advantages](./vision/competitive-advantages.md)
- [Product Principles](./vision/product-principles.md)

---

## Business

- [Business Model](./business/business-model.md)
- [Risk Register](./business/risk-register.md)

---

## Architecture

- [Architecture overview](./architecture/README.md)
- [System Map](./architecture/system-map.md)
- [Identity](./architecture/identity.md)
- [Recruitment CRM](./architecture/recruitment-crm.md)
- [Creator Documents & Contracts](./architecture/creator-documents-contracts.md)
- [Live Intelligence](./architecture/live-intelligence.md)
- [Creator Studio](./architecture/creator-studio.md)
- [Token Economy](./architecture/token-economy.md)
- [Decision Log](./architecture/decision-log.md)
- [Event Taxonomy](./architecture/event-taxonomy.md)

---

## Engineering

- [Coding standards](./engineering/coding-standards.md)
- [Developer workflow](./engineering/developer-workflow.md)
- [Quality gates](./engineering/quality-gates.md)
- [Testing standards](./engineering/testing-standards.md)
- [Branch strategy](./engineering/branch-strategy.md)
- [Backend standards](./engineering/backend-standards.md)
- [Frontend standards](./engineering/frontend-standards.md)

---

## API

- [API index](./api/README.md)
- [Authentication](./api/authentication.md)
- [Organizations](./api/organizations.md)
- [Recruitment CRM](./api/recruitment.md)
- [Creators](./api/creators.md)
- [Campaigns](./api/campaigns.md)
- [Live Intelligence](./api/live-intelligence.md)

---

## Database

- [Database overview](./database/README.md)
- [Data Dictionary](./database/data-dictionary.md)
- [Identity ERD](./database/identity-erd.md)
- [Recruitment CRM ERD](./database/recruitment-crm-erd.md)
- [Campaigns ERD](./database/campaigns-erd.md)
- [Live Intelligence ERD](./database/live-intelligence-erd.md)
- [Creator Goals ERD](./database/creator-goals-erd.md)

---

## Product

- [Product overview](./product/README.md)
- [Release 0.2 — Identity](./product/release-0.2.md)
- [Recruitment CRM](./product/recruitment-crm.md)
- [Creator Documents & Contracts](./product/creator-documents-contracts.md)
- [Live Intelligence](./product/live-intelligence.md)
- [Creator Studio](./product/creator-studio.md)
- [Token Economy](./product/token-economy.md)

---

## Design

- [Creator Studio UX](./design/creator-studio-ux.md)

---

## Security & operations

- [Security overview](./security/README.md)
- [Deployment](./deployment/README.md)
- [Local development runbook](./runbooks/local-development.md)
- [Incident response](./runbooks/incident-response.md)

---

## How to use this hub

1. **Planning a feature** — [Product Principles](./vision/product-principles.md) → [Master Roadmap](./roadmap/master-roadmap.md) → [Developer Workflow](./engineering/developer-workflow.md).
2. **Building Creator Studio** — [Product brief](./product/creator-studio.md) → [Architecture](./architecture/creator-studio.md) → [UX](./design/creator-studio-ux.md). _(v1.0 complete.)_
3. **Building Manager Portal** — [Master Roadmap — Manager Portal](./roadmap/master-roadmap.md#manager-portal) → [Release v0.8](./roadmap/releases.md#v08--manager-portal).
4. **Understanding the platform** — [System Map](./architecture/system-map.md) → [Architecture overview](./architecture/README.md).
5. **Shipping API work** — [API index](./api/README.md) → [Backend standards](./engineering/backend-standards.md).
6. **Strategic reviews** — [Platform Maturity Dashboard](./roadmap/master-roadmap.md#platform-maturity-dashboard) → [Business Model](./business/business-model.md).

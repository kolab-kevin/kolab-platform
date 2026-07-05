# Kōlab Risk Register

**Purpose:** Track strategic, operational, and technical risks that could affect platform delivery, compliance, or commercial outcomes. Review quarterly or when roadmap freeze triggers change.

**Related:** [Business Model](./business-model.md) · [Master Roadmap](../roadmap/master-roadmap.md) · [Decision Log](../architecture/decision-log.md) · [Release Roadmap](../roadmap/releases.md)

**Scale:** Probability and impact use `Low` · `Medium` · `High` · `Critical` (impact only).

---

## Tracking process

1. Identify risk with category, owner, and review date.
2. Document mitigation and current status.
3. Link to ADRs, roadmap phases, or external dependencies when relevant.
4. Escalate `High` probability × `High`/`Critical` impact items to leadership review.

---

## Risk register

| Risk                                           | Category   | Probability | Impact   | Owner                  | Mitigation                                                                                                                                                                   | Status     | Review Date |
| ---------------------------------------------- | ---------- | ----------- | -------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------- |
| TikTok API changes                             | Platform   | High        | High     | Platform Engineering   | Abstract platform integrations behind adapters; monitor API changelog; maintain manual ingest fallback for live events                                                       | Open       | 2026-07-15  |
| Platform policy changes                        | Compliance | Medium      | High     | Product / Legal        | Policy-bound feature flags; compliance checklist on creator onboarding; audit trail for moderation actions                                                                   | Monitoring | 2026-07-15  |
| Privacy regulations (GDPR, CCPA, etc.)         | Compliance | Medium      | Critical | Legal / Engineering    | Data minimization in [Event Taxonomy](../architecture/event-taxonomy.md); org-scoped erasure workflows; document retention ADRs before expansion                             | Open       | 2026-08-01  |
| AI cost inflation                              | Financial  | Medium      | Medium   | Engineering / Finance  | Deterministic-first intelligence ([ADR-0001](../architecture/decision-log.md#adr-0001-deterministic-before-ai)); meter premium AI via credits ledger; cache snapshots        | Monitoring | 2026-07-15  |
| Cloud cost growth                              | Financial  | Medium      | Medium   | Platform Engineering   | Query optimization debt tracked in master roadmap; rollup idempotency; horizontal scaling plan in deployment docs                                                            | Open       | 2026-07-15  |
| OBS compatibility                              | Product    | Medium      | Medium   | Live Studio            | Research OBS automation in master roadmap; phased OBS replacement; browser source SDK spike before native-only bets                                                          | Monitoring | 2026-09-01  |
| Vendor lock-in (cloud, AI, storage)            | Technical  | Low         | Medium   | Platform Engineering   | Portable Prisma/PostgreSQL; S3-compatible storage abstraction; multi-provider AI interface behind ai-services                                                                | Monitoring | 2026-08-01  |
| Database growth (live events, snapshots)       | Technical  | High        | Medium   | Platform Engineering   | Append-only partitioning strategy; rollup tables; archival policy ADR before v1.0 commercial scale                                                                           | Open       | 2026-07-15  |
| Multi-platform streaming                       | Product    | Medium      | Medium   | Live Studio            | Cross-platform streaming in research pipeline; adapter pattern per platform; do not assume single-platform APIs                                                              | Monitoring | 2026-09-01  |
| Marketplace fraud                              | Commercial | Medium      | High     | Trust & Safety         | Identity verification before payouts; escrow pattern in financial roadmap; anomaly detection on campaign deliverables                                                        | Open       | 2026-10-01  |
| Creator fraud (identity, metrics)              | Commercial | Medium      | High     | Agency Operations      | Compliance scoring on creator profiles; document verification; performance score data quality warnings                                                                       | Monitoring | 2026-08-01  |
| Enterprise security (SSO, SOC 2)               | Security   | Medium      | High     | Security / Engineering | Security headers and dependency audit in place; enterprise phase includes SSO and audit export; penetration test before v1.0                                                 | Open       | 2026-10-01  |
| International compliance (tax, labor, content) | Compliance | Low         | Critical | Legal                  | Localized compliance packs in v3.0 roadmap; no market launch without legal sign-off                                                                                          | Open       | 2026-12-01  |
| Token regulation                               | Financial  | Medium      | Critical | Legal / Executive      | [ADR-0005](../architecture/decision-log.md#adr-0005-kōlab-credits-before-token) credits-first; no transferable token without legal gate; utility tied to measurable outcomes | Monitoring | 2026-08-01  |

---

## Related documentation

- [Business Model](./business-model.md)
- [Security overview](../security/README.md)
- [Technical Debt](../roadmap/master-roadmap.md#technical-debt)
- [Roadmap Freeze Policy](../roadmap/master-roadmap.md#roadmap-freeze-policy)

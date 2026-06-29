# Architecture Decision Records (ADRs)

ADRs capture significant technical decisions — what we chose, why, and what trade-offs we accept. They provide context for future contributors and prevent re-litigating settled choices.

## When to write an ADR

Create an ADR when a decision:

- Affects multiple apps or packages in the monorepo
- Is hard to reverse (database schema, auth model, deployment topology)
- Has meaningful trade-offs (library choice, caching strategy, API design)
- Needs team alignment before implementation

Skip ADRs for routine refactors, bug fixes, or choices already covered by existing ADRs.

## Process

1. **Propose** — Copy [`template.md`](template.md) to `docs/adr/NNNN-short-title.md` using the next sequential number (e.g. `0001-monorepo-tooling.md`).
2. **Draft** — Fill in Context, Decision, and Consequences. Set status to `Proposed`.
3. **Review** — Open a PR with the ADR. Discuss in review; update the document based on feedback.
4. **Accept** — Merge the PR and change status to `Accepted`.
5. **Supersede** — When a decision changes, create a new ADR and mark the old one `Superseded by ADR-NNNN`.

## Naming and location

| Item   | Convention                                  |
| ------ | ------------------------------------------- |
| File   | `docs/adr/NNNN-kebab-case-title.md`         |
| Number | Zero-padded, sequential (`0001`, `0002`, …) |
| Title  | Short, descriptive noun phrase              |

## Status lifecycle

| Status     | Meaning                                     |
| ---------- | ------------------------------------------- |
| Proposed   | Under discussion; not yet binding           |
| Accepted   | Approved and in effect                      |
| Deprecated | No longer recommended; not yet replaced     |
| Superseded | Replaced by a newer ADR (link to successor) |

## Index

Maintain a table in this file as ADRs are added:

| ADR | Title | Status |
| --- | ----- | ------ |
| —   | —     | —      |

## References

- [Michael Nygard — Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [Engineering onboarding](../engineering/onboarding.md)
- [Architecture overview](../architecture/README.md)

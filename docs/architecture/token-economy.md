# Token Economy Architecture (Planning)

Architecture for KOLAB Credits ledger and future token layer constraints.

**Status:** Planning (no implementation)

---

## Context

KOLAB needs an internal credits system to reward users and meter premium AI features before any blockchain token is considered. The ledger must be **append-only**, **auditable**, and **organization-scoped** where applicable.

---

## Logical architecture

```text
┌─────────────────┐     ┌─────────────────────────────┐     ┌─────────────────────┐
│ @kolab/api      │────▶│  Credits module             │────▶│ PostgreSQL          │
│ Campaigns       │     │  ├─ LedgerService           │     │ CreditAccount       │
│ Recruitment     │     │  ├─ GrantsController        │     │ CreditLedgerEntry   │
│ LiveIntel       │     │  └─ BalanceController        │     └─────────────────────┘
└─────────────────┘     │         │                   │
                        │         ▼                   │
                        │  AuditService (existing)  │
                        └─────────────────────────────┘
```

Future token bridge (if approved) sits **outside** v1 API — separate service, separate legal entity consideration.

---

## Key architecture decisions

| Decision       | Choice                                    | Rationale                                         |
| -------------- | ----------------------------------------- | ------------------------------------------------- |
| Ledger pattern | Append-only double-entry style            | Balances derived from entries; no silent mutation |
| Account scope  | `ORGANIZATION`, `USER`, `CREATOR_PROFILE` | Flexible grants and spends                        |
| Currency       | Single `KOLAB_CREDIT` unit v1             | Simplicity                                        |
| Idempotency    | `idempotencyKey` on grants/spends         | Webhook and job safety                            |
| Concurrency    | Row-level lock on account                 | Prevent negative balance races                    |
| Token          | Not in v1 schema                          | Credits-only until legal gate                     |
| Transfer       | No peer transfer v1                       | Reduces money transmission risk                   |

---

## Account model (planned)

### `CreditAccount`

| Field                   | Description                                     |
| ----------------------- | ----------------------------------------------- |
| `id`                    | Primary key                                     |
| `organizationId`        | Required for org-scoped accounts                |
| `accountType`           | `ORG_POOL`, `USER`, `CREATOR_PROFILE`, `SYSTEM` |
| `ownerUserId`           | Nullable                                        |
| `ownerCreatorProfileId` | Nullable                                        |
| `balance`               | Denormalized cache; reconciled from ledger      |
| `currency`              | `KOLAB_CREDIT`                                  |
| `status`                | `ACTIVE`, `FROZEN`, `CLOSED`                    |

Unique constraints per account type (e.g. one `ORG_POOL` per organization).

---

## Ledger entries (planned)

### `CreditLedgerEntry`

Append-only. **No updates or deletes** except compliance reversal entries.

| Field             | Description                                                           |
| ----------------- | --------------------------------------------------------------------- |
| `id`              | Primary key                                                           |
| `organizationId`  | Scope                                                                 |
| `accountId`       | Target account                                                        |
| `entryType`       | `GRANT`, `SPEND`, `REVERSAL`, `ADJUSTMENT`                            |
| `amount`          | Positive integer credits                                              |
| `direction`       | `CREDIT` or `DEBIT`                                                   |
| `balanceAfter`    | Snapshot after entry                                                  |
| `sourceType`      | `CAMPAIGN`, `RECRUITMENT`, `LIVE_COACH`, `ADMIN_GRANT`, `PROMO`, etc. |
| `sourceId`        | FK to originating entity                                              |
| `idempotencyKey`  | Unique per org                                                        |
| `description`     | Human-readable                                                        |
| `metadata`        | JSON                                                                  |
| `createdByUserId` | Actor                                                                 |
| `createdAt`       | Timestamp                                                             |

### Balance rules

- `SPEND` rejected if `balance < amount` (unless org overdraft policy — default deny)
- `GRANT` always allowed for authorized roles
- `REVERSAL` references original entry ID
- Nightly reconciliation job compares `balance` to sum of entries

---

## Integration points

| Module                | Integration                                               |
| --------------------- | --------------------------------------------------------- |
| **Campaigns**         | Auto-grant on deliverable approval (future)               |
| **Recruitment**       | Grant on lead conversion                                  |
| **Live Intelligence** | Debit on coach session start / summary generate           |
| **Agency billing**    | Credits as discount instrument (future)                   |
| **Audit**             | `credit.granted`, `credit.spent`, `credit.account.viewed` |

### Live Intelligence debit flow

```text
1. Client POST /live/sessions/:id/coach/start
2. CreditsService.reserve(account, estimatedCost, idempotencyKey)
3. Coach session runs
4. CreditsService.finalize(actualCost) or release reservation
5. Audit log + ledger entry
```

---

## Permissions (planned)

| Permission      | Action                       |
| --------------- | ---------------------------- |
| `credits:read`  | View own or org balances     |
| `credits:grant` | Issue grants from org pool   |
| `credits:admin` | Adjustments, freeze accounts |
| `credits:spend` | System service accounts only |

Org admins grant from org pool. Creators spend on own account. System jobs use service identity.

---

## Anti-fraud controls

| Control           | Implementation                        |
| ----------------- | ------------------------------------- |
| Rate limits       | Max grants per admin per day          |
| Idempotency       | Prevent double webhook grants         |
| Anomaly detection | Spike alerts on grant volume (future) |
| Frozen accounts   | Stop spend/grant on fraud flag        |
| Audit             | All admin adjustments logged          |

---

## Token conversion strategy (future — not implemented)

If legal approves a token phase:

1. **Snapshot** — Credits balances at announced cutoff (not retroactive promises)
2. **Conversion ratio** — Fixed utility mapping, not USD peg
3. **Opt-in** — Users claim token; unclaimed credits remain credits
4. **Separate wallet** — On-chain custody user-controlled
5. **No automatic conversion** — Explicit user action required

Until then, **no schema fields** reference token contract addresses.

---

## Privacy and compliance

| Topic         | Approach                                                    |
| ------------- | ----------------------------------------------------------- |
| PII in ledger | Minimize; use account IDs                                   |
| Export        | Org admin export for accounting                             |
| Deletion      | Close account; retain ledger for legal hold period          |
| Tax           | Credits are not tax advice; org responsible for local rules |
| Securities    | Legal review before any tradable token                      |

---

## Recommended implementation order

1. `CreditAccount` + `CreditLedgerEntry` schema
2. Balance read API
3. Admin grant API
4. Spend hook for Live Intelligence
5. Campaign/recruitment grant rules
6. Reconciliation job
7. Token feasibility (go/no-go document only)

---

## Related docs

- [Product — Token economy](../product/token-economy.md)
- [Live Intelligence architecture](./live-intelligence.md)

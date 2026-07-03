# KOLAB Credits & Token Economy (Planning)

**Status:** Planning  
**Target:** Credits in Release 0.5+; token layer deferred indefinitely until legal/product gates met  
**Branch:** `feature/live-intelligence-planning`

---

## Goal

Plan an internal **KOLAB Credits** ledger for rewarding creators, recruiters, and agencies — and gating premium AI features (Live Intelligence coach, advanced analytics) — **before** any blockchain token launch.

**Tokens are not in scope for initial delivery.** This document defines credits-first economics and the requirements that must be satisfied before a token is considered.

---

## Product principles

| Principle            | Rule                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------- |
| Credits first        | All v1 rewards and premium features use non-transferable org-scoped credits                  |
| No speculation v1    | No public trading, no liquidity pools, no token sales in planning phase                      |
| Utility before token | Token launch requires proven credits utility and legal clearance                             |
| Anti-rug-pull        | No promises of financial return; no creator "investment" framing                             |
| Transparency         | Ledger is auditable; balances reconcile to append-only entries                               |
| Agency control       | Org admins allocate credits to roster; system admin does not mint arbitrarily without policy |

---

## KOLAB Credits (v1)

### What credits are

- **Internal accounting units** scoped to an organization (or platform-wide grants from KOLAB ops)
- **Non-transferable** between organizations in v1
- **Not cash** — no guaranteed fiat redemption
- Used for **feature access** and **recognition rewards**

### What credits are not

- Securities or investment products
- Withdrawable cash balances
- Platform gift diamonds or TikTok currency
- Crypto tokens (until a future, separately governed phase)

---

## Credit use cases (planned)

| Use case            | Description                                                     |
| ------------------- | --------------------------------------------------------------- |
| Creator rewards     | Bonus credits for campaign completion, live milestones          |
| Recruiter rewards   | Credits for lead conversion, roster growth KPIs                 |
| Campaign bonuses    | Agency-funded pools distributed on campaign success             |
| Coaching credits    | Spend on Live Intelligence real-time coach sessions             |
| Premium AI features | Post-live deep analysis, gifter cluster reports                 |
| Agency discounts    | Credits offset future KOLAB subscription tiers (future billing) |
| Staking (future)    | **Deferred** — requires token phase + legal review              |

---

## Earning credits (planned)

| Source                 | Trigger                                                     |
| ---------------------- | ----------------------------------------------------------- |
| Campaign completion    | Creator fulfills deliverables — linked to `Campaign` module |
| Live milestones        | Session gift targets met (informational; correlational)     |
| Recruitment conversion | Lead → signed creator                                       |
| Agency grant           | ORG_ADMIN allocates from org pool                           |
| Platform promotion     | KOLAB ops promotional grants (audited)                      |
| Referral (future)      | Controlled invite rewards                                   |

All grants create **ledger entries** — balances are never updated without a corresponding entry.

---

## Spending credits (planned)

| Feature                   | Cost model (TBD)                    |
| ------------------------- | ----------------------------------- |
| Real-time AI coach        | Per session or per alert batch      |
| Deep post-live analysis   | Per session                         |
| Gifter cluster export     | Per report                          |
| Advanced agency analytics | Monthly org subscription equivalent |

Insufficient balance → `402`-style API response with clear messaging (implementation later).

---

## Token layer (deferred)

A future **KOLAB Token** is **not planned for implementation** in this milestone. Before any token discussion:

### Utility requirements

- [ ] Credits economy active ≥ 6 months with measurable usage
- [ ] Premium AI features demonstrate paid-equivalent value via credits
- [ ] Legal opinion on jurisdiction-specific classification (US, EU, SG, etc.)
- [ ] No pay-to-earn or guaranteed yield messaging
- [ ] Documented utility-only use cases (access, discounts, governance optional)

### Anti-rug-pull commitments (if token ever launches)

- No anonymous team withdrawal of liquidity
- Vesting schedules for any team allocation
- Public utility roadmap tied to product features, not price
- Independent audit of smart contracts (if on-chain)
- Clear separation: platform gifts ≠ KOLAB token

### Regulatory caution

- Treat token planning as **high risk** — require executive and legal sign-off
- Banned in planning docs: ROI promises, "moon", investment language
- KOLAB Credits remain the customer-facing reward layer even after token exists

---

## User stories

### Creator

- As a **creator**, I can see my credit balance and history so I understand rewards earned.
- As a **creator**, I can spend credits on a post-live deep analysis so I get extra coaching without a separate subscription.

### Agency admin

- As an **ORG_ADMIN**, I can grant credits to creators on my roster for campaign bonuses.
- As an **ORG_ADMIN**, I can set org policies for automatic credit grants on recruitment conversion.

### Platform ops

- As **KOLAB ops**, I can issue promotional credit grants with full audit trail.

---

## Relationship to Live Intelligence

Live Intelligence premium features (real-time coach, advanced trigger analytics) are primary **credit consumers**. Basic post-live summary may remain included in agency subscription tier.

See [Token economy architecture](../architecture/token-economy.md) for ledger design.

---

## Recommended phases

| Phase | Milestone                          |
| ----- | ---------------------------------- |
| 1     | Credits ledger schema + API        |
| 2     | Manual agency grants               |
| 3     | Campaign/recruitment auto-grants   |
| 4     | Live Intelligence credit pricing   |
| 5     | Billing integration (optional)     |
| 6     | Token feasibility study (go/no-go) |
| 7     | Token implementation (only if go)  |

---

## Related docs

- [Token economy architecture](../architecture/token-economy.md)
- [Live Intelligence (product)](./live-intelligence.md)

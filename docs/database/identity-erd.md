# Identity Data Model (Release 0.2)

**Status:** Implemented in `feature/identity-schema` (M1 — Schema)  
Prisma schema: `packages/database/prisma/schema.prisma`

---

## Overview

Release 0.2 introduces organization-scoped identity while retaining Phase 1 `User` and `RefreshToken` tables during migration Phase A. Legacy `User.role` and `User.platforms` remain until a later cleanup PR.

---

## Entity relationship diagram

```mermaid
erDiagram
  User ||--o| UserProfile : has
  User ||--o{ OrganizationMembership : has
  User ||--o{ RefreshToken : has
  User ||--o{ Session : has
  User ||--o{ AuditLog : "actor"
  User ||--o{ Invitation : "invited by"

  Organization ||--o{ OrganizationMembership : has
  Organization ||--o{ Invitation : sends
  Organization ||--o{ AuditLog : scoped
  Organization ||--o{ Session : "active org"

  OrganizationMembership }o--|| Organization : belongs
  OrganizationMembership }o--|| User : member

  Invitation }o--|| Organization : for

  Session ||--o{ RefreshToken : issues
  Session }o--|| User : owner
  Session }o--o| Organization : "active org"

  User {
    string id PK
    string email UK
    string passwordHash
    boolean isSystemAdmin
    enum role "legacy Phase 1"
    enum platforms "legacy Phase 1"
    datetime createdAt
    datetime updatedAt
  }

  UserProfile {
    string userId PK_FK
    string displayName
    string avatarUrl
    string bio
    string language
    string timezone
    string country
  }

  Organization {
    string id PK
    string name
    string slug UK
    enum type
    enum status
    json settings
    datetime createdAt
    datetime updatedAt
  }

  OrganizationMembership {
    string organizationId PK_FK
    string userId PK_FK
    enum role
    enum status
    string invitedBy FK
    datetime joinedAt
  }

  Invitation {
    string id PK
    string organizationId FK
    string email
    enum role
    string tokenHash UK
    datetime expiresAt
    datetime acceptedAt
    string invitedBy FK
  }

  Session {
    string id PK
    string userId FK
    string organizationId FK
    string refreshTokenHash UK
    string ipAddress
    string userAgent
    datetime expiresAt
    datetime revokedAt
  }

  RefreshToken {
    string id PK
    string tokenHash UK
    string userId FK
    string sessionId FK "nullable Phase A"
    datetime expiresAt
    datetime createdAt
  }

  AuditLog {
    string id PK
    string organizationId FK "nullable"
    string actorUserId FK "nullable"
    string targetType
    string targetId
    string action
    json metadata
    datetime createdAt
  }
```

---

## Entities

### User (evolved from Phase 1)

| Field                     | Type     | Notes                                 |
| ------------------------- | -------- | ------------------------------------- |
| `id`                      | cuid     | Primary key                           |
| `email`                   | string   | Unique, normalized lowercase          |
| `passwordHash`            | string   | bcrypt                                |
| `isSystemAdmin`           | boolean  | Platform `SYSTEM_ADMIN` capability    |
| `role`                    | enum     | **Legacy** — dual-write Phase A       |
| `platforms`               | enum[]   | **Legacy** — deferred to org settings |
| `createdAt` / `updatedAt` | datetime | Audit                                 |

### UserProfile

One-to-one with User (`userId` primary key). Separates PII/display fields from credentials.

| Field      | Default | Notes                       |
| ---------- | ------- | --------------------------- |
| `language` | `en`    | Replaces planned `locale`   |
| `timezone` | `UTC`   | IANA timezone string        |
| `bio`      | null    | Optional short bio          |
| `country`  | null    | ISO country code (optional) |

### Organization

Top-level tenant. Settings stored inline as JSON on the organization row (not a separate `OrganizationSettings` table).

| Field      | Notes                                                     |
| ---------- | --------------------------------------------------------- |
| `slug`     | Unique, kebab-case, used in URLs                          |
| `type`     | `STANDARD`, `AGENCY`, `CREATOR`, `MERCHANT`, `ENTERPRISE` |
| `status`   | `ACTIVE`, `SUSPENDED`, `ARCHIVED`                         |
| `settings` | JSON — vertical flags, branding placeholders, etc.        |

### OrganizationMembership

Composite primary key `(organizationId, userId)`.

| Field       | Notes                            |
| ----------- | -------------------------------- |
| `role`      | `OrganizationRole` enum          |
| `status`    | `ACTIVE`, `SUSPENDED`, `REMOVED` |
| `invitedBy` | Optional FK to inviting user     |
| `joinedAt`  | Membership start timestamp       |

### Invitation

Pending membership by email. Token stored as hash only. Pending state inferred when `acceptedAt` is null.

### Session

Durable session record with optional org context. `refreshTokenHash` supports session-bound refresh lookup; Phase 1 auth continues via `RefreshToken.userId` until API migration.

### RefreshToken

Unchanged Phase 1 columns plus optional `sessionId` FK. Existing auth service uses `tokenHash` + `userId` without requiring a session row.

### AuditLog

Append-only. `organizationId` and `actorUserId` nullable for platform-level events. Uses `targetType` / `targetId` (not `resourceType` / `resourceId`).

---

## Indexes

| Table                      | Index                              | Purpose           |
| -------------------------- | ---------------------------------- | ----------------- |
| `organization_memberships` | `(organizationId, userId)` PK      | Membership lookup |
| `organization_memberships` | `(userId)`                         | User's org list   |
| `organization_memberships` | `(organizationId, status)`         | Active members    |
| `invitations`              | `(organizationId, email)`          | Pending invites   |
| `invitations`              | `(expiresAt)`                      | Expiry sweeps     |
| `sessions`                 | `(userId, revokedAt)`              | Active sessions   |
| `sessions`                 | `(refreshTokenHash)` unique        | Token lookup      |
| `audit_logs`               | `(organizationId, createdAt DESC)` | Admin audit UI    |
| `audit_logs`               | `(targetType, targetId)`           | Entity history    |
| `organizations`            | `(slug)` unique                    | Slug routing      |

---

## Enums

### OrganizationType

`STANDARD`, `AGENCY`, `CREATOR`, `MERCHANT`, `ENTERPRISE`

### OrganizationRole

`ORG_OWNER`, `ORG_ADMIN`, `AGENCY_MANAGER`, `RECRUITER`, `CREATOR`, `MODERATOR`, `FINANCE`, `SUPPORT`, `VIEWER`

### OrganizationStatus

`ACTIVE`, `SUSPENDED`, `ARCHIVED`

### MembershipStatus

`ACTIVE`, `SUSPENDED`, `REMOVED`

---

## Cascade rules

| Relation                          | onDelete | Rationale                          |
| --------------------------------- | -------- | ---------------------------------- |
| UserProfile → User                | Cascade  | Profile is owned by user           |
| OrganizationMembership → User/Org | Cascade  | Membership tied to both entities   |
| Session → User                    | Cascade  | Sessions belong to user            |
| Session → Organization            | SetNull  | Preserve session if org removed    |
| RefreshToken → User               | Cascade  | Phase 1 behavior preserved         |
| RefreshToken → Session            | Cascade  | Invalidate token when session gone |
| Invitation → Organization         | Cascade  | Invites scoped to org              |
| Invitation → inviter              | Restrict | Preserve invite audit trail        |
| AuditLog → Organization/Actor     | SetNull  | Append-only retention              |

---

## Migration from Phase 1 (summary)

Detailed steps in [Release 0.2 migration plan](../releases/release-0.2.md#migration-plan).

| Phase 1                | Release 0.2                                   |
| ---------------------- | --------------------------------------------- |
| `User.role`            | `OrganizationMembership.role` (dual-write)    |
| `User.platforms[]`     | Deferred to `Organization.settings` JSON      |
| `SUPER_ADMIN`          | `User.isSystemAdmin` + `ORG_OWNER` membership |
| `RefreshToken.userId`  | Optional `RefreshToken.sessionId` → Session   |
| Single implicit tenant | Default org `kolab-dev` + membership per user |

**Migration `20250628140000_identity_schema`:**

1. Adds new tables and enums
2. Adds `User.isSystemAdmin` and `RefreshToken.sessionId`
3. Creates default org `KOLAB Dev` (`kolab-dev`)
4. Backfills `UserProfile` and `OrganizationMembership` for existing users
5. Maps legacy `Role` → `OrganizationRole`

---

## Non-goals (schema)

- Row-level security in PostgreSQL (application-layer scoping in 0.2)
- Partitioned audit tables (consider at scale)
- Soft-delete on User (use membership status instead)
- Dropping Phase 1 `Role` / `Platform` columns (Phase D cleanup)

---

## Related documents

- [Identity architecture](../architecture/identity.md)
- [Database README](./README.md)
- [Release 0.2 execution plan](../releases/release-0.2.md)

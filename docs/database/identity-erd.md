# Identity Data Model (Release 0.2)

**Status:** Planning — describes intended schema. **Do not treat as implemented.**  
Prisma changes happen in implementation PRs after approval.

---

## Overview

Release 0.2 introduces organization-scoped identity while retaining Phase 1 `User` and `RefreshToken` concepts. The ERD below is the **target** model.

---

## Entity relationship diagram

```mermaid
erDiagram
  User ||--o| UserProfile : has
  User ||--o{ OrganizationMembership : has
  User ||--o{ RefreshToken : has
  User ||--o{ Session : has
  User ||--o{ AuditLog : "actor"

  Organization ||--o{ OrganizationMembership : has
  Organization ||--o{ Invitation : sends
  Organization ||--o{ AuditLog : scoped
  Organization ||--o{ OrganizationSettings : has

  OrganizationMembership }o--|| Organization : belongs
  OrganizationMembership }o--|| User : member

  Invitation }o--|| Organization : for
  Invitation }o--o| User : "accepted by"

  Session ||--o{ RefreshToken : issues
  Session }o--|| User : owner
  Session }o--o| Organization : "active org"

  User {
    string id PK
    string email UK
    string passwordHash
    boolean isSystemAdmin
    datetime createdAt
    datetime updatedAt
  }

  UserProfile {
    string id PK
    string userId FK UK
    string displayName
    string avatarUrl
    string locale
    string timezone
  }

  Organization {
    string id PK
    string name
    string slug UK
    enum status
    datetime createdAt
    datetime updatedAt
  }

  OrganizationSettings {
    string id PK
    string organizationId FK UK
    json settings
  }

  OrganizationMembership {
    string id PK
    string organizationId FK
    string userId FK
    enum role
    enum status
    datetime joinedAt
  }

  Invitation {
    string id PK
    string organizationId FK
    string email
    enum role
    string tokenHash UK
    enum status
    datetime expiresAt
    datetime acceptedAt
    string invitedByUserId FK
  }

  Session {
    string id PK
    string userId FK
    string organizationId FK
    string userAgent
    string ipAddress
    datetime lastActiveAt
    datetime revokedAt
  }

  RefreshToken {
    string id PK
    string sessionId FK
    string tokenHash UK
    datetime expiresAt
  }

  AuditLog {
    string id PK
    string organizationId FK
    string actorUserId FK
    string action
    string resourceType
    string resourceId
    json metadata
    string requestId
    datetime createdAt
  }
```

---

## Entities

### User (evolved from Phase 1)

| Field                     | Type     | Notes                              |
| ------------------------- | -------- | ---------------------------------- |
| `id`                      | cuid     | Primary key                        |
| `email`                   | string   | Unique, normalized lowercase       |
| `passwordHash`            | string   | bcrypt                             |
| `isSystemAdmin`           | boolean  | Platform `SYSTEM_ADMIN` capability |
| `createdAt` / `updatedAt` | datetime | Audit                              |

**Removed in 0.2:** global `role`, `platforms[]` on User — moved to membership / future product modules.

### UserProfile

One-to-one with User. Separates PII/display fields from credentials.

### Organization

Top-level tenant. All org-scoped resources reference `organizationId`.

| Field    | Notes                             |
| -------- | --------------------------------- |
| `slug`   | Unique, kebab-case, used in URLs  |
| `status` | `ACTIVE`, `SUSPENDED`, `ARCHIVED` |

### OrganizationMembership

| Field    | Notes                                   |
| -------- | --------------------------------------- |
| `role`   | Release 0.2 role enum (see product doc) |
| `status` | `ACTIVE`, `SUSPENDED`, `REMOVED`        |
| Unique   | `(organizationId, userId)`              |

### Invitation

Pending membership by email. Token stored as hash only.

### Session

Replaces implicit session from Phase 1 refresh-only model. Links active org context.

### RefreshToken

Evolved to reference `sessionId` instead of only `userId` (migration maps existing rows).

### AuditLog

Append-only. `organizationId` nullable for platform-level events.

---

## Indexes (planned)

| Table                      | Index                              | Purpose           |
| -------------------------- | ---------------------------------- | ----------------- |
| `organization_memberships` | `(organizationId, userId)` unique  | Membership lookup |
| `organization_memberships` | `(userId)`                         | User's org list   |
| `invitations`              | `(organizationId, email, status)`  | Pending invites   |
| `sessions`                 | `(userId, revokedAt)`              | Active sessions   |
| `audit_logs`               | `(organizationId, createdAt DESC)` | Admin audit UI    |
| `organizations`            | `(slug)` unique                    | Slug routing      |

---

## Enums (planned)

### OrganizationRole

`ORG_OWNER`, `ORG_ADMIN`, `AGENCY_MANAGER`, `RECRUITER`, `CREATOR`, `MODERATOR`, `FINANCE`, `SUPPORT`, `VIEWER`

### OrganizationStatus

`ACTIVE`, `SUSPENDED`, `ARCHIVED`

### MembershipStatus

`ACTIVE`, `SUSPENDED`, `REMOVED`

### InvitationStatus

`PENDING`, `ACCEPTED`, `REVOKED`, `EXPIRED`

---

## Migration from Phase 1 (summary)

Detailed steps in [Release 0.2 migration plan](../releases/release-0.2.md#migration-plan).

| Phase 1                | Release 0.2                                    |
| ---------------------- | ---------------------------------------------- |
| `User.role`            | `OrganizationMembership.role`                  |
| `User.platforms[]`     | Deferred to vertical modules / org settings    |
| `SUPER_ADMIN`          | `User.isSystemAdmin` + optional platform audit |
| `RefreshToken.userId`  | `RefreshToken.sessionId` → Session.userId      |
| Single implicit tenant | Default org per user + membership              |

**Data migration (high level):**

1. Create default organization per existing user (or one platform org — _open decision_)
2. Map `Role` → `OrganizationRole` via lookup table
3. Backfill `Session` from active refresh tokens
4. Drop deprecated columns after dual-write period

---

## Non-goals (schema)

- Row-level security in PostgreSQL (application-layer scoping in 0.2)
- Partitioned audit tables (consider at scale)
- Soft-delete on User (use membership status instead)

---

## Related documents

- [Identity architecture](../architecture/identity.md)
- [Database README](./README.md)
- [Release 0.2 execution plan](../releases/release-0.2.md)

# Authentication & Identity API (Release 0.2)

**Status:** Planning — contract specification for implementation.  
**Base URL (local):** <http://localhost:4000>  
**OpenAPI:** Extends existing Swagger at `/api/docs` after implementation.

---

## Conventions

| Item           | Value                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------- |
| Prefix         | `/api`                                                                                              |
| Auth header    | `Authorization: Bearer <accessToken>`                                                               |
| Refresh cookie | `kolab_refresh_token` (httpOnly, Secure in prod, SameSite=Lax)                                      |
| Org context    | `X-Organization-Id: <orgId>` (optional; JWT default used if omitted)                                |
| Request ID     | `X-Request-Id` echoed from `@kolab/observability`                                                   |
| Errors         | `{ "statusCode", "message", "error" }` (NestJS standard) + validation `{ "issues": [...] }` for Zod |

---

## JWT access token claims (Release 0.2)

| Claim              | Type    | Description                                 |
| ------------------ | ------- | ------------------------------------------- |
| `sub`              | string  | User id                                     |
| `email`            | string  | User email                                  |
| `organizationId`   | string  | Active organization id (optional)           |
| `organizationRole` | string  | Role in active org (optional)               |
| `sessionId`        | string  | Session id for revocation checks (optional) |
| `isSystemAdmin`    | boolean | Platform admin flag                         |
| `role`             | string  | Phase 1 legacy role (dual-write)            |
| `iat` / `exp`      | number  | Standard JWT timestamps                     |

**Backward compatibility:** Phase 1 tokens with only `role` continue to verify. Organization claims are optional until clients migrate.

---

## Authentication endpoints

### POST `/api/auth/register`

Create user account. **Behavior change in 0.2:** creates User, UserProfile, default Organization, and ORG_OWNER membership (_pending open decision on default org policy_).

#### Register request

```json
{
  "email": "owner@example.com",
  "password": "SecurePass1",
  "organizationName": "Acme Agency"
}
```

#### Register response (201)

```json
{
  "user": {
    "id": "clx...",
    "email": "owner@example.com",
    "profile": { "displayName": null, "avatarUrl": null, "locale": "en", "timezone": "UTC" }
  },
  "organization": { "id": "clx...", "name": "Acme Agency", "slug": "acme-agency" },
  "membership": { "role": "ORG_OWNER", "status": "ACTIVE" },
  "accessToken": "eyJ...",
  "expiresIn": 900
}
```

**Cookies:** `Set-Cookie: kolab_refresh_token=...`

---

### POST `/api/auth/login`

#### Login request

```json
{
  "email": "user@example.com",
  "password": "SecurePass1",
  "organizationId": "clx..."
}
```

`organizationId` optional if user has one membership; required if multiple.

**Response `200`:** Same shape as register (without org creation).

**Errors:** `401` invalid credentials; `403` no membership in org; `422` validation.

---

### POST `/api/auth/refresh`

Unchanged transport. **Response adds** org claims in new access token. Rotates refresh token; ties to `sessionId`.

---

### POST `/api/auth/logout`

Revokes current session + refresh token. Requires Bearer + refresh cookie.

---

### GET `/api/auth/me`

**Response `200`**

```json
{
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "isSystemAdmin": false,
    "profile": {
      "displayName": "Jane",
      "avatarUrl": null,
      "locale": "en",
      "timezone": "America/New_York"
    },
    "createdAt": "2026-01-15T12:00:00.000Z"
  },
  "organization": { "id": "clx...", "name": "Acme Agency", "slug": "acme-agency" },
  "membership": { "role": "ORG_ADMIN", "status": "ACTIVE" },
  "permissions": ["org:read", "org:update", "members:invite", "audit:read"],
  "memberships": [
    { "organizationId": "clx...", "organizationName": "Acme Agency", "role": "ORG_ADMIN" }
  ]
}
```

---

## Organization endpoints

**Release 0.2 (implemented):** See [Organization API](./organizations.md) for `/api/organizations/*` endpoints (current org, list, switch, members).

Legacy planning paths below remain for future org CRUD work:

| Method | Path                        | Permission    | Description               |
| ------ | --------------------------- | ------------- | ------------------------- |
| GET    | `/api/orgs`                 | authenticated | List user's organizations |
| GET    | `/api/orgs/:orgId`          | `org:read`    | Organization detail       |
| PATCH  | `/api/orgs/:orgId`          | `org:update`  | Update name, settings     |
| GET    | `/api/orgs/:orgId/settings` | `org:read`    | Organization settings     |
| PATCH  | `/api/orgs/:orgId/settings` | `org:update`  | Update settings JSON      |

**PATCH `/api/orgs/:orgId` request**

```json
{
  "name": "Acme Agency Ltd",
  "timezone": "America/New_York"
}
```

---

## Membership & user management

| Method | Path                               | Permission            | Description           |
| ------ | ---------------------------------- | --------------------- | --------------------- |
| GET    | `/api/orgs/:orgId/members`         | `members:read`        | Paginated member list |
| PATCH  | `/api/orgs/:orgId/members/:userId` | `members:update_role` | Change role           |
| DELETE | `/api/orgs/:orgId/members/:userId` | `members:remove`      | Remove member         |
| GET    | `/api/orgs/:orgId/members/:userId` | `members:read`        | Member detail         |

### PATCH member request

```json
{
  "role": "RECRUITER"
}
```

**Rules:**

- Cannot remove sole `ORG_OWNER` without ownership transfer
- Cannot escalate to `ORG_OWNER` without existing owner action
- `SYSTEM_ADMIN` bypass via separate platform routes

---

## Invitations

| Method | Path                               | Permission       | Description       |
| ------ | ---------------------------------- | ---------------- | ----------------- |
| POST   | `/api/orgs/:orgId/invitations`     | `members:invite` | Create invitation |
| GET    | `/api/orgs/:orgId/invitations`     | `members:invite` | List pending      |
| DELETE | `/api/orgs/:orgId/invitations/:id` | `members:invite` | Revoke invitation |
| POST   | `/api/invitations/accept`          | public (token)   | Accept invite     |

### Create invitation request

```json
{
  "email": "newmember@example.com",
  "role": "CREATOR"
}
```

**POST invitation response `201`**

```json
{
  "id": "clx...",
  "email": "newmember@example.com",
  "role": "CREATOR",
  "status": "PENDING",
  "expiresAt": "2026-07-06T12:00:00.000Z",
  "acceptUrl": "https://app.example.com/accept?token=..."
}
```

### Accept invitation request

```json
{
  "token": "raw-token-from-url",
  "password": "SecurePass1",
  "displayName": "Alex Creator"
}
```

If user exists, `password` omitted; link membership only.

---

## Profile

| Method | Path                    | Auth   | Description                                     |
| ------ | ----------------------- | ------ | ----------------------------------------------- |
| GET    | `/api/users/me/profile` | Bearer | Get own profile                                 |
| PATCH  | `/api/users/me/profile` | Bearer | Update displayName, avatarUrl, locale, timezone |

---

## Sessions

| Method | Path                                        | Permission        | Description                  |
| ------ | ------------------------------------------- | ----------------- | ---------------------------- |
| GET    | `/api/users/me/sessions`                    | authenticated     | List active sessions         |
| DELETE | `/api/users/me/sessions/:sessionId`         | authenticated     | Revoke one session           |
| DELETE | `/api/users/me/sessions`                    | authenticated     | Revoke all except current    |
| DELETE | `/api/orgs/:orgId/members/:userId/sessions` | `sessions:revoke` | Admin revoke member sessions |

---

## Audit logs

| Method | Path                          | Permission   | Description         |
| ------ | ----------------------------- | ------------ | ------------------- |
| GET    | `/api/orgs/:orgId/audit-logs` | `audit:read` | Paginated audit log |

**Query params:** `cursor`, `limit` (max 100), `action`, `actorUserId`, `from`, `to`

### Audit log response item

```json
{
  "id": "clx...",
  "action": "membership.role_changed",
  "actorUserId": "clx...",
  "resourceType": "membership",
  "resourceId": "clx...",
  "metadata": { "previousRole": "VIEWER", "newRole": "RECRUITER" },
  "requestId": "req_abc",
  "createdAt": "2026-06-28T10:00:00.000Z"
}
```

---

## Platform admin (SYSTEM_ADMIN)

| Method | Path                                     | Description               |
| ------ | ---------------------------------------- | ------------------------- |
| GET    | `/api/admin/organizations`               | List all orgs             |
| PATCH  | `/api/admin/organizations/:orgId/status` | Suspend / activate org    |
| GET    | `/api/admin/users`                       | Search users              |
| PATCH  | `/api/admin/users/:userId/system-admin`  | Grant/revoke system admin |

Guarded by `isSystemAdmin` — not org-scoped.

---

## Auth flow summary

```text
Register/Login → Session + RefreshToken → JWT (orgId, orgRole, sessionId)
       ↓
Org-scoped API → OrgMembershipGuard → PermissionsGuard
       ↓
Refresh → rotate token, validate session not revoked
       ↓
Logout → revoke session + refresh
```

---

## Phase 1 compatibility

| Phase 1 endpoint          | Release 0.2                                                                  |
| ------------------------- | ---------------------------------------------------------------------------- |
| `POST /api/auth/register` | Extended body; creates org                                                   |
| `POST /api/auth/login`    | Optional `organizationId`                                                    |
| `GET /api/auth/me`        | Extended response                                                            |
| Role in JWT               | Legacy `role` retained; org context in `organizationId` + `organizationRole` |

Deprecated: global `role` and `platforms` in `@kolab/types` user profile (removed after migration).

---

## Related documents

- [Identity architecture](../architecture/identity.md)
- [Identity ERD](../database/identity-erd.md)
- [API overview](./README.md)
- [Release 0.2 execution plan](../releases/release-0.2.md)

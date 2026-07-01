# System Administration API (Release 0.2)

**Status:** Implemented in `@kolab/api`  
**Base path:** `/api/admin`  
**Auth:** Bearer JWT with `isSystemAdmin: true`

Platform-wide administration endpoints for system administrators. These routes are not organization-scoped.

---

## Endpoints

| Method | Path                       | Description                                     |
| ------ | -------------------------- | ----------------------------------------------- |
| GET    | `/api/admin/dashboard`     | Platform statistics                             |
| GET    | `/api/admin/users`         | Paginated user list                             |
| GET    | `/api/admin/users/:id`     | User detail with profile, memberships, sessions |
| PATCH  | `/api/admin/users/:id`     | Update user role or system admin flag           |
| GET    | `/api/admin/organizations` | Paginated organization list                     |

All routes require JWT authentication and `isSystemAdmin === true`. Non-admin users receive `403 Forbidden`.

---

## GET `/api/admin/users`

### List users query params

| Param            | Type   | Description                             |
| ---------------- | ------ | --------------------------------------- |
| `cursor`         | string | Pagination cursor (user id)             |
| `limit`          | number | Page size (default 20, max 100)         |
| `search`         | string | Match email or profile display name     |
| `role`           | string | Filter by legacy user role              |
| `organizationId` | string | Filter users with membership in the org |

### List users response (200)

```json
{
  "items": [
    {
      "id": "clx...",
      "email": "user@example.com",
      "role": "USER",
      "isSystemAdmin": false,
      "createdAt": "2026-06-28T10:00:00.000Z",
      "organizationCount": 2,
      "activeSessionCount": 1
    }
  ],
  "nextCursor": "clx..."
}
```

---

## GET `/api/admin/users/:id`

Returns user account info, profile fields, organization memberships, and active sessions.

Never returns `passwordHash`, `refreshTokenHash`, or invitation tokens.

---

## PATCH `/api/admin/users/:id`

Updates the authenticated platform user's role and/or system admin flag. Email and password cannot be changed.

### Update user request

```json
{
  "role": "ADMIN",
  "isSystemAdmin": true
}
```

At least one field is required.

Writes audit event `admin.user.updated` at platform scope (`organizationId: null`).

---

## GET `/api/admin/organizations`

Returns paginated organizations with active member counts.

### List organizations response item

```json
{
  "id": "clx...",
  "name": "KOLAB Dev",
  "slug": "kolab-dev",
  "type": "STANDARD",
  "status": "ACTIVE",
  "memberCount": 12,
  "createdAt": "2026-06-28T10:00:00.000Z"
}
```

---

## GET `/api/admin/dashboard`

### Dashboard response (200)

```json
{
  "totalUsers": 120,
  "totalOrganizations": 18,
  "activeOrganizations": 16,
  "pendingInvitations": 4,
  "activeSessions": 85,
  "systemAdmins": 2
}
```

---

## Related documents

- [Authentication API](./authentication.md)
- [Audit Logs API](./audit-logs.md)

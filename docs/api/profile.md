# Profile API (Release 0.2)

**Status:** Implemented in `@kolab/api`  
**Base path:** `/api/profile`  
**Auth:** Bearer JWT required on all routes

Authenticated user profile management. These endpoints operate only on the authenticated user (`request.user.sub`). There are no user id route parameters.

---

## Endpoints

| Method | Path           | Description                             |
| ------ | -------------- | --------------------------------------- |
| GET    | `/api/profile` | Get account info and profile fields     |
| PATCH  | `/api/profile` | Update the authenticated user's profile |

No organization permission checks are required. Global JWT authentication applies.

---

## GET `/api/profile`

Returns basic account info plus profile fields. If no `UserProfile` row exists yet, profile fields are returned with null values and defaults (`language: "en"`, `timezone: "UTC"`).

### Get profile response (200)

```json
{
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "role": "USER",
    "isSystemAdmin": false,
    "createdAt": "2026-06-28T10:00:00.000Z",
    "updatedAt": "2026-06-28T10:00:00.000Z"
  },
  "profile": {
    "displayName": "Dev User",
    "avatarUrl": "https://cdn.example.com/avatar.png",
    "bio": "Hello",
    "language": "en",
    "timezone": "UTC",
    "country": "US"
  }
}
```

`passwordHash` and refresh token data are never returned.

---

## PATCH `/api/profile`

Updates one or more profile fields. Creates a `UserProfile` row automatically when missing.

### Update profile request

```json
{
  "displayName": "Dev User",
  "avatarUrl": "https://cdn.example.com/avatar.png",
  "bio": "Hello",
  "language": "en",
  "timezone": "America/New_York",
  "country": "US"
}
```

All fields are optional, but at least one must be provided.

### Update profile response (200)

Same shape as GET `/api/profile`.

**Validation errors:** `400` when the body is empty or field values fail Zod validation.

**Audit:** Writes `profile.updated` via `AuditService` when profile changes succeed.

---

## Related documents

- [Authentication API](./authentication.md)
- [Audit Logs API](./audit-logs.md)

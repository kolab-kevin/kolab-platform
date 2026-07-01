# Sessions API (Release 0.2)

**Status:** Implemented in `@kolab/api`  
**Base path:** `/api/sessions`  
**Auth:** Bearer JWT required on all routes

User-scoped session management. These endpoints operate only on sessions owned by the authenticated user (`request.user.sub`). They do not grant cross-user access, even for system administrators.

---

## Endpoints

| Method | Path                          | Description                                  |
| ------ | ----------------------------- | -------------------------------------------- |
| GET    | `/api/sessions`               | List active sessions for the current user    |
| GET    | `/api/sessions/current`       | Get the current session from JWT `sessionId` |
| POST   | `/api/sessions/revoke-others` | Revoke all other active sessions             |
| POST   | `/api/sessions/:id/revoke`    | Revoke one owned session                     |

No organization permission checks are required. Global JWT authentication applies.

---

## GET `/api/sessions`

Returns sessions where `revokedAt` is null and `expiresAt` is in the future.

### List sessions response (200)

```json
{
  "sessions": [
    {
      "id": "clx...",
      "organizationId": "clx...",
      "ipAddress": "127.0.0.1",
      "userAgent": "Mozilla/5.0",
      "expiresAt": "2026-07-06T12:00:00.000Z",
      "revokedAt": null,
      "createdAt": "2026-06-28T10:00:00.000Z",
      "isCurrent": true
    }
  ]
}
```

`refreshTokenHash` is never returned. `createdAt` is derived from the earliest linked refresh token when available. The Session model does not store `updatedAt`.

---

## GET `/api/sessions/current`

Requires `sessionId` in the JWT.

**Errors:**

- `400` when `sessionId` is missing from the token
- `404` when the session does not exist for the current user

---

## POST `/api/sessions/:id/revoke`

Revokes one session owned by the current user.

Side effects:

- Sets `revokedAt`
- Deletes linked refresh tokens
- Removes refresh token entries from Redis
- Invalidates cached user session when revoking the current session

**Errors:** `404` when the session is not found for the current user (including another user's session id)

---

## POST `/api/sessions/revoke-others`

Revokes all active sessions for the current user except the JWT `sessionId` session.

### Revoke other sessions response (200)

```json
{
  "revokedSessionIds": ["clx...", "clx..."]
}
```

**Errors:** `400` when `sessionId` is missing from the token

---

## Related documents

- [Authentication API](./authentication.md)
- [Organization API](./organizations.md)

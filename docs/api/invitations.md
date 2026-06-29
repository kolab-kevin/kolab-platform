# Invitations API (Release 0.2)

**Status:** Implemented in `@kolab/api`  
**Base path:** `/api/invitations`  
**Auth:** Bearer JWT with organization context for management routes; public accept route uses invitation token

---

## Endpoints

| Method | Path                          | Permission       | Description                                      |
| ------ | ----------------------------- | ---------------- | ------------------------------------------------ |
| POST   | `/api/invitations`            | `members:invite` | Create an invitation for the active organization |
| GET    | `/api/invitations`            | `members:invite` | List invitations for the active organization     |
| POST   | `/api/invitations/:id/revoke` | `members:invite` | Revoke a pending invitation                      |
| POST   | `/api/invitations/accept`     | public           | Accept an invitation using its token             |

`SYSTEM_ADMIN` (`isSystemAdmin: true`) bypasses authorization guards on protected routes.

Invitation tokens are hashed before storage. Raw tokens are returned **only** in the create response.

---

## POST `/api/invitations`

Requires `organizationId` in JWT.

### Create invitation request

```json
{
  "email": "newmember@example.com",
  "role": "RECRUITER"
}
```

### Create invitation response (201)

```json
{
  "invitation": {
    "id": "clx...",
    "organizationId": "clx...",
    "email": "newmember@example.com",
    "role": "RECRUITER",
    "status": "PENDING",
    "expiresAt": "2026-07-06T12:00:00.000Z",
    "acceptedAt": null,
    "invitedBy": "clx..."
  },
  "token": "raw-token-for-accept-url"
}
```

**Errors:** `409` if user is already an active member or a pending invitation exists; expired invitations are replaced automatically.

---

## GET `/api/invitations`

Query params:

- `pendingOnly` (boolean, default `false`) — when `true`, returns only pending non-expired invitations

---

## POST `/api/invitations/:id/revoke`

Revokes a pending invitation by deleting it.

### Revoke invitation response (200)

```json
{
  "id": "clx...",
  "revoked": true
}
```

---

## POST `/api/invitations/accept`

Public endpoint (no Bearer token required).

### Accept invitation request

```json
{
  "token": "raw-token-from-create-response",
  "password": "SecurePass1",
  "displayName": "Alex Creator"
}
```

`password` is required when the invited email does not yet have a user account.

### Accept invitation response (200)

```json
{
  "organizationId": "clx...",
  "userId": "clx...",
  "role": "RECRUITER",
  "membershipStatus": "ACTIVE"
}
```

Acceptance creates or reactivates `OrganizationMembership` and sets `acceptedAt` on the invitation.

---

## Related documents

- [Organization API](./organizations.md)
- [Authentication API](./authentication.md)

# Audit Logs API (Release 0.2)

**Status:** Implemented in `@kolab/api`  
**Base path:** `/api/audit-logs`  
**Auth:** Bearer JWT with `audit:read` permission and active organization context

---

## Endpoints

| Method | Path              | Permission   | Description                                 |
| ------ | ----------------- | ------------ | ------------------------------------------- |
| GET    | `/api/audit-logs` | `audit:read` | List audit logs for the active organization |

`SYSTEM_ADMIN` (`isSystemAdmin: true`) bypasses permission checks. Organization context (`organizationId` in JWT) is still required.

---

## GET `/api/audit-logs`

Returns paginated audit log entries scoped to the JWT `organizationId`.

### List audit logs query params

| Param         | Type     | Description                      |
| ------------- | -------- | -------------------------------- |
| `cursor`      | string   | Pagination cursor (audit log id) |
| `limit`       | number   | Page size (default 20, max 100)  |
| `action`      | string   | Filter by action                 |
| `actorUserId` | string   | Filter by actor user id          |
| `from`        | ISO date | Minimum `createdAt` (inclusive)  |
| `to`          | ISO date | Maximum `createdAt` (inclusive)  |

### List audit logs response (200)

```json
{
  "items": [
    {
      "id": "clx...",
      "organizationId": "clx...",
      "actorUserId": "clx...",
      "action": "membership.updated",
      "targetType": "membership",
      "targetId": "clx...",
      "metadata": {
        "previousRole": "VIEWER",
        "newRole": "RECRUITER"
      },
      "createdAt": "2026-06-28T10:00:00.000Z"
    }
  ],
  "nextCursor": "clx..."
}
```

---

## Recorded actions

Security-sensitive mutations write append-only audit entries via `AuditService.record(...)`:

| Action                    | Trigger                                    |
| ------------------------- | ------------------------------------------ |
| `invitation.created`      | Invitation created                         |
| `invitation.accepted`     | Invitation accepted                        |
| `invitation.revoked`      | Pending invitation revoked                 |
| `membership.updated`      | Organization member role or status updated |
| `session.revoked`         | User revoked one session                   |
| `sessions.revoked_others` | User revoked all other active sessions     |

Each entry includes `organizationId`, `actorUserId`, `action`, `targetType`, `targetId`, and `metadata`. Secrets and raw invitation tokens are never stored in metadata.

---

## Related documents

- [Authentication API](./authentication.md)
- [Invitations API](./invitations.md)
- [Organizations API](./organizations.md)
- [Sessions API](./sessions.md)

# Organization API (Release 0.2)

**Status:** Implemented in `@kolab/api`  
**Base path:** `/api/organizations`  
**Auth:** Bearer JWT with organization context (`organizationId`, `organizationRole`)

---

## Endpoints

| Method | Path                             | Permission                                      | Description                                          |
| ------ | -------------------------------- | ----------------------------------------------- | ---------------------------------------------------- |
| GET    | `/api/organizations/current`     | `org:read`                                      | Active organization from JWT context                 |
| GET    | `/api/organizations`             | `org:read`                                      | All organizations the user belongs to                |
| POST   | `/api/organizations/switch`      | `org:read`                                      | Switch active organization; returns new access token |
| GET    | `/api/organizations/members`     | `members:read`                                  | Members of the active organization                   |
| PATCH  | `/api/organizations/members/:id` | `members:update_role` + `ORG_OWNER`/`ORG_ADMIN` | Update member role or status                         |

`SYSTEM_ADMIN` (`isSystemAdmin: true`) bypasses authorization guards.

---

## GET `/api/organizations/current`

Requires `organizationId` in JWT.

**Response `200`**

```json
{
  "organization": {
    "id": "clx...",
    "name": "KOLAB Dev",
    "slug": "kolab-dev",
    "type": "STANDARD",
    "status": "ACTIVE",
    "settings": {},
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-02T00:00:00.000Z"
  },
  "membership": {
    "role": "ORG_ADMIN",
    "status": "ACTIVE",
    "joinedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

**Errors:** `403` missing organization context; `404` organization not found.

---

## POST `/api/organizations/switch`

### Organization switch request

```json
{
  "organizationId": "clx..."
}
```

**Response `200`**

```json
{
  "organization": {
    "id": "clx...",
    "name": "KOLAB Dev",
    "slug": "kolab-dev",
    "type": "STANDARD",
    "status": "ACTIVE"
  },
  "membership": {
    "role": "ORG_ADMIN",
    "status": "ACTIVE"
  },
  "accessToken": "eyJ...",
  "expiresIn": 900
}
```

Updates the linked session organization when `sessionId` is present in JWT.  
**Errors:** `403` if user is not an active member of the target organization.

---

## PATCH `/api/organizations/members/:id`

`:id` is the target user id.

### Member update request

```json
{
  "role": "RECRUITER"
}
```

### Member update rules

- Requires active organization context in JWT
- Only `ORG_OWNER` and `ORG_ADMIN` may call this endpoint
- Only `ORG_OWNER` may assign `ORG_OWNER`
- Cannot demote the sole `ORG_OWNER`

---

## Related documents

- [Authentication API](./authentication.md)
- [Identity architecture](../architecture/identity.md)

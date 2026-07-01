# API Documentation

Each backend service exposes health endpoints. The core `api` service provides authentication and OpenAPI docs.

## Base URL (local)

`http://localhost:4000`

## Swagger

Interactive docs: **<http://localhost:4000/api/docs>**

## Auth endpoints

| Method | Path                 | Auth            | Description                                            |
| ------ | -------------------- | --------------- | ------------------------------------------------------ |
| POST   | `/api/auth/register` | Public          | Create account (returns access token + refresh cookie) |
| POST   | `/api/auth/login`    | Public          | Login (returns access token + refresh cookie)          |
| POST   | `/api/auth/refresh`  | Refresh cookie  | Rotate refresh token, issue new access token           |
| POST   | `/api/auth/logout`   | Bearer + cookie | Revoke refresh token                                   |
| GET    | `/api/auth/me`       | Bearer          | Current user profile                                   |

## Health

| Method | Path      | Description                    |
| ------ | --------- | ------------------------------ |
| GET    | `/health` | Liveness                       |
| GET    | `/ready`  | Readiness (PostgreSQL + Redis) |

## Authentication flow

1. **Register/Login** — JSON body with `email` and `password`. Response includes `accessToken` and sets `kolab_refresh_token` httpOnly cookie.
2. **Authenticated requests** — `Authorization: Bearer <accessToken>`
3. **Refresh** — POST `/api/auth/refresh` with refresh cookie (no body)
4. **Logout** — POST `/api/auth/logout` with Bearer token and refresh cookie

## Password requirements

- Minimum 8 characters
- At least one uppercase letter, lowercase letter, and number

## Roles (RBAC)

`USER`, `CREATOR`, `MODERATOR`, `ADMIN`, `SUPER_ADMIN`

Frontend apps enforce role access client-side; API guards enforce server-side on protected routes.

**Release 0.2:** Identity API specification — [Authentication API (Release 0.2)](./authentication.md).

Implemented Release 0.2 modules:

- [Organizations](./organizations.md)
- [Invitations](./invitations.md)
- [Sessions](./sessions.md)
- [Audit logs](./audit-logs.md)

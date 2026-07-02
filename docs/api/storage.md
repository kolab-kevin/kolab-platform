# Storage API

**Status:** Implemented in `@kolab/api` and `@kolab/storage`  
**Base path:** `/api/storage`  
**Auth:** Bearer JWT with active organization context

---

## Overview

Storage helper endpoints generate **short-lived presigned URLs** for S3-compatible object storage. They do **not** create `CreatorDocument` or `CreatorContract` database rows — document/contract CRUD arrives in a later milestone.

Binary files are uploaded directly to object storage by the client. PostgreSQL stores metadata only in future document/contract APIs.

---

## Permissions

| Permission   | Used for                             |
| ------------ | ------------------------------------ |
| `crm:update` | `POST /api/storage/presign-upload`   |
| `crm:read`   | `POST /api/storage/presign-download` |

All routes require an active organization membership.

---

## Endpoints

| Method | Path                            | Permission   | Description                   |
| ------ | ------------------------------- | ------------ | ----------------------------- |
| POST   | `/api/storage/presign-upload`   | `crm:update` | Create presigned upload URL   |
| POST   | `/api/storage/presign-download` | `crm:read`   | Create presigned download URL |

---

## POST `/api/storage/presign-upload`

Validates upload metadata, normalizes an organization-scoped storage key, and returns a presigned `PUT` URL.

### Presign upload request

```json
{
  "creatorId": "creator-1",
  "resourceKind": "documents",
  "resourceId": "doc-1",
  "versionId": "ver-1",
  "fileName": "passport.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 2048000
}
```

`resourceKind` is `documents` or `contracts`.

### Presign upload response (201)

```json
{
  "storageKey": "organizations/org-1/creators/creator-1/documents/doc-1/versions/ver-1/passport.pdf",
  "uploadUrl": "https://storage.example/presigned-upload",
  "expiresAt": "2026-07-02T12:15:00.000Z",
  "requiredHeaders": {
    "Content-Type": "application/pdf"
  }
}
```

Upload URLs expire after **15 minutes** by default.

**Errors:** `403` missing membership; `400` invalid mime type or file size; `500` storage misconfiguration.

---

## POST `/api/storage/presign-download`

Validates that the storage key belongs to the active organization, then returns a presigned `GET` URL.

### Presign download request

```json
{
  "storageKey": "organizations/org-1/creators/creator-1/documents/doc-1/versions/ver-1/passport.pdf"
}
```

### Presign download response (200)

```json
{
  "storageKey": "organizations/org-1/creators/creator-1/documents/doc-1/versions/ver-1/passport.pdf",
  "downloadUrl": "https://storage.example/presigned-download",
  "expiresAt": "2026-07-02T12:05:00.000Z"
}
```

Download URLs expire after **5 minutes** by default.

---

## Allowed MIME types

- `application/pdf`
- `image/jpeg`
- `image/png`
- `image/webp`

Default maximum file size: **25 MB** (`STORAGE_MAX_FILE_SIZE_BYTES`).

---

## Storage key layout

```text
organizations/{organizationId}/creators/{creatorId}/{documents|contracts}/{resourceId}/versions/{versionId}/{safeFileName}
```

Keys are organization-scoped. Path traversal and unsafe file names are rejected.

---

## Configuration

| Variable                      | Description                                     |
| ----------------------------- | ----------------------------------------------- |
| `STORAGE_PROVIDER`            | `s3` or `minio` (default `s3`)                  |
| `STORAGE_BUCKET`              | Target bucket (required for presign operations) |
| `STORAGE_REGION`              | AWS region (default `us-east-1`)                |
| `STORAGE_ENDPOINT`            | Custom endpoint for MinIO/local dev             |
| `STORAGE_ACCESS_KEY_ID`       | Access key                                      |
| `STORAGE_SECRET_ACCESS_KEY`   | Secret key                                      |
| `STORAGE_FORCE_PATH_STYLE`    | `true` for MinIO/path-style endpoints           |
| `STORAGE_PUBLIC_BASE_URL`     | Optional public CDN/base URL (future use)       |
| `STORAGE_MAX_FILE_SIZE_BYTES` | Max upload size (default `26214400`)            |

Buckets are **private**. Presigned URLs are the only supported access path in this milestone.

---

## Related docs

- [Creator Documents & Contracts API](./creator-documents-contracts.md)
- [Creator Documents & Contracts architecture](../architecture/creator-documents-contracts.md)

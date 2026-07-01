# Agency Management API (Release 0.3)

**Status:** Implemented in `@kolab/api`  
**Base path:** `/api/agency`  
**Auth:** Bearer JWT with active organization context

Agency Management foundation for organizations of type `AGENCY`. These endpoints manage agency branding/profile data and operational settings that future releases will extend for recruiters, creators, campaigns, livestreams, TikTok Shop, payments, and analytics.

---

## Endpoints

| Method | Path                   | Permission   | Description                        |
| ------ | ---------------------- | ------------ | ---------------------------------- |
| GET    | `/api/agency`          | `org:read`   | Get current agency profile         |
| PATCH  | `/api/agency`          | `org:update` | Update agency profile              |
| GET    | `/api/agency/settings` | `org:read`   | Get agency operational settings    |
| PATCH  | `/api/agency/settings` | `org:update` | Update agency operational settings |

Only organizations with `type: AGENCY` may access these routes. Non-agency active organizations receive `403 Forbidden`.

---

## GET `/api/agency`

Returns agency profile fields for the JWT `organizationId`. When no profile row exists yet, defaults are returned (`timezone: UTC`, `supportedLanguages: ["en"]`, empty social/business objects).

### Agency profile response (200)

```json
{
  "organization": {
    "id": "clx...",
    "name": "Acme Agency",
    "slug": "acme-agency",
    "type": "AGENCY",
    "status": "ACTIVE"
  },
  "profile": {
    "description": "Full-service creator agency",
    "logoUrl": "https://cdn.example.com/logo.png",
    "website": "https://acme.example.com",
    "primaryContact": "ops@acme.example.com",
    "phone": "+15551234567",
    "country": "US",
    "timezone": "America/New_York",
    "supportedLanguages": ["en", "es"],
    "socialLinks": {
      "tiktok": "https://tiktok.com/@acme"
    },
    "businessSettings": {
      "defaultCurrency": "USD"
    }
  },
  "updatedAt": "2026-06-28T10:00:00.000Z"
}
```

---

## PATCH `/api/agency`

Updates one or more profile fields. Creates the agency profile automatically when missing.

Updatable fields:

- `description`
- `logoUrl`
- `website`
- `primaryContact`
- `phone`
- `country`
- `timezone`
- `supportedLanguages`
- `socialLinks`
- `businessSettings`

At least one field is required.

---

## GET `/api/agency/settings`

Returns operational settings for the active agency organization. Defaults include disabled placeholders for future modules (`campaigns`, `livestream`, `tiktokShop`, `payments`, `analytics`, `messaging`).

### Agency settings response (200)

```json
{
  "organization": {
    "id": "clx...",
    "name": "Acme Agency",
    "slug": "acme-agency",
    "type": "AGENCY",
    "status": "ACTIVE"
  },
  "settings": {
    "onboarding": {
      "enabled": true,
      "requireCreatorApproval": false
    },
    "recruiting": {
      "autoAssignRecruiter": false,
      "defaultRecruiterRole": "RECRUITER"
    },
    "campaigns": { "enabled": false },
    "livestream": { "enabled": false },
    "tiktokShop": { "enabled": false },
    "payments": { "enabled": false },
    "analytics": { "enabled": false },
    "messaging": { "enabled": false },
    "extensions": {}
  },
  "updatedAt": null
}
```

---

## PATCH `/api/agency/settings`

Partially updates operational settings using deep merge semantics for nested objects.

---

## Future extension points

The Release 0.3 foundation intentionally reserves space for future modules without implementing them yet:

| Area                  | Current foundation                | Future release hook                    |
| --------------------- | --------------------------------- | -------------------------------------- |
| Recruiters / managers | `recruiting` settings + org roles | Recruiter assignment workflows         |
| Creators              | `onboarding` settings             | Creator roster and onboarding pipeline |
| Campaigns             | `campaigns.enabled` toggle        | Campaign entities and scheduling       |
| Livestreams           | `livestream.enabled` toggle       | Livestream schedule management         |
| TikTok Shop           | `tiktokShop.enabled` toggle       | Commerce integrations                  |
| Payments              | `payments.enabled` toggle         | Billing and payout flows               |
| Analytics             | `analytics.enabled` toggle        | Agency performance dashboards          |
| Messaging             | `messaging.enabled` toggle        | In-app communication                   |

Additional future data can be stored in `businessSettings` (profile) and `settings.extensions` without schema changes.

---

## Related documents

- [Organizations API](./organizations.md)
- [Authentication API](./authentication.md)

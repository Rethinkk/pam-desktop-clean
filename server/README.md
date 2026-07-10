# PAM Sync Server

This is the first backend skeleton for PAM web sync.

It is intentionally dependency-free and uses Node built-ins only. It is not the final production database layer, but it defines the HTTP contract, session boundary and encrypted-record storage behavior.

## Endpoints

### `POST /api/pam/sync/push`

Accepts encrypted PAM record groups from the browser.

Security rules:

- Requires a signed `pam_session` HttpOnly cookie.
- Requires `X-PAM-Cloud-Provider` to be `ovhcloud-eu`, `scaleway-eu` or `custom-eu`.
- Requires `X-PAM-Region-Policy: eu-only`.
- Stores only encrypted payloads.
- Does not receive, derive or store raw vault keys.

### `POST /api/pam/auth/dev-login`

Development-only helper. Enabled only with:

```bash
PAM_ALLOW_DEV_LOGIN=true
```

This sets a signed HttpOnly session cookie for local testing.

## Local Run

Use a long local secret. Do not commit it.

```bash
PAM_SESSION_SECRET="change-me-to-a-long-random-local-secret-123456" \
PAM_ALLOW_DEV_LOGIN=true \
PAM_ALLOWED_ORIGIN="http://127.0.0.1:5174" \
npm run server:dev
```

Frontend env for local testing:

```bash
VITE_SECURE_LOCAL_STORAGE=true
VITE_CLOUD_SYNC_ENABLED=true
VITE_CLOUD_PROVIDER=ovhcloud-eu
VITE_CLOUD_REGION_POLICY=eu-only
VITE_CLOUD_SYNC_ENDPOINT=http://127.0.0.1:8787/api/pam/sync/push
```

## Production Direction

For OVHcloud/Scaleway production, replace the JSON file store with a database table for encrypted records.

Keep these rules:

- Sessions are HttpOnly cookies.
- Browser env contains no secrets.
- Backend enforces vault membership.
- Encrypted payloads remain opaque to the backend.
- Logs and sync events must not contain decrypted user data.
- Storage, backups, logs and support access remain EU-only.

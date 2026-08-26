# PAM Sync Server

This is the first backend skeleton for PAM web sync.

It is intentionally dependency-free and uses Node built-ins only. It is not the final production database layer, but it defines the HTTP contract, session boundary and encrypted-record storage behavior.

## Endpoints

### `POST /api/pam/sync/push`

Accepts encrypted PAM record groups from the browser.

Security rules:

- Requires a signed `pam_session` HttpOnly cookie.
- Requires `X-PAM-Cloud-Provider` to match the workspace data residency.
- Supports `ovhcloud-eu`, `scaleway-eu` and `custom-eu` for `eu-only`.
- Supports `exoscale-ch` and `custom-ch` for `ch-only`.
- Stores only encrypted payloads.
- Does not receive, derive or store raw vault keys.

### `POST /api/pam/auth/register`

Creates a user and vault, stores a server-side password hash, and sets a signed
HttpOnly session cookie.

Body:

```json
{
  "name": "Pam de Vries",
  "email": "pam@example.nl",
  "password": "minimum-10-characters",
  "dataResidency": "eu"
}
```

`dataResidency` defaults to `eu`. `ch` prepares a PAM Switzerland workspace
with `exoscale-ch` and `ch-only`.

### `POST /api/pam/auth/login`

Verifies the password and sets a signed HttpOnly session cookie.

### `GET /api/pam/auth/session`

Returns the current authenticated user if the session cookie is valid.

### `POST /api/pam/auth/logout`

Expires the session cookie.

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
VITE_PAM_DATA_RESIDENCY=eu
VITE_CLOUD_SYNC_ENABLED=true
VITE_CLOUD_PROVIDER=scaleway-eu
VITE_CLOUD_REGION_POLICY=eu-only
VITE_AUTH_API_URL=http://127.0.0.1:8787
VITE_CLOUD_SYNC_ENDPOINT=http://127.0.0.1:8787/api/pam/sync/push
```

## Automated Test

```bash
npm run test:server
```

This starts the server on a random local port and verifies:

- unauthenticated sync is rejected
- dev-login sets a signed HttpOnly cookie
- unsupported provider values are rejected
- mismatched provider and region-policy values are rejected
- workspace cloud routes are enforced
- invalid encrypted record shapes are rejected
- `scaleway-eu` and `exoscale-ch` workspace profiles are accepted
- encrypted record sync succeeds
- temporary test data is cleaned up

## Production Direction

For Scaleway or Exoscale production, replace the JSON file store with a database table for encrypted records.

Keep these rules:

- Sessions are HttpOnly cookies.
- Browser env contains no secrets.
- Backend enforces vault membership.
- Encrypted payloads remain opaque to the backend.
- Logs and sync events must not contain decrypted user data.
- Storage, backups, logs and support access must remain inside the selected
  workspace residency profile: PAM Europe or PAM Switzerland.

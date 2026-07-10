# PAM Production Web Readiness

Status: implementation checklist

PAM's production web app should be local-first, encrypted by default and backed by European cloud infrastructure.

## Current Production Direction

- Primary cloud target: OVHcloud EU.
- Secondary cloud target: Scaleway EU.
- Policy: no AWS/Amazon production dependency for core PAM vault storage.
- Browser app: React/Vite web app.
- Secure local storage: encrypted IndexedDB behind `VITE_SECURE_LOCAL_STORAGE=true`.
- Cloud sync: encrypted records posted to a European backend endpoint.

## Runtime Flags

Use `.env.example` as the template.

Required production stance:

```text
VITE_ENV=production
VITE_DEBUG=false
VITE_SECURE_LOCAL_STORAGE=true
VITE_CLOUD_SYNC_ENABLED=true
VITE_CLOUD_PROVIDER=ovhcloud-eu
VITE_CLOUD_REGION_POLICY=eu-only
```

Do not put API secrets, service-role tokens or private keys in Vite env files. Vite env values are shipped to the browser.

## Cloud Sync Contract

The frontend sends encrypted records to:

```text
POST /api/pam/sync/push
```

Request characteristics:

- `credentials: include` for HttpOnly cookie-based sessions.
- JSON body contains encrypted records only.
- Raw vault keys are never sent.
- Headers include selected provider and region policy.

Backend responsibilities:

- Reject unauthenticated requests.
- Verify session and vault membership.
- Enforce EU-only storage, backups, logs and subprocessors.
- Store encrypted payloads as opaque data.
- Keep audit logs free of sensitive payloads.
- Return `{ "uploadedCount": number, "cursor"?: string }`.

## Minimum Backend Objects

Start with these backend concepts:

- `users`: auth identity.
- `vaults`: one default vault per user.
- `vault_members`: access control, initially owner-only.
- `encrypted_records`: encrypted PAM record groups.
- `sync_events`: operational sync metadata without plaintext payloads.

Suggested encrypted record columns:

```text
id
vault_id
type
encrypted_payload
encryption_version
updated_at
deleted_at
client_updated_at
```

## Go-Live Blockers

Before PAM can be trusted as a real cloud app:

- Replace the development vault-key helper.
- Add account login and logout.
- Add vault unlock/recovery flow.
- Implement backend session validation.
- Implement encrypted cloud record persistence.
- Add restore/export tests.
- Add privacy, data processing and account deletion flows.
- Confirm EU-only hosting, backups, logs, monitoring and support access.

## Next Engineering Step

Build the backend API skeleton for `POST /api/pam/sync/push` on the selected European platform, then connect it to the current `HttpCloudAdapter`.

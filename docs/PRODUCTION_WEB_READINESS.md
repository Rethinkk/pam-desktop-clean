# PAM Production Web Readiness

Status: implementation checklist

PAM's production web app should be local-first, encrypted by default and backed by a selected data-residency profile.

Strategic residency model: `docs/PAM_DATA_RESIDENCY_ARCHITECTURE.md`.
First implementation path: `docs/PAM_EUROPE_SCALEWAY_ARCHITECTURE.md`.

## Current Production Direction

- Standard cloud target: PAM Europe on Scaleway EU.
- Prepared premium target: PAM Switzerland on Exoscale CH.
- Prepared expansion target: PAM United States with a future US provider.
- Policy: no AWS/Amazon production dependency for core PAM vault storage.
- Browser app: React/Vite web app.
- Secure local storage: encrypted IndexedDB behind `VITE_SECURE_LOCAL_STORAGE=true`.
- Cloud sync: encrypted records posted to the backend endpoint that belongs to the workspace residency profile.
- Consent model: explicit professional access consent before shared login/roles.

## Data Residency Profiles

PAM keeps the app experience the same, but stores cloud data according to the
workspace profile:

- `eu`: PAM Europe, default profile, `scaleway-eu`, `eu-only`.
- `ch`: PAM Switzerland, premium profile, `exoscale-ch`, `ch-only`.
- `us`: PAM United States, expansion profile, `custom-us`, `us-only`.

The account/workspace model stores `dataResidency`, `cloudProvider` and
`regionPolicy`. This keeps the product ready for a customer choice between
Europe, Switzerland and the United States without building separate apps.

## Runtime Flags

Use `.env.example` as the template.

Required production stance:

```text
VITE_ENV=production
VITE_DEBUG=false
VITE_SECURE_LOCAL_STORAGE=true
VITE_PAM_DATA_RESIDENCY=eu
VITE_CLOUD_SYNC_ENABLED=true
VITE_CLOUD_PROVIDER=scaleway-eu
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
- Enforce the selected workspace residency profile for storage, backups, logs
  and subprocessors.
- Store encrypted payloads as opaque data.
- Keep audit logs free of sensitive payloads.
- Return `{ "uploadedCount": number, "cursor"?: string }`.

## Minimum Backend Objects

Start with these backend concepts:

- `users`: auth identity.
- `vaults`: one default vault per user.
- `workspaces`: profile, subscription and residency boundary.
- `vault_members`: access control, initially owner-only.
- `consent_records`: user-granted professional access purpose, scope, validity and revocation.
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
- Connect professional invitations to stored consent records.
- Add vault unlock/recovery flow.
- Implement backend session validation.
- Implement encrypted cloud record persistence.
- Add restore/export tests.
- Add privacy, data processing and account deletion flows.
- Confirm hosting, backups, logs, monitoring and support access for each
  offered residency profile.

## Next Engineering Step

Replace the file-backed skeleton in `server/pam-sync-server.mjs` with a production database adapter on the selected PAM Europe platform first. Keep the adapter boundary portable for PAM Switzerland and PAM United States.

Current backend skeleton:

- `server/pam-sync-server.mjs`
- `POST /api/pam/sync/push`
- signed HttpOnly `pam_session` cookie validation
- provider and region-policy checks for PAM Europe, PAM Switzerland and PAM United States
- encrypted-record shape validation
- file-backed encrypted record persistence for development

The skeleton is suitable for contract testing. It is not the final production persistence layer.

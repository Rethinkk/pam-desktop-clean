# PAM Europe Scaleway Architecture

Status: release architecture v1

This document turns the current PAM proof of concept into a concrete production
cloud direction. The goal is a secure, calm and maintainable web application
that keeps the current local-first promise while adding real cloud use.

## Decision

PAM release 1 will target **PAM Europe** on Scaleway.

- Data residency profile: `eu`
- Cloud provider: `scaleway-eu`
- Region policy: `eu-only`
- Primary regions to evaluate: Paris or Amsterdam
- Premium profile prepared for later: **PAM Switzerland** on Exoscale, `ch`,
  `exoscale-ch`, `ch-only`

PAM should not become two applications. The app, UI and domain model remain one
product. The workspace decides which residency profile applies.

## Product Promise

PAM handles sensitive personal, legal, fiscal and financial information. The
cloud architecture must support this promise:

- The user owns the workspace and vault.
- PAM stores only what is needed to operate the service.
- Sensitive PAM records and documents are encrypted before cloud storage.
- The backend does not need plaintext access to assets, people, documents or
  consent details for normal sync.
- Professionals only gain access after explicit user consent.
- Europe and Switzerland are commercial data-residency choices, not separate
  feature sets.

## Target Runtime

```text
Browser app
  -> PAM API
    -> Managed PostgreSQL
    -> Object Storage
    -> Audit/event log

Browser app
  -> IndexedDB encrypted local cache
  -> Sync queue
  -> PAM API sync endpoints
```

### Frontend

- React/Vite web application.
- For production, prefer serving the frontend under the same PAM Europe hosting
  strategy instead of relying on a non-European frontend platform for the final
  public release.
- Browser environment variables must not contain secrets.
- The frontend sends encrypted record groups to the API using HttpOnly
  cookie-based sessions.

### API

- Node HTTP API or small framework around the existing sync server contract.
- Stateless application containers where practical.
- Authentication through secure HttpOnly cookies.
- No direct cloud SDK calls from UI components.
- All backend authorization is workspace- and vault-scoped.

### Database

Use managed PostgreSQL for relational metadata, authorization and encrypted
record storage.

Minimum production tables:

- `users`
- `workspaces`
- `workspace_members`
- `vaults`
- `vault_members`
- `sessions`
- `encrypted_records`
- `document_objects`
- `consent_records`
- `audit_events`
- `sync_events`

### Object Storage

Use S3-compatible object storage for document/file blobs.

Rules:

- Store files encrypted.
- Store only minimal metadata outside the encrypted payload.
- Keep object keys unguessable.
- Link files to vault/workspace ownership in PostgreSQL.
- Do not store readable filenames, document contents or extracted text in logs.

## Data Residency Model

Each workspace has:

```text
data_residency: eu | ch
cloud_provider: scaleway-eu | exoscale-ch | custom-eu | custom-ch
region_policy: eu-only | ch-only
```

For v1:

```text
data_residency = eu
cloud_provider = scaleway-eu
region_policy = eu-only
```

The API must reject sync if request headers do not match the workspace profile.
This is already prepared in the current server skeleton.

## Encryption Boundary

PAM uses a hybrid model:

- Account login opens the application session.
- A vault key encrypts sensitive records and documents.
- The raw vault key is never stored by the backend.
- Records are encrypted client-side before cloud sync.
- Production still needs a real vault unlock and recovery flow before customer
  cloud use is safe.

Encrypted record shape:

```text
id
workspace_id
vault_id
type
encrypted_payload
encryption_version
client_updated_at
server_updated_at
deleted_at
```

Search and dashboard completeness should initially be computed client-side from
decrypted local data. Server-side search over sensitive fields is out of scope
for release 1.

## Authentication And Access

Release 1 baseline:

- Email/password with strong password policy, later passkeys/MFA.
- Signed HttpOnly session cookie.
- Session rotation on login.
- Logout expires the server session.
- One owner workspace per user at account creation.
- Professional access only through explicit consent records.

Professional access later requires:

- invitation acceptance;
- role assignment;
- active consent scope;
- audit log entry for each access;
- revocation support.

## Consent Scope

Consent is not only legal text. It becomes an access boundary.

Minimum consent scope fields:

- professional identity;
- organization and role;
- purpose;
- allowed rights;
- valid-from and valid-until;
- status: active, expired, revoked;
- linked workspace/vault;
- generated receipt.

The backend must enforce this before a professional can read synchronized data.
Until professional accounts are live, consent remains recorded and exportable.

## Audit And Logging

Audit logs must prove what happened without exposing private content.

Allowed in operational/audit logs:

- actor id, role and organization;
- workspace id;
- vault id;
- action type;
- record type;
- timestamp;
- result status;
- IP/user-agent where legally appropriate.

Not allowed in logs:

- asset names;
- document names;
- personal details;
- decrypted payloads;
- raw vault keys;
- recovery secrets.

## Backup And Restore

Release 1 needs provider-level and product-level backup.

Provider-level:

- managed PostgreSQL backups;
- object storage durability/backups;
- infrastructure configuration backup;
- restore drill before production launch.

Product-level:

- user export;
- context export;
- full encrypted backup;
- account deletion/export workflow.

## Deployment Shape

Recommended v1 layout:

```text
app.pam.example
  -> static frontend

api.pam.example
  -> PAM API
  -> PostgreSQL private connection
  -> Object Storage private credentials
```

Required production environment variables:

```text
VITE_ENV=production
VITE_DEBUG=false
VITE_SECURE_LOCAL_STORAGE=true
VITE_PAM_DATA_RESIDENCY=eu
VITE_CLOUD_SYNC_ENABLED=true
VITE_CLOUD_PROVIDER=scaleway-eu
VITE_CLOUD_REGION_POLICY=eu-only
VITE_AUTH_API_URL=https://api.pam.example
VITE_CLOUD_SYNC_ENDPOINT=https://api.pam.example/api/pam/sync/push
```

Server secrets must live only in the backend environment:

```text
PAM_SESSION_SECRET
PAM_DATABASE_URL
PAM_OBJECT_STORAGE_ENDPOINT
PAM_OBJECT_STORAGE_BUCKET
PAM_OBJECT_STORAGE_ACCESS_KEY
PAM_OBJECT_STORAGE_SECRET_KEY
PAM_ALLOWED_ORIGIN
```

## Scaleway Services To Use

First production stack:

- Compute: container or virtual instance for PAM API.
- Database: Managed PostgreSQL.
- Storage: Object Storage for encrypted document blobs.
- Secrets: provider secret manager or deployment secrets.
- Networking: private network where available.
- Monitoring: metrics, uptime checks and structured error logging.

Keep the code provider-neutral. The Scaleway implementation should sit behind
database and object-storage adapters so that Exoscale can reuse the same product
model later.

## Release 1 Build Sequence

1. Define PostgreSQL schema and migrations.
2. Replace file-backed user/session/record stores with database repositories.
3. Add object storage adapter for encrypted document blobs.
4. Add download/upload endpoints for encrypted document objects.
5. Enforce workspace and vault membership on every endpoint.
6. Add account deletion/export endpoints.
7. Add backup/restore drill instructions.
8. Deploy staging on PAM Europe.
9. Run release smoke tests against staging.
10. Invite a small controlled pilot group.

## Open Decisions

- Paris or Amsterdam as first Scaleway region.
- Exact backend runtime: container, serverless container or VM.
- Auth v1: own password implementation versus managed identity provider.
- Vault unlock UX: password-derived, recovery-key based, passkey based, or
  phased hybrid.
- Whether Vercel remains acceptable for public marketing pages only.

## Go/No-Go Criteria

PAM can move from POC to private beta when:

- production database replaces file storage;
- encrypted document object storage works;
- cloud sync is scoped by account, workspace and vault;
- account deletion/export is available;
- backups are tested;
- vault key helper is replaced by a real unlock/recovery flow;
- audit logs contain no sensitive payloads;
- Playwright smoke tests pass against staging.

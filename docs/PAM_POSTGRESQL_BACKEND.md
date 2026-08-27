# PAM PostgreSQL Backend

Status: step 2 foundation

This document defines the first backend replacement step: moving from the
file-backed sync skeleton to a PostgreSQL-backed production model.

## Decision

PAM will replace JSON file persistence with PostgreSQL repositories.

Release 1 still targets PAM Europe first, but the schema includes
workspace-level data residency so PAM Switzerland and PAM United States can use
the same backend model later.

## Migration File

Initial schema:

```text
server/migrations/001_initial_postgres_schema.sql
```

Run migrations with:

```bash
PAM_DATABASE_URL="postgres://..." npm run db:migrate
```

This migration creates:

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

## Why This Shape

PAM needs a relational backend for identity, access, consent, audit and sync
metadata, while sensitive PAM content remains encrypted.

The database may know:

- user identity for login;
- workspace and vault ownership;
- residency profile;
- encrypted record type;
- timestamps and sync cursors;
- object storage keys for encrypted files;
- audit metadata without private content.

The database must not contain:

- raw vault keys;
- decrypted assets;
- decrypted people records;
- decrypted document contents;
- readable sensitive payloads in logs.

## Repository Boundary

The current server directly reads and writes:

- `server/data/users.json`
- `server/data/encrypted-records.json`
- `server/data/sync-events.jsonl`

The next code step is to replace those direct file helpers with repository
methods:

```text
users.findByEmail(email)
users.findById(id)
users.createOwnerWorkspace(input)
records.upsertEncryptedRecords(session, records)
records.findChangedSince(vaultId, cursor)
events.appendAuditEvent(event)
events.appendSyncEvent(event)
sessions.create(session)
sessions.revoke(sessionId)
```

Current code state:

- `server/pam-file-store.mjs` contains the file-backed implementation.
- `server/pam-sync-server.mjs` now calls the store module instead of directly
  reading and writing the JSON files.
- `server/pam-postgres-store.mjs` contains the PostgreSQL implementation.
- `server/run-migrations.mjs` applies SQL migrations listed in
  `server/migrations`.

Production will use a PostgreSQL implementation behind the same interface.

## Data Residency Enforcement

Every production write must be scoped by:

```text
workspace_id
vault_id
data_residency
cloud_provider
region_policy
```

The current server already rejects sync calls when `X-PAM-Cloud-Provider` and
`X-PAM-Region-Policy` do not match the workspace. The PostgreSQL version must
keep that behavior.

## Account Creation

Creating a user should create all of these in one transaction:

1. `users`
2. `workspaces`
3. `workspace_members` as `owner`
4. `vaults`
5. `vault_members` as `owner`
6. `audit_events` for `auth.register`

The transaction must fail as a whole if any step fails.

## Sync Push

The production sync push flow should be:

1. Verify HttpOnly session.
2. Load user/workspace/vault membership.
3. Verify provider and region policy.
4. Validate encrypted record shapes.
5. Upsert encrypted records in one transaction.
6. Append sync event without payload data.
7. Return upload count and cursor.

## Document Objects

Document files should move to object storage, but database metadata remains in
`document_objects`.

The object itself must be encrypted. The database should store:

- workspace;
- vault;
- owner;
- bucket;
- unguessable object key;
- size;
- content hash where useful;
- encryption version.

Readable filenames and document text belong inside encrypted payloads, not in
operational tables.

## Audit Rules

`audit_events.metadata` must remain safe. It may contain operational context,
but not decrypted asset names, person details, document text or raw secrets.

Good:

```json
{ "recordType": "assets", "result": "success" }
```

Bad:

```json
{ "assetName": "Family trust account", "documentTitle": "Passport scan" }
```

## Implementation Order

1. Add migration file. Done.
2. Add a repository boundary around the current server helpers. Done.
3. Add a file-backed repository implementation for current tests. Done.
4. Add a PostgreSQL repository implementation. Done.
5. Add migration runner. Done.
6. Add integration tests against PostgreSQL.
7. Switch production server startup to require `PAM_DATABASE_URL`.
8. Keep file-backed mode only for local contract tests.

## Open Decisions

- Which PostgreSQL client package to use.
- Whether sessions remain signed stateless cookies only, or become backed by the
  `sessions` table immediately.
- Which Scaleway runtime runs migrations.
- Whether encrypted record download/sync-pull lands before or after document
  object upload.

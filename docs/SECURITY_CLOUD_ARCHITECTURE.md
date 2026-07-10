# PAM Security & Cloud Architecture

Status: draft foundation

PAM stores highly sensitive personal, financial, legal and identity data. The proof of concept is intentionally local-first and uses browser storage, but the production application must treat privacy and security as product features, not implementation details.

This document defines the target direction for turning PAM into a secure cloud-capable application while preserving local use.

## Goals

- Keep PAM usable locally and offline.
- Add authenticated cloud sync for users who choose it.
- Keep user data separated by account and, later, household/organization.
- Avoid direct storage calls from UI components.
- Encrypt sensitive data before it leaves the client whenever practical.
- Support export, backup, account deletion and future audit trails.

## Non-Goals For The First Refactor

- No full backend implementation yet.
- No migration to a specific cloud vendor yet.
- No document OCR or AI processing of private files yet.
- No enterprise roles model beyond a simple user-owned vault.

## Data Classes

PAM data should be classified before storage and sync:

| Class | Examples | Storage Requirement |
| --- | --- | --- |
| Public app data | asset type labels, UI schema defaults | Can be bundled with app |
| Personal metadata | asset names, relationships, trigger labels | Authenticated, tenant-scoped, encrypted at rest |
| Sensitive personal data | bank accounts, policy numbers, IDs, inheritance records | Client-side encrypted before cloud sync |
| Documents/files | scans, invoices, identity documents, contracts | Encrypted object storage with metadata separated |
| Consent records | advisor access purpose, scope, validity, revocation | Tenant-scoped, encrypted, auditable |
| Operational data | logs, sync status, errors | No sensitive payloads, short retention |

## Target Architecture

```text
React UI / Tauri UI
  -> domain services
    -> repositories
      -> local encrypted adapter
      -> cloud encrypted adapter
      -> sync coordinator
```

UI components should never call `localStorage`, `fetch`, cloud SDKs or crypto APIs directly. They should call domain services such as:

- `assetService`
- `personService`
- `documentService`
- `triggerService`
- `exportService`

Those services use repository interfaces. The active repository can be local-only, cloud-only for read-through cache, or local-plus-cloud sync.

## Storage Model

### Local

Current POC: `localStorage`.

Production direction:

- Web: IndexedDB, with encrypted records.
- Desktop/Tauri: SQLite or Tauri store, with encrypted records.
- Never use `localStorage` for sensitive payloads.
- Keep a small unencrypted preferences store only for UI preferences such as active tab.

### Cloud

Cloud storage should contain:

- User account and vault metadata.
- Encrypted asset records.
- Encrypted person records.
- Encrypted document metadata.
- Encrypted consent records.
- Encrypted file blobs in object storage.
- Sync cursors and conflict metadata.

The backend should not need plaintext access to sensitive user data for normal operation.

## Encryption Direction

Use envelope-style encryption:

1. Generate a vault key per user/vault.
2. Derive or unwrap the vault key after login.
3. Encrypt records locally before writing to cloud.
4. Store only encrypted payloads and searchable minimal metadata.

Recommended browser primitive: Web Crypto API with AES-GCM for content encryption.

### Chosen Key Management Direction: Hybrid

PAM should use a hybrid model for production:

- Account login unlocks access to the application, sync session and account metadata.
- A separate vault key encrypts the actual PAM records and documents.
- The cloud backend must never store the raw vault key.
- The vault key may be wrapped by a user passphrase, recovery key, passkey-backed secret, or a provider-backed wrapping mechanism.
- A user must complete recovery-key setup before relying on cloud sync for important data.

This keeps the day-to-day UX understandable while preserving user control over sensitive data. Losing an account password should not automatically expose data, and losing a vault/recovery key must be treated as a real recovery event rather than a simple password reset.

Important design choices still to decide:

- Recovery flow if a user loses their key.
- Whether selected metadata may remain searchable server-side.
- How sharing with family members or advisors should work.
- Which wrapping options are enabled first: recovery phrase, passkey, provider-backed wrapping, or a combination.

The current encrypted IndexedDB adapter is a foundation layer, not the final key-management model. It is gated behind `VITE_SECURE_LOCAL_STORAGE=true` and currently uses a development vault-key helper so the migration path can be tested without designing the full unlock/recovery UX first. Before production, PAM must replace that helper with user-controlled key derivation, key wrapping and recovery.

## Authentication & Authorization

Minimum production baseline:

- Email/password or passkey/social auth through a mature provider.
- MFA support.
- Session rotation and logout.
- Row-level access control in the backend.
- One default vault per user.
- Future support for shared vaults with roles.

### Consent & Professional Access

PAM should treat professional access as explicit user consent, not as a loose invitation link. The first implementation stores a `ConsentRecord` locally and includes it in export, secure local migration and encrypted cloud sync.

A consent record captures:

- professional name, organization, email and role;
- purpose of access;
- permitted access rights;
- start and optional expiry date;
- active, expired or revoked status;
- generated Dutch consent text;
- downloadable consent receipt.

Production authorization should later enforce these records server-side and client-side. A notary, fiscal advisor or accountant should only see a vault after the user has granted consent, and every access should be written to an audit log without exposing sensitive payloads in logs.

European backend options:

- OVHcloud EU: preferred production direction for European positioning and core vault storage.
- Scaleway EU: pragmatic European alternative for faster product development.
- Custom EU backend: more control, higher build and maintenance cost.

Production recommendation: OVHcloud EU as the primary target, with Scaleway EU as the fallback. Avoid AWS/Amazon for core vault storage so PAM can credibly position itself around European data residency and independence.

Supabase, Firebase, Neon and similar managed developer platforms may still be useful for experiments, but they should not be the production promise if the public position is "European cloud infrastructure, no Amazon dependency for PAM vault storage."

## Sync Model

Start simple:

- Local writes create records with `id`, `createdAt`, `updatedAt`, `deletedAt?`, `version`.
- Sync uploads changed encrypted records.
- Sync downloads records changed since last cursor.
- Last-write-wins is acceptable for the first private single-user version.
- Add conflict records before supporting multi-user shared vault editing.

Record shape:

```ts
type SyncRecord<T> = {
  id: string;
  vaultId: string;
  type: "asset" | "person" | "document" | "trigger";
  payload: T;
  version: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};
```

Encrypted cloud shape:

```ts
type EncryptedCloudRecord = {
  id: string;
  vault_id: string;
  type: string;
  encrypted_payload: string;
  encryption_version: number;
  updated_at: string;
  deleted_at?: string;
};
```

## Current Code Migration Plan

The current app has direct `localStorage` usage in components and lib files. The migration should be incremental.

### Phase 1: Storage Boundary

Add repository interfaces:

- `src/storage/types.ts`
- `src/storage/localStorageAdapter.ts`
- `src/services/assets.ts`
- `src/services/people.ts`
- `src/services/documents.ts`

Move these first:

- `src/lib/assetNumber.ts`
- `src/lib/peopleStore.ts`
- `src/lib/compatDocs.ts`
- `src/lib/exportAll.ts`

Then update components to use services instead of direct `localStorage`:

- `AssetsPanel`
- `AssetRegisterPanel`
- `DocumentsPanel`
- `DocumentRegisterPanel`
- `PeoplePanel`
- `ReportingPanel`

### Phase 2: Local Secure Store

Replace the local adapter implementation with encrypted IndexedDB while keeping the same repository interface.

Keep `localStorage` only for:

- active tab
- UI preferences
- migration markers

Current implementation:

- `VITE_SECURE_LOCAL_STORAGE=false`: repositories use the localStorage adapter.
- `VITE_SECURE_LOCAL_STORAGE=true`: bootstrap migrates POC data, hydrates encrypted IndexedDB into a synchronous cache, and repositories read/write through that secure adapter.
- Writes update the in-memory cache immediately and persist encrypted records to IndexedDB in the background.

Secure mode UX must include:

- export-before-migration warning
- explicit migration start
- migration status in the Security & Privacy screen
- encrypted storage verification after migration

### Phase 3: Cloud Adapter

Add a cloud adapter behind the same repository contract.

Suggested modules:

- `src/sync/cloudAdapter.ts`
- `src/sync/syncQueue.ts`
- `src/sync/syncCoordinator.ts`
- `src/sync/syncStatus.ts`
- `src/security/crypto.ts`
- `src/security/vaultKey.ts`

Current implementation:

- `VITE_CLOUD_SYNC_ENABLED=false`: cloud-sync remains disabled and no backend is contacted.
- `VITE_CLOUD_SYNC_ENABLED=true`: sync status and queue are active, and the HTTP cloud adapter can post encrypted records to `VITE_CLOUD_SYNC_ENDPOINT`.
- Allowed frontend provider values are `ovhcloud-eu`, `scaleway-eu` and `custom-eu`.
- The sync coordinator collects local record groups, encrypts payloads client-side and passes only encrypted records to the cloud adapter.
- The cloud adapter contract does not receive raw vault keys.
- The browser uses `credentials: include`; production auth should use HttpOnly session cookies, not browser-exposed API secrets.
- Sync queue/status are operational metadata and may remain outside encrypted vault storage.

### Phase 4: Migration

Build a one-time migration:

1. Read existing POC keys.
2. Normalize assets, people, documents and schema.
3. Write to the repository layer.
4. Mark migration completed.
5. Offer encrypted JSON export before migration.

### Phase 5: Production Hardening

- Security tests for crypto and access boundaries.
- Integration tests for sync.
- Backup/restore tests.
- Error logging with payload redaction.
- Delete-account flow.
- Data processing agreement and privacy documentation.

## Immediate Next Engineering Task

Start the cloud adapter behind the same repository boundary.

Acceptance criteria:

- Existing local POC behavior still works.
- Secure local mode remains the default foundation for sensitive data.
- Cloud sync stores encrypted records and does not receive raw vault keys.
- Backend access is account-scoped and vault-scoped.
- Typecheck and build pass.

This gives PAM a clean foundation for secure local storage and cloud sync without forcing a backend decision too early.

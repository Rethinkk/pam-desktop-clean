# PAM Storage Refactor Checklist

This checklist tracks the path from POC storage to production-ready local and cloud storage.

## Step 1: Repository Contracts

- [ ] Define domain entities for assets, people, documents and triggers.
- [x] Add repository interfaces for CRUD and list operations.
- [ ] Add a storage event/subscribe mechanism for UI refreshes.
- [x] Add a compatibility adapter over current `localStorage` keys.

## Step 2: Move Existing Stores

- [x] Move `assetNumber.ts` reads/writes behind the asset repository.
- [x] Move `peopleStore.ts` reads/writes behind the people repository.
- [x] Move `compatDocs.ts` reads/writes behind the document repository.
- [x] Move `exportAll.ts` to use repositories instead of direct storage keys.

## Step 3: Remove Component Storage Access

- [x] `AssetsPanel`
- [x] `AssetRegisterPanel`
- [x] `DocumentsPanel`
- [x] `DocumentRegisterPanel`
- [x] `PeoplePanel`
- [x] `ReportingPanel`
- [x] `SecurityPanel`

## Step 4: Secure Local Storage

- [x] Add encrypted IndexedDB adapter.
- [x] Add local migration from POC `localStorage`.
- [ ] Keep only non-sensitive UI preferences in `localStorage`.
- [ ] Add export-before-migration safety path.

## Step 5: Cloud Sync

- [ ] Choose backend provider.
- [ ] Add auth.
- [ ] Add vault model.
- [ ] Add encrypted cloud record model.
- [ ] Add sync queue and conflict metadata.
- [ ] Add file/blob storage for encrypted documents.

## Step 6: Security Hardening

- [ ] Define recovery-key UX.
- [ ] Add audit events without sensitive payloads.
- [ ] Add account deletion and data purge flow.
- [ ] Add tests for auth boundaries and storage migration.
- [ ] Add threat model review before production launch.

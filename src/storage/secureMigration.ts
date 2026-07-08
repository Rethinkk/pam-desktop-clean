import {
  ASSET_SCHEMA_KEY,
  ASSETS_KEY,
  DOCS_KEY,
  DOCS_SEQ_KEY,
  PEOPLE_KEY,
} from "./repositories";
import { indexedDbEncryptedAdapter } from "./indexedDbEncryptedAdapter";
import { localStorageAdapter } from "./localStorageAdapter";

const MIGRATION_MARKER = "pam-secure-local-migrated-v1";

const POC_KEYS = [
  ASSETS_KEY,
  DOCS_KEY,
  DOCS_SEQ_KEY,
  PEOPLE_KEY,
  ASSET_SCHEMA_KEY,
  "pam-asset-register-v1",
  "pam-assets-register-v1",
];

export async function migrateLocalStorageToEncryptedIndexedDb(): Promise<void> {
  if (localStorageAdapter.read(MIGRATION_MARKER)) return;

  for (const key of POC_KEYS) {
    const value = localStorageAdapter.read(key);
    if (value !== undefined) {
      await indexedDbEncryptedAdapter.write(key, value);
    }
  }

  localStorageAdapter.write(MIGRATION_MARKER, {
    migratedAt: new Date().toISOString(),
    target: "indexeddb-encrypted-v1",
  });
}

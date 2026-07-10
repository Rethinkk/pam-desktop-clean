import {
  ASSET_SCHEMA_KEY,
  ASSETS_KEY,
  CONSENTS_KEY,
  DOCS_KEY,
  DOCS_SEQ_KEY,
  PEOPLE_KEY,
} from "./repositories";
import { SECURE_LOCAL_STORAGE } from "../lib/config";
import { indexedDbEncryptedAdapter } from "./indexedDbEncryptedAdapter";
import { localStorageAdapter } from "./localStorageAdapter";

const MIGRATION_MARKER = "pam-secure-local-migrated-v1";
const ENCRYPTED_TARGET = "indexeddb-encrypted-v1";

const POC_KEYS = [
  ASSETS_KEY,
  DOCS_KEY,
  DOCS_SEQ_KEY,
  PEOPLE_KEY,
  ASSET_SCHEMA_KEY,
  CONSENTS_KEY,
  "pam-asset-register-v1",
  "pam-assets-register-v1",
];

type MigrationMarker = {
  migratedAt: string;
  target: string;
  migratedKeys: string[];
};

export type SecureMigrationStatus = {
  secureModeEnabled: boolean;
  migrated: boolean;
  migratedAt?: string;
  target: string;
  sourceKeys: string[];
  encryptedKeys: string[];
};

export type SecureMigrationVerification = {
  ok: boolean;
  encryptedKeys: string[];
  missingKeys: string[];
};

function getSourceKeys(): string[] {
  return POC_KEYS.filter((key) => localStorageAdapter.read(key) !== undefined);
}

export async function getSecureMigrationStatus(): Promise<SecureMigrationStatus> {
  const marker = localStorageAdapter.read<MigrationMarker>(MIGRATION_MARKER);

  return {
    secureModeEnabled: SECURE_LOCAL_STORAGE,
    migrated: Boolean(marker),
    migratedAt: marker?.migratedAt,
    target: marker?.target ?? ENCRYPTED_TARGET,
    sourceKeys: getSourceKeys(),
    encryptedKeys: await indexedDbEncryptedAdapter.keys(),
  };
}

export async function verifyEncryptedMigration(): Promise<SecureMigrationVerification> {
  const sourceKeys = getSourceKeys();
  const encryptedKeys = await indexedDbEncryptedAdapter.keys();
  const missingKeys: string[] = [];

  for (const key of sourceKeys) {
    const value = await indexedDbEncryptedAdapter.read(key);
    if (value === undefined) missingKeys.push(key);
  }

  return {
    ok: missingKeys.length === 0,
    encryptedKeys,
    missingKeys,
  };
}

export async function migrateLocalStorageToEncryptedIndexedDb(
  options: { force?: boolean } = {},
): Promise<SecureMigrationStatus> {
  if (localStorageAdapter.read(MIGRATION_MARKER) && !options.force) {
    return getSecureMigrationStatus();
  }

  const migratedKeys: string[] = [];

  for (const key of POC_KEYS) {
    const value = localStorageAdapter.read(key);
    if (value !== undefined) {
      await indexedDbEncryptedAdapter.write(key, value);
      migratedKeys.push(key);
    }
  }

  localStorageAdapter.write<MigrationMarker>(MIGRATION_MARKER, {
    migratedAt: new Date().toISOString(),
    target: ENCRYPTED_TARGET,
    migratedKeys,
  });

  return getSecureMigrationStatus();
}

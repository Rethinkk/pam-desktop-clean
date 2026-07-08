import { encryptJson } from "../security/crypto";
import { getOrCreateDevVaultKey } from "../security/vaultKey";
import {
  activeStorageAdapter,
  ASSET_SCHEMA_KEY,
  ASSETS_KEY,
  DOCS_KEY,
  PEOPLE_KEY,
} from "../storage/repositories";
import { cloudAdapter } from "./cloudAdapter";
import {
  clearSyncQueue,
  enqueueAllKnownRecords,
  getSyncQueue,
  markQueueAttempted,
} from "./syncQueue";
import { getCloudSyncStatus, updateCloudSyncStatus } from "./syncStatus";
import type { CloudRecordType, CloudSyncStatus, EncryptedCloudRecord } from "./types";

const DEFAULT_VAULT_ID = "local-default-vault";

const RECORD_TYPES_BY_STORAGE_KEY = new Map<string, CloudRecordType>([
  [ASSETS_KEY, "assets"],
  [PEOPLE_KEY, "people"],
  [DOCS_KEY, "documents"],
  [ASSET_SCHEMA_KEY, "schema"],
]);

function recordTypeForStorageKey(storageKey: string): CloudRecordType {
  return RECORD_TYPES_BY_STORAGE_KEY.get(storageKey) ?? "assets";
}

async function buildEncryptedCloudRecords(): Promise<EncryptedCloudRecord[]> {
  const vaultKey = await getOrCreateDevVaultKey();
  const records: EncryptedCloudRecord[] = [];

  for (const item of getSyncQueue()) {
    const value = activeStorageAdapter.read(item.storageKey);
    if (value === undefined) continue;

    records.push({
      id: item.id,
      vaultId: DEFAULT_VAULT_ID,
      type: item.recordType ?? recordTypeForStorageKey(item.storageKey),
      encryptedPayload: await encryptJson(
        {
          storageKey: item.storageKey,
          value,
        },
        vaultKey,
      ),
      encryptionVersion: 1,
      updatedAt: new Date().toISOString(),
    });
  }

  return records;
}

export function refreshCloudSyncStatus(): CloudSyncStatus {
  return updateCloudSyncStatus({
    queuedCount: getSyncQueue().length,
  });
}

export async function queueLocalDataForCloudSync(): Promise<CloudSyncStatus> {
  const queue = enqueueAllKnownRecords();
  return updateCloudSyncStatus({
    state: getCloudSyncStatus().enabled ? "idle" : "disabled",
    queuedCount: queue.length,
    lastError: undefined,
  });
}

export async function runCloudSyncNow(): Promise<CloudSyncStatus> {
  const queued = enqueueAllKnownRecords();
  const attemptedAt = new Date().toISOString();

  if (!cloudAdapter.isConfigured()) {
    return updateCloudSyncStatus({
      state: getCloudSyncStatus().enabled ? "error" : "disabled",
      queuedCount: queued.length,
      lastAttemptAt: attemptedAt,
      lastError: "Cloud adapter is nog niet geconfigureerd.",
    });
  }

  updateCloudSyncStatus({
    state: "syncing",
    queuedCount: queued.length,
    lastAttemptAt: attemptedAt,
    lastError: undefined,
  });

  try {
    markQueueAttempted(queued);
    const records = await buildEncryptedCloudRecords();
    const result = await cloudAdapter.pushEncryptedRecords(records);
    clearSyncQueue();
    return updateCloudSyncStatus({
      state: "success",
      queuedCount: 0,
      lastSuccessAt: new Date().toISOString(),
      uploadedCount: result.uploadedCount,
      lastError: undefined,
    });
  } catch (error) {
    return updateCloudSyncStatus({
      state: "error",
      queuedCount: getSyncQueue().length,
      lastError: error instanceof Error ? error.message : String(error),
    });
  }
}

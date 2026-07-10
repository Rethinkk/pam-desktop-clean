import { localStorageAdapter } from "../storage/localStorageAdapter";
import {
  ASSET_SCHEMA_KEY,
  ASSETS_KEY,
  CONSENTS_KEY,
  DOCS_KEY,
  PEOPLE_KEY,
} from "../storage/repositories";
import type { CloudRecordType, SyncQueueItem } from "./types";

const SYNC_QUEUE_KEY = "pam-cloud-sync-queue-v1";

export const SYNCABLE_STORAGE_KEYS: Array<{
  storageKey: string;
  recordType: CloudRecordType;
}> = [
  { storageKey: ASSETS_KEY, recordType: "assets" },
  { storageKey: PEOPLE_KEY, recordType: "people" },
  { storageKey: DOCS_KEY, recordType: "documents" },
  { storageKey: ASSET_SCHEMA_KEY, recordType: "schema" },
  { storageKey: CONSENTS_KEY, recordType: "consents" },
];

export function getSyncQueue(): SyncQueueItem[] {
  const queue = localStorageAdapter.read<SyncQueueItem[]>(SYNC_QUEUE_KEY);
  return Array.isArray(queue) ? queue : [];
}

export function saveSyncQueue(queue: SyncQueueItem[]): SyncQueueItem[] {
  localStorageAdapter.write(SYNC_QUEUE_KEY, queue, "pam-sync-updated");
  return queue;
}

export function enqueueAllKnownRecords(): SyncQueueItem[] {
  const now = new Date().toISOString();
  const existing = getSyncQueue();
  const byId = new Map(existing.map((item) => [item.id, item]));

  for (const { storageKey, recordType } of SYNCABLE_STORAGE_KEYS) {
    byId.set(`${recordType}:${storageKey}`, {
      id: `${recordType}:${storageKey}`,
      recordType,
      storageKey,
      operation: "upsert",
      queuedAt: byId.get(`${recordType}:${storageKey}`)?.queuedAt ?? now,
      attempts: byId.get(`${recordType}:${storageKey}`)?.attempts ?? 0,
    });
  }

  return saveSyncQueue([...byId.values()]);
}

export function markQueueAttempted(queue: SyncQueueItem[]): SyncQueueItem[] {
  const attempted = queue.map((item) => ({
    ...item,
    attempts: item.attempts + 1,
  }));
  return saveSyncQueue(attempted);
}

export function clearSyncQueue(): SyncQueueItem[] {
  return saveSyncQueue([]);
}

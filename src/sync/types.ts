import type { EncryptedPayload } from "../security/crypto";

export type CloudRecordType = "assets" | "people" | "documents" | "schema" | "consents";

export type SyncState = "disabled" | "idle" | "syncing" | "success" | "error";

export type CloudSyncStatus = {
  enabled: boolean;
  provider: string;
  state: SyncState;
  queuedCount: number;
  lastAttemptAt?: string;
  lastSuccessAt?: string;
  lastError?: string;
  uploadedCount?: number;
};

export type SyncQueueItem = {
  id: string;
  recordType: CloudRecordType;
  storageKey: string;
  operation: "upsert" | "delete";
  queuedAt: string;
  attempts: number;
};

export type EncryptedCloudRecord = {
  id: string;
  vaultId: string;
  type: CloudRecordType;
  encryptedPayload: EncryptedPayload;
  encryptionVersion: 1;
  updatedAt: string;
  deletedAt?: string;
};

export type CloudPushResult = {
  uploadedCount: number;
  cursor?: string;
};

export type CloudAdapter = {
  provider: string;
  isConfigured(): boolean;
  pushEncryptedRecords(records: EncryptedCloudRecord[]): Promise<CloudPushResult>;
};

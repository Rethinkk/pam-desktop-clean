import { API_URL, CLOUD_PROVIDER, CLOUD_SYNC_ENABLED } from "../lib/config";
import type { CloudAdapter, CloudPushResult, EncryptedCloudRecord } from "./types";

class DisabledCloudAdapter implements CloudAdapter {
  provider = CLOUD_PROVIDER;

  isConfigured(): boolean {
    return false;
  }

  async pushEncryptedRecords(
    _records: EncryptedCloudRecord[],
  ): Promise<CloudPushResult> {
    throw new Error("Cloud sync staat uit. Zet VITE_CLOUD_SYNC_ENABLED=true en configureer een provider.");
  }
}

class PendingProviderCloudAdapter implements CloudAdapter {
  provider = CLOUD_PROVIDER;

  isConfigured(): boolean {
    return CLOUD_SYNC_ENABLED && Boolean(API_URL) && CLOUD_PROVIDER !== "none";
  }

  async pushEncryptedRecords(
    _records: EncryptedCloudRecord[],
  ): Promise<CloudPushResult> {
    throw new Error(
      `Cloud provider '${CLOUD_PROVIDER}' heeft nog geen productie-adapter.`,
    );
  }
}

export function createCloudAdapter(): CloudAdapter {
  if (!CLOUD_SYNC_ENABLED) return new DisabledCloudAdapter();
  return new PendingProviderCloudAdapter();
}

export const cloudAdapter = createCloudAdapter();

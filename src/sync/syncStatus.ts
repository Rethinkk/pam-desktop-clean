import {
  CLOUD_PROVIDER,
  CLOUD_REGION_POLICY,
  CLOUD_SYNC_ENABLED,
  DATA_RESIDENCY,
} from "../lib/config";
import { localStorageAdapter } from "../storage/localStorageAdapter";
import type { CloudSyncStatus } from "./types";

const SYNC_STATUS_KEY = "pam-cloud-sync-status-v1";

function defaultStatus(): CloudSyncStatus {
  return {
    enabled: CLOUD_SYNC_ENABLED,
    provider: CLOUD_PROVIDER,
    dataResidency: DATA_RESIDENCY,
    regionPolicy: CLOUD_REGION_POLICY,
    state: CLOUD_SYNC_ENABLED ? "idle" : "disabled",
    queuedCount: 0,
  };
}

export function getCloudSyncStatus(): CloudSyncStatus {
  return {
    ...defaultStatus(),
    ...(localStorageAdapter.read<CloudSyncStatus>(SYNC_STATUS_KEY) ?? {}),
    enabled: CLOUD_SYNC_ENABLED,
    provider: CLOUD_PROVIDER,
    dataResidency: DATA_RESIDENCY,
    regionPolicy: CLOUD_REGION_POLICY,
  };
}

export function saveCloudSyncStatus(status: CloudSyncStatus): CloudSyncStatus {
  localStorageAdapter.write(SYNC_STATUS_KEY, status, "pam-sync-updated");
  return status;
}

export function updateCloudSyncStatus(
  patch: Partial<CloudSyncStatus>,
): CloudSyncStatus {
  return saveCloudSyncStatus({
    ...getCloudSyncStatus(),
    ...patch,
    enabled: CLOUD_SYNC_ENABLED,
    provider: CLOUD_PROVIDER,
    dataResidency: DATA_RESIDENCY,
    regionPolicy: CLOUD_REGION_POLICY,
  });
}

import {
  CLOUD_PROVIDER,
  CLOUD_PROVIDER_MATCHES_REGION,
  CLOUD_PROVIDER_SUPPORTED,
  CLOUD_REGION_POLICY,
  CLOUD_SYNC_ENABLED,
  CLOUD_SYNC_ENDPOINT,
} from "../lib/config";
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

class HttpCloudAdapter implements CloudAdapter {
  provider = CLOUD_PROVIDER;

  isConfigured(): boolean {
    return CLOUD_SYNC_ENABLED && Boolean(CLOUD_SYNC_ENDPOINT) && CLOUD_PROVIDER !== "none";
  }

  async pushEncryptedRecords(
    records: EncryptedCloudRecord[],
  ): Promise<CloudPushResult> {
    if (!this.isConfigured()) {
      throw new Error("Cloud sync endpoint is nog niet geconfigureerd.");
    }

    const response = await fetch(CLOUD_SYNC_ENDPOINT, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-PAM-Cloud-Provider": CLOUD_PROVIDER,
        "X-PAM-Region-Policy": CLOUD_REGION_POLICY,
      },
      body: JSON.stringify({
        records,
        provider: CLOUD_PROVIDER,
        regionPolicy: CLOUD_REGION_POLICY,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Cloud sync failed with ${response.status} ${response.statusText}`.trim(),
      );
    }

    const payload = (await response.json().catch(() => ({}))) as Partial<CloudPushResult>;
    return {
      uploadedCount: Number(payload.uploadedCount ?? records.length),
      cursor: payload.cursor,
    };
  }
}

class PendingProviderCloudAdapter extends HttpCloudAdapter {
  override async pushEncryptedRecords(
    records: EncryptedCloudRecord[],
  ): Promise<CloudPushResult> {
    if (!CLOUD_SYNC_ENDPOINT) {
      throw new Error(
        `Cloud provider '${CLOUD_PROVIDER}' is gekozen, maar VITE_CLOUD_SYNC_ENDPOINT ontbreekt.`,
      );
    }

    return super.pushEncryptedRecords(records);
  }
}

class UnsupportedProviderCloudAdapter extends DisabledCloudAdapter {
  override provider = CLOUD_PROVIDER;

  override async pushEncryptedRecords(): Promise<CloudPushResult> {
    throw new Error(
      `Cloud provider '${CLOUD_PROVIDER}' is niet toegestaan voor PAM production. Gebruik scaleway-eu voor PAM Europe, exoscale-ch voor PAM Switzerland of custom-us voor PAM United States.`,
    );
  }
}

class RegionMismatchCloudAdapter extends DisabledCloudAdapter {
  override provider = CLOUD_PROVIDER;

  override async pushEncryptedRecords(): Promise<CloudPushResult> {
    throw new Error(
      `Cloud provider '${CLOUD_PROVIDER}' past niet bij regio-policy '${CLOUD_REGION_POLICY}'.`,
    );
  }
}

export function createCloudAdapter(): CloudAdapter {
  if (!CLOUD_SYNC_ENABLED) return new DisabledCloudAdapter();
  if (!CLOUD_PROVIDER_SUPPORTED) {
    return new UnsupportedProviderCloudAdapter();
  }
  if (!CLOUD_PROVIDER_MATCHES_REGION) return new RegionMismatchCloudAdapter();
  return new PendingProviderCloudAdapter();
}

export const cloudAdapter = createCloudAdapter();

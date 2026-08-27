// src/lib/config.ts
import {
  DEFAULT_DATA_RESIDENCY,
  isProviderAllowedForPolicy,
  isSupportedCloudProvider,
  profileForResidency,
  normalizeRegionPolicy,
} from "./dataResidency";

export const ENV = import.meta.env.VITE_ENV || "development";
export const DEBUG = (import.meta.env.VITE_DEBUG ?? "false") === "true";
export const API_URL = import.meta.env.VITE_API_URL || "";
export const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || "";
export const STORAGE_KEY = import.meta.env.VITE_STORAGE_KEY || "pam-register-v1";
export const SECURE_LOCAL_STORAGE =
  (import.meta.env.VITE_SECURE_LOCAL_STORAGE ?? "false") === "true";
export const CLOUD_SYNC_ENABLED =
  (import.meta.env.VITE_CLOUD_SYNC_ENABLED ?? "false") === "true";
export const DATA_RESIDENCY =
  import.meta.env.VITE_PAM_DATA_RESIDENCY === "ch" || import.meta.env.VITE_PAM_DATA_RESIDENCY === "us"
    ? import.meta.env.VITE_PAM_DATA_RESIDENCY
    : DEFAULT_DATA_RESIDENCY;
const DEFAULT_RESIDENCY_PROFILE = profileForResidency(DATA_RESIDENCY);
export const CLOUD_PROVIDER =
  import.meta.env.VITE_CLOUD_PROVIDER || DEFAULT_RESIDENCY_PROFILE.cloudProvider;
export const CLOUD_SYNC_ENDPOINT =
  import.meta.env.VITE_CLOUD_SYNC_ENDPOINT ||
  (API_URL ? `${API_URL.replace(/\/$/, "")}/api/pam/sync/push` : "");
export const CLOUD_REGION_POLICY =
  normalizeRegionPolicy(import.meta.env.VITE_CLOUD_REGION_POLICY || DEFAULT_RESIDENCY_PROFILE.regionPolicy);
export const CLOUD_PROVIDER_SUPPORTED = isSupportedCloudProvider(CLOUD_PROVIDER);
export const CLOUD_PROVIDER_MATCHES_REGION = isProviderAllowedForPolicy(
  CLOUD_PROVIDER,
  CLOUD_REGION_POLICY,
);

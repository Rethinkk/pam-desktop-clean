export type PamDataResidency = "eu" | "ch" | "us";
export type PamRegionPolicy = "eu-only" | "ch-only" | "us-only";
export type PamCloudProvider =
  | "ovhcloud-eu"
  | "scaleway-eu"
  | "custom-eu"
  | "exoscale-ch"
  | "custom-ch"
  | "custom-us";

export type PamResidencyProfile = {
  dataResidency: PamDataResidency;
  label: string;
  cloudProvider: PamCloudProvider;
  regionPolicy: PamRegionPolicy;
};

export const PAM_RESIDENCY_PROFILES: Record<PamDataResidency, PamResidencyProfile> = {
  eu: {
    dataResidency: "eu",
    label: "PAM Europe",
    cloudProvider: "scaleway-eu",
    regionPolicy: "eu-only",
  },
  ch: {
    dataResidency: "ch",
    label: "PAM Switzerland",
    cloudProvider: "exoscale-ch",
    regionPolicy: "ch-only",
  },
  us: {
    dataResidency: "us",
    label: "PAM United States",
    cloudProvider: "custom-us",
    regionPolicy: "us-only",
  },
};

export const DEFAULT_DATA_RESIDENCY: PamDataResidency = "eu";

export function normalizeDataResidency(value: unknown): PamDataResidency {
  if (value === "us") return "us";
  return value === "ch" ? "ch" : DEFAULT_DATA_RESIDENCY;
}

export function normalizeRegionPolicy(value: unknown): PamRegionPolicy {
  if (value === "us-only") return "us-only";
  return value === "ch-only" ? "ch-only" : "eu-only";
}

export function profileForResidency(value: unknown): PamResidencyProfile {
  return PAM_RESIDENCY_PROFILES[normalizeDataResidency(value)];
}

export function isSupportedCloudProvider(value: string): value is PamCloudProvider {
  return ["ovhcloud-eu", "scaleway-eu", "custom-eu", "exoscale-ch", "custom-ch", "custom-us"].includes(value);
}

export function isProviderAllowedForPolicy(provider: string, regionPolicy: string): boolean {
  if (regionPolicy === "eu-only") {
    return ["ovhcloud-eu", "scaleway-eu", "custom-eu"].includes(provider);
  }
  if (regionPolicy === "ch-only") {
    return ["exoscale-ch", "custom-ch"].includes(provider);
  }
  if (regionPolicy === "us-only") {
    return provider === "custom-us";
  }
  return false;
}

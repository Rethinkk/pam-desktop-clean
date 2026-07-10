import type { Asset, ConsentRecord, DocumentItem, Person } from "../types";
import type { AssetSchema } from "../config/assetSchema";
import { SECURE_LOCAL_STORAGE } from "../lib/config";
import { localStorageAdapter } from "./localStorageAdapter";
import { secureLocalStorageAdapter } from "./secureLocalStorageAdapter";
import type {
  AssetRepository,
  ConsentRepository,
  DocumentRepository,
  LocalStoragePort,
  PersonRepository,
  SchemaRepository,
} from "./types";

export const ASSETS_KEY = "pam-assets-v1";
export const DOCS_KEY = "pam-docs-v1";
export const DOCS_SEQ_KEY = "pam-docs-seq";
export const PEOPLE_KEY = "pam-people-v1";
export const ASSET_SCHEMA_KEY = "pam-asset-schema-v1";
export const CONSENTS_KEY = "pam-consents-v1";

export const activeStorageAdapter: LocalStoragePort = SECURE_LOCAL_STORAGE
  ? secureLocalStorageAdapter
  : localStorageAdapter;

const ASSET_CANDIDATE_KEYS = [
  ASSETS_KEY,
  "pam-asset-register-v1",
  "pam-assets-register-v1",
];

function toArray<T>(value: unknown, key: string): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object" && Array.isArray((value as any)[key])) {
    return (value as any)[key] as T[];
  }
  return [];
}

function mergeAssets(lists: Asset[][]): Asset[] {
  const byKey = new Map<string, Asset>();
  for (const list of lists) {
    for (const asset of list || []) {
      if (!asset) continue;
      const key = (asset as any).id || (asset as any).assetNumber;
      if (!key || byKey.has(key)) continue;
      byKey.set(key, asset);
    }
  }
  return [...byKey.values()];
}

function normalizePerson(input: any): Person {
  const now = new Date().toISOString();
  return {
    id: input?.id ?? (crypto?.randomUUID?.() ?? String(Date.now())),
    name: input?.name ?? input?.fullName ?? "",
    fullName: input?.fullName ?? input?.name ?? "",
    role: input?.role ?? "overig",
    email: input?.email,
    phone: input?.phone,
    notes: input?.notes,
    createdAt: input?.createdAt ?? now,
    updatedAt: input?.updatedAt ?? now,
  };
}

function normalizeDocument(input: any): DocumentItem {
  const created = input?.createdAt ?? input?.uploadedAt ?? new Date().toISOString();
  const updated = input?.updatedAt ?? created;
  return {
    ...input,
    id:
      input?.id ??
      `doc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    docNumber: input?.docNumber,
    title: input?.title ?? input?.filename ?? "Document",
    fileName: input?.fileName ?? input?.filename ?? "",
    fileSize: input?.fileSize ?? input?.size ?? 0,
    mimeType: input?.mimeType ?? input?.mime ?? "application/octet-stream",
    fileDataUrl: input?.fileDataUrl ?? input?.dataUrl ?? "",
    assetIds: Array.isArray(input?.assetIds) ? input.assetIds : [],
    uploadedById: input?.uploadedById ?? input?.uploadedBy,
    recipientIds: Array.isArray(input?.recipientIds)
      ? input.recipientIds
      : Array.isArray(input?.recipients)
        ? input.recipients
        : [],
    createdAt: created,
    updatedAt: updated,
    notes: input?.notes,
    assetNumbers: Array.isArray(input?.assetNumbers) ? input.assetNumbers : undefined,
  };
}

function normalizeConsent(input: any): ConsentRecord {
  const now = new Date().toISOString();
  const grantedAt = input?.grantedAt ?? input?.createdAt ?? now;
  const role =
    input?.role === "notaris" ||
    input?.role === "fiscalist" ||
    input?.role === "accountant" ||
    input?.role === "executeur" ||
    input?.role === "adviseur" ||
    input?.role === "overig"
      ? input.role
      : "overig";
  const status =
    input?.status === "revoked" || input?.status === "expired" ? input.status : "active";
  const accessRights = Array.isArray(input?.accessRights)
    ? input.accessRights.filter((right: unknown) =>
        [
          "assets_read",
          "documents_read",
          "people_read",
          "report_download",
          "export_download",
        ].includes(String(right)),
      )
    : [];

  return {
    id: input?.id ?? `consent_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    professionalName: input?.professionalName ?? "",
    organizationName: input?.organizationName,
    professionalEmail: input?.professionalEmail,
    role,
    purpose: input?.purpose ?? "",
    accessRights,
    assetScope: input?.assetScope === "selected" ? "selected" : "all",
    assetIds: Array.isArray(input?.assetIds) ? input.assetIds : [],
    documentScope: input?.documentScope === "selected" ? "selected" : "all",
    documentIds: Array.isArray(input?.documentIds) ? input.documentIds : [],
    startsAt: input?.startsAt ?? grantedAt,
    expiresAt: input?.expiresAt,
    status,
    consentText: input?.consentText ?? "",
    grantedAt,
    revokedAt: input?.revokedAt,
    createdAt: input?.createdAt ?? grantedAt,
    updatedAt: input?.updatedAt ?? now,
  };
}

export function createAssetRepository(
  storage: LocalStoragePort = activeStorageAdapter,
): AssetRepository {
  function migrateToPrimary(): { assets: Asset[] } {
    const all: Asset[][] = [];

    for (const key of ASSET_CANDIDATE_KEYS) {
      const parsed = storage.read(key);
      const assets = toArray<Asset>(parsed, "assets");
      if (assets.length) all.push(assets);
    }

    for (const key of storage.keys()) {
      if (ASSET_CANDIDATE_KEYS.includes(key)) continue;
      if (!/pam|asset/i.test(key)) continue;
      const parsed = storage.read(key);
      const assets = toArray<Asset>(parsed, "assets");
      if (assets.length) all.push(assets);
    }

    const merged = mergeAssets(all);
    storage.write(ASSETS_KEY, { assets: merged }, "pam-assets-updated");
    return { assets: merged };
  }

  return {
    load() {
      const primary = toArray<Asset>(storage.read(ASSETS_KEY), "assets");
      if (primary.length) return { assets: primary };
      return migrateToPrimary();
    },

    save(next) {
      const payload = Array.isArray(next) ? { assets: next } : (next || { assets: [] });
      storage.write(ASSETS_KEY, payload, "pam-assets-updated");
    },
  };
}

export function createPersonRepository(
  storage: LocalStoragePort = activeStorageAdapter,
): PersonRepository {
  return {
    all() {
      return toArray<Person>(storage.read(PEOPLE_KEY), "people").map(normalizePerson);
    },

    saveAll(people) {
      storage.write(PEOPLE_KEY, { people: people.map(normalizePerson) }, "pam-people-updated");
    },
  };
}

export function createDocumentRepository(
  storage: LocalStoragePort = activeStorageAdapter,
): DocumentRepository {
  return {
    all() {
      return toArray<DocumentItem>(storage.read(DOCS_KEY), "docs").map(normalizeDocument);
    },

    saveAll(docs) {
      storage.write(DOCS_KEY, { docs: docs.map(normalizeDocument) }, "pam-docs-updated");
    },

    nextNumber() {
      const current = Number(storage.read<string | number>(DOCS_SEQ_KEY) ?? "0") + 1;
      storage.write(DOCS_SEQ_KEY, String(current));
      return `DOC-${String(current).padStart(4, "0")}`;
    },
  };
}

export function createSchemaRepository(
  storage: LocalStoragePort = activeStorageAdapter,
): SchemaRepository {
  return {
    load() {
      return storage.read<AssetSchema>(ASSET_SCHEMA_KEY);
    },

    save(schema) {
      storage.write(ASSET_SCHEMA_KEY, schema, "pam-schema-updated");
    },
  };
}

export function createConsentRepository(
  storage: LocalStoragePort = activeStorageAdapter,
): ConsentRepository {
  return {
    all() {
      return toArray<ConsentRecord>(storage.read(CONSENTS_KEY), "consents").map(normalizeConsent);
    },

    saveAll(consents) {
      storage.write(
        CONSENTS_KEY,
        { consents: consents.map(normalizeConsent) },
        "pam-consents-updated",
      );
    },

    upsert(consent) {
      const normalized = normalizeConsent(consent);
      const existing = this.all();
      const index = existing.findIndex((item) => item.id === normalized.id);
      const next =
        index >= 0
          ? existing.map((item) => (item.id === normalized.id ? normalized : item))
          : [normalized, ...existing];
      this.saveAll(next);
    },

    revoke(id) {
      const now = new Date().toISOString();
      let revoked: ConsentRecord | undefined;
      const next = this.all().map((item) => {
        if (item.id !== id) return item;
        revoked = {
          ...item,
          status: "revoked",
          revokedAt: now,
          updatedAt: now,
        };
        return revoked;
      });
      this.saveAll(next);
      return revoked;
    },
  };
}

export const assetRepository = createAssetRepository();
export const personRepository = createPersonRepository();
export const documentRepository = createDocumentRepository();
export const schemaRepository = createSchemaRepository();
export const consentRepository = createConsentRepository();

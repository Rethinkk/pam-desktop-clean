import type { Asset, DocumentItem, Person } from "../types";
import type { AssetSchema } from "../config/assetSchema";
import { localStorageAdapter } from "./localStorageAdapter";
import type {
  AssetRepository,
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

export function createAssetRepository(
  storage: LocalStoragePort = localStorageAdapter,
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
  storage: LocalStoragePort = localStorageAdapter,
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
  storage: LocalStoragePort = localStorageAdapter,
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
  storage: LocalStoragePort = localStorageAdapter,
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

export const assetRepository = createAssetRepository();
export const personRepository = createPersonRepository();
export const documentRepository = createDocumentRepository();
export const schemaRepository = createSchemaRepository();

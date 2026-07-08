import type { Asset, DocumentItem, Person } from "../types";
import type { AssetSchema } from "../config/assetSchema";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type StorageEventName =
  | "pam-assets-updated"
  | "pam-people-updated"
  | "pam-docs-updated"
  | "pam-schema-updated";

export type LocalStoragePort = {
  read<T = unknown>(key: string): T | undefined;
  write<T = unknown>(key: string, value: T, eventName?: StorageEventName): void;
  remove(key: string, eventName?: StorageEventName): void;
  keys(): string[];
};

export type AsyncStoragePort = {
  read<T = unknown>(key: string): Promise<T | undefined>;
  write<T = unknown>(key: string, value: T, eventName?: StorageEventName): Promise<void>;
  remove(key: string, eventName?: StorageEventName): Promise<void>;
  keys(): Promise<string[]>;
};

export type AssetRepository = {
  load(): { assets: Asset[] };
  save(next: { assets: Asset[] } | Asset[]): void;
};

export type PersonRepository = {
  all(): Person[];
  saveAll(people: Person[]): void;
};

export type DocumentRepository = {
  all(): DocumentItem[];
  saveAll(docs: DocumentItem[]): void;
  nextNumber(): string;
};

export type SchemaRepository = {
  load(): AssetSchema | undefined;
  save(schema: AssetSchema): void;
};

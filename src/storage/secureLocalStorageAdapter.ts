import { indexedDbEncryptedAdapter } from "./indexedDbEncryptedAdapter";
import type { LocalStoragePort, StorageEventName } from "./types";

const cache = new Map<string, unknown>();
let hydrated = false;

function emit(eventName?: StorageEventName) {
  if (!eventName || typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(eventName));
  } catch {}
}

function persistWrite<T>(key: string, value: T) {
  indexedDbEncryptedAdapter.write(key, value).catch((error) => {
    console.warn(`secure storage write failed for ${key}:`, error);
  });
}

function persistRemove(key: string) {
  indexedDbEncryptedAdapter.remove(key).catch((error) => {
    console.warn(`secure storage remove failed for ${key}:`, error);
  });
}

export async function hydrateSecureLocalStorageAdapter(): Promise<void> {
  cache.clear();
  const keys = await indexedDbEncryptedAdapter.keys();

  for (const key of keys) {
    const value = await indexedDbEncryptedAdapter.read(key);
    if (value !== undefined) cache.set(key, value);
  }

  hydrated = true;
}

export function isSecureLocalStorageHydrated(): boolean {
  return hydrated;
}

export const secureLocalStorageAdapter: LocalStoragePort = {
  read<T = unknown>(key: string): T | undefined {
    return cache.get(key) as T | undefined;
  },

  write<T = unknown>(key: string, value: T, eventName?: StorageEventName) {
    cache.set(key, value);
    emit(eventName);
    persistWrite(key, value);
  },

  remove(key: string, eventName?: StorageEventName) {
    cache.delete(key);
    emit(eventName);
    persistRemove(key);
  },

  keys(): string[] {
    return [...cache.keys()];
  },
};

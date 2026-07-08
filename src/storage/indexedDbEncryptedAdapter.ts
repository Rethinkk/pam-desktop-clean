import { decryptJson, encryptJson, type EncryptedPayload } from "../security/crypto";
import { getOrCreateDevVaultKey } from "../security/vaultKey";
import type { AsyncStoragePort, StorageEventName } from "./types";

const DB_NAME = "pam-secure-local";
const DB_VERSION = 1;
const STORE_NAME = "records";

type StoredEncryptedRecord = {
  key: string;
  payload: EncryptedPayload;
  updatedAt: string;
};

function emit(eventName?: StorageEventName) {
  if (!eventName || typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(eventName));
  } catch {}
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const request = action(tx.objectStore(STORE_NAME));

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export const indexedDbEncryptedAdapter: AsyncStoragePort = {
  async read<T = unknown>(key: string): Promise<T | undefined> {
    const record = await withStore<StoredEncryptedRecord | undefined>("readonly", (store) =>
      store.get(key),
    );
    if (!record) return undefined;

    const vaultKey = await getOrCreateDevVaultKey();
    return decryptJson<T>(record.payload, vaultKey);
  },

  async write<T = unknown>(
    key: string,
    value: T,
    eventName?: StorageEventName,
  ): Promise<void> {
    const vaultKey = await getOrCreateDevVaultKey();
    const payload = await encryptJson(value, vaultKey);
    await withStore("readwrite", (store) =>
      store.put({ key, payload, updatedAt: new Date().toISOString() }),
    );
    emit(eventName);
  },

  async remove(key: string, eventName?: StorageEventName): Promise<void> {
    await withStore("readwrite", (store) => store.delete(key));
    emit(eventName);
  },

  async keys(): Promise<string[]> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAllKeys();

      request.onsuccess = () => resolve(request.result.map(String));
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  },
};

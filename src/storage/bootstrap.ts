import { SECURE_LOCAL_STORAGE } from "../lib/config";
import { hydrateSecureLocalStorageAdapter } from "./secureLocalStorageAdapter";
import { migrateLocalStorageToEncryptedIndexedDb } from "./secureMigration";

export async function bootstrapStorage(): Promise<void> {
  if (!SECURE_LOCAL_STORAGE) return;
  await migrateLocalStorageToEncryptedIndexedDb();
  await hydrateSecureLocalStorageAdapter();
}

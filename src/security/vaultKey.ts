import { exportVaultKey, generateVaultKey, importVaultKey } from "./crypto";

const DEV_VAULT_KEY_STORAGE = "pam-dev-vault-key-v1";

let cachedVaultKey: CryptoKey | undefined;

export async function getOrCreateDevVaultKey(): Promise<CryptoKey> {
  if (cachedVaultKey) return cachedVaultKey;

  const stored = localStorage.getItem(DEV_VAULT_KEY_STORAGE);
  if (stored) {
    cachedVaultKey = await importVaultKey(stored);
    return cachedVaultKey;
  }

  const key = await generateVaultKey();
  localStorage.setItem(DEV_VAULT_KEY_STORAGE, await exportVaultKey(key));
  cachedVaultKey = key;
  return key;
}

export function clearCachedVaultKey() {
  cachedVaultKey = undefined;
}

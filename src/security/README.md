# PAM Security Module

This folder contains browser-side cryptography helpers used by secure local storage.

Current status:

- `crypto.ts` wraps Web Crypto AES-GCM JSON encryption/decryption.
- `vaultKey.ts` is a development bootstrap helper only.
- `secureLocalStorageAdapter.ts` lets repositories use encrypted IndexedDB through the existing synchronous storage boundary after bootstrap hydration.

Production warning:

The development vault key is stored locally so the encrypted IndexedDB migration can be exercised before the final unlock/recovery experience exists. Do not treat this helper as production key management.

Production key management still needs:

- hybrid user unlock flow: account login plus separate vault unlock
- passphrase, passkey or provider-backed vault-key wrapping
- recovery key UX before cloud sync is trusted for important data
- key rotation
- shared vault key distribution

The cloud backend must never store the raw vault key. Account recovery and vault recovery are related product flows, but they must not silently become the same secret.

# PAM Security Module

This folder contains browser-side cryptography helpers used by secure local storage.

Current status:

- `crypto.ts` wraps Web Crypto AES-GCM JSON encryption/decryption.
- `vaultKey.ts` is a development bootstrap helper only.

Production warning:

The development vault key is stored locally so the encrypted IndexedDB migration can be exercised before the final unlock/recovery experience exists. Do not treat this helper as production key management.

Production key management still needs:

- user unlock flow
- password/passkey or provider-backed key wrapping
- recovery key UX
- key rotation
- shared vault key distribution

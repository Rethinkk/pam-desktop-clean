const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();

export type EncryptedPayload = {
  version: 1;
  algorithm: "AES-GCM";
  iv: string;
  ciphertext: string;
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function assertCryptoAvailable() {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Web Crypto is not available in this environment.");
  }
}

export async function generateVaultKey(): Promise<CryptoKey> {
  assertCryptoAvailable();
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
}

export async function exportVaultKey(key: CryptoKey): Promise<string> {
  assertCryptoAvailable();
  const raw = await crypto.subtle.exportKey("raw", key);
  return bytesToBase64(new Uint8Array(raw));
}

export async function importVaultKey(rawBase64: string): Promise<CryptoKey> {
  assertCryptoAvailable();
  const raw = base64ToBytes(rawBase64);
  return crypto.subtle.importKey("raw", toArrayBuffer(raw), { name: "AES-GCM" }, true, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptJson(value: unknown, key: CryptoKey): Promise<EncryptedPayload> {
  assertCryptoAvailable();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = TEXT_ENCODER.encode(JSON.stringify(value));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

  return {
    version: 1,
    algorithm: "AES-GCM",
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  };
}

export async function decryptJson<T = unknown>(
  payload: EncryptedPayload,
  key: CryptoKey,
): Promise<T> {
  assertCryptoAvailable();
  const iv = base64ToBytes(payload.iv);
  const ciphertext = base64ToBytes(payload.ciphertext);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(ciphertext),
  );
  return JSON.parse(TEXT_DECODER.decode(decrypted)) as T;
}

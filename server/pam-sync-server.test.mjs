import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.PAM_SESSION_SECRET = "test-session-secret-that-is-long-enough-123456";
process.env.PAM_ALLOW_DEV_LOGIN = "true";
process.env.PAM_ALLOWED_ORIGIN = "http://127.0.0.1:5174";

const dataDir = await mkdtemp(join(tmpdir(), "pam-sync-test-"));
process.env.PAM_DATA_DIR = dataDir;

const { createPamSyncServer } = await import("./pam-sync-server.mjs");

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server.address()));
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Origin: "http://127.0.0.1:5174",
      ...options.headers,
    },
    body: options.body,
  });

  const text = await response.text();
  return {
    response,
    body: text ? JSON.parse(text) : {},
    setCookie: response.headers.get("set-cookie"),
  };
}

function encryptedRecord() {
  return {
    id: "assets:pam-assets-v1",
    vaultId: "dev-vault",
    type: "assets",
    encryptedPayload: {
      version: 1,
      algorithm: "AES-GCM",
      iv: "dGVzdC1pdi12YWx1ZQ",
      ciphertext: "dGVzdC1jaXBoZXJ0ZXh0",
    },
    encryptionVersion: 1,
    updatedAt: "2026-07-10T12:00:00.000Z",
  };
}

const server = createPamSyncServer();
const address = await listen(server);
const baseUrl = `http://127.0.0.1:${address.port}`;

try {
  const noSession = await request(baseUrl, "/api/pam/sync/push", {
    headers: {
      "Content-Type": "application/json",
      "X-PAM-Cloud-Provider": "ovhcloud-eu",
      "X-PAM-Region-Policy": "eu-only",
    },
    body: JSON.stringify({ records: [] }),
  });
  assert.equal(noSession.response.status, 401);

  const login = await request(baseUrl, "/api/pam/auth/dev-login");
  assert.equal(login.response.status, 200);
  assert.equal(login.body.ok, true);
  assert.match(login.setCookie ?? "", /pam_session=/);
  assert.match(login.setCookie ?? "", /HttpOnly/);

  const cookie = login.setCookie?.split(";")[0] ?? "";

  const blockedProvider = await request(baseUrl, "/api/pam/sync/push", {
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json",
      "X-PAM-Cloud-Provider": "aws",
      "X-PAM-Region-Policy": "eu-only",
    },
    body: JSON.stringify({ records: [] }),
  });
  assert.equal(blockedProvider.response.status, 400);
  assert.equal(blockedProvider.body.error, "Unsupported cloud provider.");

  const blockedRegion = await request(baseUrl, "/api/pam/sync/push", {
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json",
      "X-PAM-Cloud-Provider": "ovhcloud-eu",
      "X-PAM-Region-Policy": "global",
    },
    body: JSON.stringify({ records: [] }),
  });
  assert.equal(blockedRegion.response.status, 400);
  assert.equal(blockedRegion.body.error, "PAM requires eu-only region policy.");

  const invalidShape = await request(baseUrl, "/api/pam/sync/push", {
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json",
      "X-PAM-Cloud-Provider": "ovhcloud-eu",
      "X-PAM-Region-Policy": "eu-only",
    },
    body: JSON.stringify({ records: [{ id: "bad" }] }),
  });
  assert.equal(invalidShape.response.status, 400);
  assert.equal(invalidShape.body.error, "Invalid encrypted record shape.");

  const accepted = await request(baseUrl, "/api/pam/sync/push", {
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json",
      "X-PAM-Cloud-Provider": "ovhcloud-eu",
      "X-PAM-Region-Policy": "eu-only",
    },
    body: JSON.stringify({ records: [encryptedRecord()] }),
  });
  assert.equal(accepted.response.status, 200);
  assert.equal(accepted.body.uploadedCount, 1);
  assert.ok(accepted.body.cursor);

  const store = JSON.parse(await readFile(join(dataDir, "encrypted-records.json"), "utf8"));
  assert.equal(store.records["dev-vault"]["assets:pam-assets-v1"].type, "assets");
  assert.equal(
    store.records["dev-vault"]["assets:pam-assets-v1"].encryptedPayload.ciphertext,
    "dGVzdC1jaXBoZXJ0ZXh0",
  );

  const events = await readFile(join(dataDir, "sync-events.jsonl"), "utf8");
  assert.match(events, /"type":"sync.push"/);

  console.log("PAM sync server tests passed");
} finally {
  await close(server);
  await rm(dataDir, { recursive: true, force: true });
}

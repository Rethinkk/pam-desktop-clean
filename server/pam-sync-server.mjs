import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PAM_SERVER_PORT ?? 8787);
const SESSION_SECRET = process.env.PAM_SESSION_SECRET ?? "";
const ALLOWED_ORIGIN = process.env.PAM_ALLOWED_ORIGIN ?? "http://127.0.0.1:5174";
const DATA_DIR = process.env.PAM_DATA_DIR ?? join(__dirname, "data");
const ALLOW_DEV_LOGIN = process.env.PAM_ALLOW_DEV_LOGIN === "true";
const COOKIE_NAME = "pam_session";
const RECORDS_FILE = join(DATA_DIR, "encrypted-records.json");
const EVENTS_FILE = join(DATA_DIR, "sync-events.jsonl");
const ALLOWED_PROVIDERS = new Set(["ovhcloud-eu", "scaleway-eu", "custom-eu"]);

function assertConfigured() {
  if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
    throw new Error("PAM_SESSION_SECRET must be at least 32 characters.");
  }
}

function jsonResponse(response, statusCode, body, headers = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers,
  });
  response.end(JSON.stringify(body));
}

function corsHeaders(request) {
  const origin = request.headers.origin;
  if (!origin || origin !== ALLOWED_ORIGIN) return {};

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, X-PAM-Cloud-Provider, X-PAM-Region-Policy",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function reject(response, statusCode, message, headers = {}) {
  jsonResponse(response, statusCode, { error: message }, headers);
}

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function base64UrlDecode(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function sign(value) {
  return createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}

function createSessionCookie(session) {
  const payload = base64UrlEncode(session);
  return `${payload}.${sign(payload)}`;
}

function verifySessionCookie(value) {
  const [payload, signature] = String(value ?? "").split(".");
  if (!payload || !signature) return undefined;

  const expected = sign(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return undefined;
  }

  const session = base64UrlDecode(payload);
  if (!session?.userId || !session?.vaultId || Number(session.exp) < Date.now()) {
    return undefined;
  }
  return session;
}

function parseCookies(request) {
  const header = request.headers.cookie ?? "";
  const cookies = new Map();
  for (const part of header.split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (!rawKey) continue;
    cookies.set(rawKey, decodeURIComponent(rawValue.join("=")));
  }
  return cookies;
}

function getSession(request) {
  return verifySessionCookie(parseCookies(request).get(COOKIE_NAME));
}

async function readJsonBody(request, limitBytes = 1_000_000) {
  const chunks = [];
  let total = 0;

  for await (const chunk of request) {
    total += chunk.length;
    if (total > limitBytes) {
      throw new Error("Request body is too large.");
    }
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function isEncryptedPayload(value) {
  return (
    value &&
    value.version === 1 &&
    value.algorithm === "AES-GCM" &&
    typeof value.iv === "string" &&
    typeof value.ciphertext === "string"
  );
}

function isValidEncryptedRecord(record) {
  return (
    record &&
    typeof record.id === "string" &&
    ["assets", "people", "documents", "schema"].includes(record.type) &&
    record.encryptionVersion === 1 &&
    typeof record.updatedAt === "string" &&
    isEncryptedPayload(record.encryptedPayload)
  );
}

async function readRecordStore() {
  try {
    return JSON.parse(await readFile(RECORDS_FILE, "utf8"));
  } catch {
    return { records: {} };
  }
}

async function saveRecordStore(store) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(RECORDS_FILE, `${JSON.stringify(store, null, 2)}\n`);
}

async function appendSyncEvent(event) {
  await mkdir(DATA_DIR, { recursive: true });
  const existing = await readFile(EVENTS_FILE, "utf8").catch(() => "");
  await writeFile(EVENTS_FILE, `${existing}${JSON.stringify(event)}\n`);
}

async function handleDevLogin(request, response, headers) {
  if (!ALLOW_DEV_LOGIN) {
    return reject(response, 404, "Not found.", headers);
  }

  const now = Date.now();
  const session = {
    userId: "dev-user",
    vaultId: "dev-vault",
    exp: now + 1000 * 60 * 60 * 8,
  };

  jsonResponse(
    response,
    200,
    { ok: true, userId: session.userId, vaultId: session.vaultId },
    {
      ...headers,
      "Set-Cookie": `${COOKIE_NAME}=${encodeURIComponent(createSessionCookie(session))}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800`,
    },
  );
}

async function handleSyncPush(request, response, headers) {
  const provider = request.headers["x-pam-cloud-provider"];
  const regionPolicy = request.headers["x-pam-region-policy"];

  if (!ALLOWED_PROVIDERS.has(String(provider))) {
    return reject(response, 400, "Unsupported cloud provider.", headers);
  }
  if (regionPolicy !== "eu-only") {
    return reject(response, 400, "PAM requires eu-only region policy.", headers);
  }

  const session = getSession(request);
  if (!session) {
    return reject(response, 401, "Authentication required.", headers);
  }

  const body = await readJsonBody(request);
  if (!Array.isArray(body.records)) {
    return reject(response, 400, "records must be an array.", headers);
  }

  const invalid = body.records.find((record) => !isValidEncryptedRecord(record));
  if (invalid) {
    return reject(response, 400, "Invalid encrypted record shape.", headers);
  }

  const store = await readRecordStore();
  const vaultRecords = store.records[session.vaultId] ?? {};
  const now = new Date().toISOString();

  for (const record of body.records) {
    vaultRecords[record.id] = {
      id: record.id,
      vaultId: session.vaultId,
      ownerUserId: session.userId,
      type: record.type,
      encryptedPayload: record.encryptedPayload,
      encryptionVersion: record.encryptionVersion,
      clientUpdatedAt: record.updatedAt,
      serverUpdatedAt: now,
      deletedAt: record.deletedAt,
    };
  }

  store.records[session.vaultId] = vaultRecords;
  await saveRecordStore(store);
  await appendSyncEvent({
    id: randomUUID(),
    vaultId: session.vaultId,
    userId: session.userId,
    type: "sync.push",
    uploadedCount: body.records.length,
    provider,
    regionPolicy,
    createdAt: now,
  });

  jsonResponse(response, 200, {
    uploadedCount: body.records.length,
    cursor: now,
  }, headers);
}

async function router(request, response) {
  const headers = corsHeaders(request);
  if (request.method === "OPTIONS") {
    response.writeHead(204, headers);
    response.end();
    return;
  }

  try {
    assertConfigured();
    const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

    if (request.method === "POST" && url.pathname === "/api/pam/auth/dev-login") {
      await handleDevLogin(request, response, headers);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/pam/sync/push") {
      await handleSyncPush(request, response, headers);
      return;
    }

    reject(response, 404, "Not found.", headers);
  } catch (error) {
    reject(response, 500, error instanceof Error ? error.message : String(error), headers);
  }
}

createServer(router).listen(PORT, "127.0.0.1", () => {
  console.log(`PAM sync server listening on http://127.0.0.1:${PORT}`);
});

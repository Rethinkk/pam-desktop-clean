import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createFilePamStore } from "./pam-file-store.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PAM_SERVER_PORT ?? 8787);
const SESSION_SECRET = process.env.PAM_SESSION_SECRET ?? "";
const ALLOWED_ORIGIN = process.env.PAM_ALLOWED_ORIGIN ?? "http://127.0.0.1:5174";
const DATA_DIR = process.env.PAM_DATA_DIR ?? join(__dirname, "data");
const ALLOW_DEV_LOGIN = process.env.PAM_ALLOW_DEV_LOGIN === "true";
const COOKIE_NAME = "pam_session";
const pamStore = createFilePamStore(DATA_DIR);
const ALLOWED_PROVIDERS = new Set(["ovhcloud-eu", "scaleway-eu", "custom-eu", "exoscale-ch", "custom-ch", "custom-us"]);
const PASSWORD_KEY_LENGTH = 64;
const RESIDENCY_PROFILES = {
  eu: {
    dataResidency: "eu",
    cloudProvider: "scaleway-eu",
    regionPolicy: "eu-only",
  },
  ch: {
    dataResidency: "ch",
    cloudProvider: "exoscale-ch",
    regionPolicy: "ch-only",
  },
  us: {
    dataResidency: "us",
    cloudProvider: "custom-us",
    regionPolicy: "us-only",
  },
};

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
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

function createSetCookieHeader(session, maxAgeSeconds = 60 * 60 * 8) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${encodeURIComponent(createSessionCookie(session))}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}${secure}`;
}

function createExpiredCookieHeader() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`;
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
    ["assets", "people", "documents", "schema", "consents"].includes(record.type) &&
    record.encryptionVersion === 1 &&
    typeof record.updatedAt === "string" &&
    isEncryptedPayload(record.encryptedPayload)
  );
}

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function hashPassword(password, salt = randomBytes(16).toString("base64url")) {
  const hash = scryptSync(String(password), salt, PASSWORD_KEY_LENGTH).toString("base64url");
  return { salt, hash };
}

function normalizeDataResidency(value) {
  if (value === "us") return "us";
  return value === "ch" ? "ch" : "eu";
}

function profileForResidency(value) {
  return RESIDENCY_PROFILES[normalizeDataResidency(value)];
}

function isProviderAllowedForPolicy(provider, regionPolicy) {
  if (regionPolicy === "eu-only") {
    return ["ovhcloud-eu", "scaleway-eu", "custom-eu"].includes(provider);
  }
  if (regionPolicy === "ch-only") {
    return ["exoscale-ch", "custom-ch"].includes(provider);
  }
  if (regionPolicy === "us-only") {
    return provider === "custom-us";
  }
  return false;
}

function isPasswordMatch(password, user) {
  const { hash } = hashPassword(password, user.passwordSalt);
  const expected = Buffer.from(user.passwordHash);
  const actual = Buffer.from(hash);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function publicUser(user) {
  const profile = profileForResidency(user.dataResidency);
  return {
    id: user.id,
    workspaceId: user.workspaceId ?? user.vaultId,
    vaultId: user.vaultId,
    name: user.name,
    email: user.email,
    dataResidency: user.dataResidency ?? profile.dataResidency,
    cloudProvider: user.cloudProvider ?? profile.cloudProvider,
    regionPolicy: user.regionPolicy ?? profile.regionPolicy,
    createdAt: user.createdAt,
  };
}

async function handleDevLogin(request, response, headers) {
  if (!ALLOW_DEV_LOGIN) {
    return reject(response, 404, "Not found.", headers);
  }

  const now = Date.now();
  const session = {
    userId: "dev-user",
    workspaceId: "dev-workspace",
    vaultId: "dev-vault",
    dataResidency: "eu",
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

async function createAuthSession(user, response, headers) {
  const now = Date.now();
  const session = {
    userId: user.id,
    workspaceId: user.workspaceId ?? user.vaultId,
    vaultId: user.vaultId,
    dataResidency: normalizeDataResidency(user.dataResidency),
    exp: now + 1000 * 60 * 60 * 8,
  };

  jsonResponse(
    response,
    200,
    { ok: true, user: publicUser(user) },
    {
      ...headers,
      "Set-Cookie": createSetCookieHeader(session),
    },
  );
}

async function handleRegister(request, response, headers) {
  const body = await readJsonBody(request, 50_000);
  const name = String(body.name ?? "").trim();
  const email = normalizeEmail(body.email);
  const password = String(body.password ?? "");
  const profile = profileForResidency(body.dataResidency);
  const cloudProvider = String(body.cloudProvider ?? profile.cloudProvider);
  const regionPolicy = String(body.regionPolicy ?? profile.regionPolicy);

  if (!name) return reject(response, 400, "Name is required.", headers);
  if (!email.includes("@")) return reject(response, 400, "Valid email is required.", headers);
  if (password.length < 10) return reject(response, 400, "Password must be at least 10 characters.", headers);
  if (!ALLOWED_PROVIDERS.has(cloudProvider)) return reject(response, 400, "Unsupported cloud provider.", headers);
  if (!isProviderAllowedForPolicy(cloudProvider, regionPolicy)) {
    return reject(response, 400, "Cloud provider does not match the selected data residency.", headers);
  }

  const store = await pamStore.readUserStore();
  if (store.users.some((user) => user.email === email)) {
    return reject(response, 409, "A user with this email already exists.", headers);
  }

  const passwordResult = hashPassword(password);
  const now = new Date().toISOString();
  const user = {
    id: randomUUID(),
    workspaceId: randomUUID(),
    vaultId: randomUUID(),
    name,
    email,
    dataResidency: profile.dataResidency,
    cloudProvider,
    regionPolicy,
    createdAt: now,
    passwordSalt: passwordResult.salt,
    passwordHash: passwordResult.hash,
  };

  store.users.push(user);
  await pamStore.saveUserStore(store);
  await pamStore.appendSyncEvent({
    id: randomUUID(),
    vaultId: user.vaultId,
    userId: user.id,
    type: "auth.register",
    dataResidency: user.dataResidency,
    cloudProvider: user.cloudProvider,
    regionPolicy: user.regionPolicy,
    createdAt: now,
  });
  await createAuthSession(user, response, headers);
}

async function handleLogin(request, response, headers) {
  const body = await readJsonBody(request, 50_000);
  const email = normalizeEmail(body.email);
  const password = String(body.password ?? "");
  const store = await pamStore.readUserStore();
  const user = store.users.find((candidate) => candidate.email === email);

  if (!user || !isPasswordMatch(password, user)) {
    return reject(response, 401, "Invalid email or password.", headers);
  }

  await pamStore.appendSyncEvent({
    id: randomUUID(),
    vaultId: user.vaultId,
    userId: user.id,
    type: "auth.login",
    createdAt: new Date().toISOString(),
  });
  await createAuthSession(user, response, headers);
}

async function handleSession(request, response, headers) {
  const session = getSession(request);
  if (!session) {
    jsonResponse(response, 200, { authenticated: false }, headers);
    return;
  }

  const store = await pamStore.readUserStore();
  const user = store.users.find((candidate) => candidate.id === session.userId);
  if (!user && session.userId === "dev-user") {
    jsonResponse(response, 200, {
      authenticated: true,
      user: {
        id: session.userId,
        workspaceId: session.workspaceId ?? session.vaultId,
        vaultId: session.vaultId,
        name: "PAM Dev User",
        email: "dev@pam.local",
        dataResidency: "eu",
        cloudProvider: "scaleway-eu",
        regionPolicy: "eu-only",
        createdAt: new Date().toISOString(),
      },
    }, headers);
    return;
  }
  if (!user) {
    jsonResponse(response, 200, { authenticated: false }, headers);
    return;
  }

  jsonResponse(response, 200, { authenticated: true, user: publicUser(user) }, headers);
}

async function handleLogout(response, headers) {
  jsonResponse(
    response,
    200,
    { ok: true },
    {
      ...headers,
      "Set-Cookie": createExpiredCookieHeader(),
    },
  );
}

async function handleSyncPush(request, response, headers) {
  const provider = request.headers["x-pam-cloud-provider"];
  const regionPolicy = request.headers["x-pam-region-policy"];

  if (!ALLOWED_PROVIDERS.has(String(provider))) {
    return reject(response, 400, "Unsupported cloud provider.", headers);
  }
  if (!isProviderAllowedForPolicy(String(provider), String(regionPolicy))) {
    return reject(response, 400, "Cloud provider does not match region policy.", headers);
  }

  const session = getSession(request);
  if (!session) {
    return reject(response, 401, "Authentication required.", headers);
  }

  const users = await pamStore.readUserStore();
  const user = users.users.find((candidate) => candidate.id === session.userId);
  if (user) {
    const publicSessionUser = publicUser(user);
    if (provider !== publicSessionUser.cloudProvider || regionPolicy !== publicSessionUser.regionPolicy) {
      return reject(response, 403, "Cloud route does not match this workspace.", headers);
    }
  }

  const body = await readJsonBody(request);
  if (!Array.isArray(body.records)) {
    return reject(response, 400, "records must be an array.", headers);
  }

  const invalid = body.records.find((record) => !isValidEncryptedRecord(record));
  if (invalid) {
    return reject(response, 400, "Invalid encrypted record shape.", headers);
  }

  const store = await pamStore.readRecordStore();
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
  await pamStore.saveRecordStore(store);
  await pamStore.appendSyncEvent({
    id: randomUUID(),
    vaultId: session.vaultId,
    userId: session.userId,
    type: "sync.push",
    uploadedCount: body.records.length,
    provider,
    regionPolicy,
    dataResidency: user ? publicUser(user).dataResidency : session.dataResidency,
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
    if (request.method === "POST" && url.pathname === "/api/pam/auth/register") {
      await handleRegister(request, response, headers);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/pam/auth/login") {
      await handleLogin(request, response, headers);
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/pam/auth/session") {
      await handleSession(request, response, headers);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/pam/auth/logout") {
      await handleLogout(response, headers);
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

export function createPamSyncServer() {
  return createServer(router);
}

export function startPamSyncServer(port = PORT, host = "127.0.0.1") {
  const server = createPamSyncServer();
  server.listen(port, host, () => {
    const address = server.address();
    const actualPort = typeof address === "object" && address ? address.port : port;
    console.log(`PAM sync server listening on http://${host}:${actualPort}`);
  });
  return server;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startPamSyncServer();
}

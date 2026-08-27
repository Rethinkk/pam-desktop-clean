import assert from "node:assert/strict";
import pg from "pg";
import { runMigrations } from "./run-migrations.mjs";

const { Client } = pg;

if (!process.env.PAM_DATABASE_URL) {
  console.log("PAM PostgreSQL integration test skipped: PAM_DATABASE_URL is not set.");
  process.exit(0);
}

if (process.env.PAM_DATABASE_INTEGRATION_TEST !== "true") {
  console.log(
    "PAM PostgreSQL integration test skipped: set PAM_DATABASE_INTEGRATION_TEST=true to run.",
  );
  process.exit(0);
}

process.env.PAM_SESSION_SECRET = "postgres-test-session-secret-that-is-long-enough";
process.env.PAM_ALLOW_DEV_LOGIN = "false";
process.env.PAM_ALLOWED_ORIGIN = "http://127.0.0.1:5174";
process.env.PAM_FORCE_FILE_STORE = "false";

const databaseSsl = process.env.PAM_DATABASE_SSL === "true"
  ? { rejectUnauthorized: true }
  : undefined;

const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const testEmail = `pam.integration+${suffix}@example.test`;

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
    method: options.method ?? "POST",
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

function encryptedRecord(type = "assets", storageKey = "pam-assets-v1") {
  return {
    id: `${type}:${storageKey}`,
    type,
    encryptedPayload: {
      version: 1,
      algorithm: "AES-GCM",
      iv: "cG9zdGdyZXMtdGVzdC1pdg",
      ciphertext: "cG9zdGdyZXMtdGVzdC1jaXBoZXJ0ZXh0",
    },
    encryptionVersion: 1,
    updatedAt: "2026-08-27T09:00:00.000Z",
  };
}

async function cleanupTestUser() {
  if (!testEmail.startsWith("pam.integration+")) {
    throw new Error("Refusing to clean up a non-integration-test user.");
  }

  const client = new Client({
    connectionString: process.env.PAM_DATABASE_URL,
    ssl: databaseSsl,
  });
  await client.connect();

  try {
    const users = await client.query("select id from users where email = $1", [testEmail]);
    const userIds = users.rows.map((row) => row.id);
    if (!userIds.length) return;

    await client.query("begin");
    await client.query("delete from sync_events where user_id = any($1::uuid[])", [userIds]);
    await client.query("delete from audit_events where user_id = any($1::uuid[])", [userIds]);
    await client.query("delete from consent_records where user_id = any($1::uuid[])", [userIds]);
    await client.query("delete from document_objects where owner_user_id = any($1::uuid[])", [userIds]);
    await client.query("delete from encrypted_records where owner_user_id = any($1::uuid[])", [userIds]);
    await client.query("delete from sessions where user_id = any($1::uuid[])", [userIds]);
    await client.query("delete from vault_members where user_id = any($1::uuid[])", [userIds]);
    await client.query("delete from workspace_members where user_id = any($1::uuid[])", [userIds]);
    await client.query("delete from vaults where owner_user_id = any($1::uuid[])", [userIds]);
    await client.query("delete from workspaces where owner_user_id = any($1::uuid[])", [userIds]);
    await client.query("delete from users where id = any($1::uuid[])", [userIds]);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

async function readPersistedState(userId) {
  const client = new Client({
    connectionString: process.env.PAM_DATABASE_URL,
    ssl: databaseSsl,
  });
  await client.connect();

  try {
    const result = await client.query(
      `
        select
          users.email,
          workspaces.id as workspace_id,
          workspaces.data_residency,
          workspaces.cloud_provider,
          workspaces.region_policy,
          vaults.id as vault_id,
          count(distinct encrypted_records.id)::int as encrypted_record_count,
          count(distinct sync_events.id)::int as sync_event_count
        from users
        join workspaces on workspaces.owner_user_id = users.id
        join vaults on vaults.workspace_id = workspaces.id and vaults.owner_user_id = users.id
        left join encrypted_records on encrypted_records.owner_user_id = users.id
        left join sync_events on sync_events.user_id = users.id
        where users.id = $1
        group by users.email, workspaces.id, vaults.id
      `,
      [userId],
    );

    return result.rows[0];
  } finally {
    await client.end();
  }
}

await runMigrations({
  databaseUrl: process.env.PAM_DATABASE_URL,
  ssl: databaseSsl,
});
await cleanupTestUser();

const server = createPamSyncServer();
const address = await listen(server);
const baseUrl = `http://127.0.0.1:${address.port}`;

try {
  const registered = await request(baseUrl, "/api/pam/auth/register", {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "PAM Integration Tester",
      email: testEmail,
      password: "veilig-wachtwoord-123",
      dataResidency: "eu",
      cloudProvider: "scaleway-eu",
      regionPolicy: "eu-only",
    }),
  });
  assert.equal(registered.response.status, 200);
  assert.equal(registered.body.ok, true);
  assert.equal(registered.body.user.email, testEmail);
  assert.equal(registered.body.user.cloudProvider, "scaleway-eu");
  assert.match(registered.setCookie ?? "", /pam_session=/);

  const cookie = registered.setCookie?.split(";")[0] ?? "";

  const session = await request(baseUrl, "/api/pam/auth/session", {
    method: "GET",
    headers: { Cookie: cookie },
  });
  assert.equal(session.response.status, 200);
  assert.equal(session.body.authenticated, true);
  assert.equal(session.body.user.name, "PAM Integration Tester");

  const pushed = await request(baseUrl, "/api/pam/sync/push", {
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json",
      "X-PAM-Cloud-Provider": "scaleway-eu",
      "X-PAM-Region-Policy": "eu-only",
    },
    body: JSON.stringify({
      records: [
        encryptedRecord("assets", "pam-assets-v1"),
        encryptedRecord("documents", "pam-documents-v1"),
      ],
    }),
  });
  assert.equal(pushed.response.status, 200);
  assert.equal(pushed.body.uploadedCount, 2);
  assert.ok(pushed.body.cursor);

  const persisted = await readPersistedState(registered.body.user.id);
  assert.equal(persisted.email, testEmail);
  assert.equal(persisted.data_residency, "eu");
  assert.equal(persisted.cloud_provider, "scaleway-eu");
  assert.equal(persisted.region_policy, "eu-only");
  assert.equal(persisted.encrypted_record_count, 2);
  assert.equal(persisted.sync_event_count, 1);

  console.log("PAM PostgreSQL integration test passed");
} finally {
  await close(server);
  await cleanupTestUser();
}

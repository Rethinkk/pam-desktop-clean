import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createObjectStorageClient, createObjectStorageConfig } from "./pam-object-storage-client.mjs";

const config = createObjectStorageConfig();

if (!config) {
  console.log("PAM Object Storage integration test skipped: object storage env is not set.");
  process.exit(0);
}

if (process.env.PAM_OBJECT_STORAGE_INTEGRATION_TEST !== "true") {
  console.log(
    "PAM Object Storage integration test skipped: set PAM_OBJECT_STORAGE_INTEGRATION_TEST=true to run.",
  );
  process.exit(0);
}

const client = createObjectStorageClient(config);
const objectKey = `pam-integration-tests/${Date.now()}-${randomUUID()}.txt`;
const objectBody = `PAM Object Storage integration test ${new Date().toISOString()}`;

try {
  const put = await client.putObject(objectKey, objectBody);
  assert.equal(put.status, 200);

  const get = await client.getObject(objectKey);
  assert.equal(get.status, 200);
  assert.equal(get.text, objectBody);

  const deleted = await client.deleteObject(objectKey);
  assert.ok([200, 204].includes(deleted.status));

  const missing = await client.getObject(objectKey);
  assert.equal(missing.status, 404);

  console.log("PAM Object Storage integration test passed");
} finally {
  await client.deleteObject(objectKey).catch(() => undefined);
}

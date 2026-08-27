import { createFilePamStore } from "./pam-file-store.mjs";
import { createPostgresPamStore } from "./pam-postgres-store.mjs";

export function createPamStore({ dataDir, databaseUrl, forceFileStore = false }) {
  if (databaseUrl && !forceFileStore) {
    return createPostgresPamStore(databaseUrl, {
      ssl: process.env.PAM_DATABASE_SSL === "true" ? { rejectUnauthorized: true } : undefined,
    });
  }

  return createFilePamStore(dataDir);
}

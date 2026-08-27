import { createFilePamStore } from "./pam-file-store.mjs";
import { createDatabaseConnectionConfig } from "./pam-database-config.mjs";
import { createPostgresPamStore } from "./pam-postgres-store.mjs";

export function createPamStore({ dataDir, databaseUrl, forceFileStore = false }) {
  const databaseConfig = createDatabaseConnectionConfig({
    ...process.env,
    PAM_DATABASE_URL: databaseUrl,
  });

  if (databaseConfig && !forceFileStore) {
    return createPostgresPamStore(databaseConfig);
  }

  return createFilePamStore(dataDir);
}

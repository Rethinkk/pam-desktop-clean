import { readFileSync } from "node:fs";

export function createDatabaseSslOptions(env = process.env) {
  if (env.PAM_DATABASE_SSL !== "true") {
    return undefined;
  }

  const servername = env.PAM_DATABASE_TLS_SERVERNAME;
  const servernameOption = servername ? { servername } : {};

  if (env.PAM_DATABASE_CA_CERT) {
    return {
      ca: env.PAM_DATABASE_CA_CERT,
      rejectUnauthorized: true,
      ...servernameOption,
    };
  }

  if (env.PAM_DATABASE_CA_FILE) {
    return {
      ca: readFileSync(env.PAM_DATABASE_CA_FILE, "utf8"),
      rejectUnauthorized: true,
      ...servernameOption,
    };
  }

  return { rejectUnauthorized: true, ...servernameOption };
}

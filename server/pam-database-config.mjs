import { createDatabaseSslOptions } from "./pam-database-ssl.mjs";

export function createDatabaseConnectionConfig(env = process.env) {
  const ssl = createDatabaseSslOptions(env);

  if (env.PAM_DATABASE_HOST) {
    return {
      host: env.PAM_DATABASE_HOST,
      port: Number(env.PAM_DATABASE_PORT ?? 5432),
      database: env.PAM_DATABASE_NAME,
      user: env.PAM_DATABASE_USER,
      password: env.PAM_DATABASE_PASSWORD,
      ssl,
    };
  }

  if (env.PAM_DATABASE_URL) {
    return {
      connectionString: env.PAM_DATABASE_URL,
      ssl,
    };
  }

  return undefined;
}

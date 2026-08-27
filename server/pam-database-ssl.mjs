import { readFileSync } from "node:fs";

function normalizeCertificate(value) {
  const trimmed = value.trim();
  if (trimmed.includes("-----BEGIN CERTIFICATE-----")) {
    return trimmed.replace(/\\n/g, "\n");
  }

  const decoded = Buffer.from(trimmed, "base64").toString("utf8").trim();
  if (decoded.includes("-----BEGIN CERTIFICATE-----")) {
    return decoded;
  }

  return trimmed;
}

export function createDatabaseSslOptions(env = process.env) {
  if (env.PAM_DATABASE_SSL !== "true") {
    return undefined;
  }

  const servername = env.PAM_DATABASE_TLS_SERVERNAME;
  const servernameOption = servername ? { servername } : {};

  if (env.PAM_DATABASE_CA_CERT_BASE64) {
    return {
      ca: normalizeCertificate(env.PAM_DATABASE_CA_CERT_BASE64),
      rejectUnauthorized: true,
      ...servernameOption,
    };
  }

  if (env.PAM_DATABASE_CA_CERT) {
    return {
      ca: normalizeCertificate(env.PAM_DATABASE_CA_CERT),
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

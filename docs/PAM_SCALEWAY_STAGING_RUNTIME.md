# PAM Scaleway Staging Runtime

This document describes the first cloud runtime for the PAM backend. It is the
bridge between the local proof of concept and a production-ready hosted API.

## Runtime Shape

- Frontend: Vercel for the current public web app.
- Backend: containerized Node.js sync API.
- Database: Scaleway Managed PostgreSQL in AMS.
- Documents: Scaleway Object Storage in `nl-ams`, encrypted at rest.
- Secrets: configured only in the backend runtime environment.

The backend image is built from `Dockerfile` and starts:

```text
node server/pam-sync-server.mjs
```

The container exposes port `8787` by default. If Scaleway injects a `PORT`
variable, PAM will use that value first.

## Health Check

The backend exposes:

```text
GET /api/pam/health
```

The response intentionally contains only non-secret readiness flags:

```json
{
  "ok": true,
  "service": "pam-sync-server",
  "sessionSecretConfigured": true,
  "databaseConfigured": true,
  "fileStoreForced": false,
  "objectStorageConfigured": true,
  "uptimeSeconds": 12
}
```

The endpoint returns `503` until the session secret and database configuration
are present. Local development can explicitly use `PAM_FORCE_FILE_STORE=true`.
Object Storage readiness is reported separately so we can detect document-storage
misconfiguration without leaking credentials.

## Required Backend Environment

Core runtime:

```text
NODE_ENV=production
PAM_SERVER_HOST=0.0.0.0
# Optional fallback. Scaleway can also inject PORT.
PAM_SERVER_PORT=8787
PAM_SESSION_SECRET=<backend-secret-minimum-32-characters>
PAM_ALLOWED_ORIGIN=https://pam-desktop-clean.vercel.app
PAM_ALLOW_DEV_LOGIN=false
```

Database:

```text
PAM_DATABASE_HOST=<scaleway-postgres-host>
PAM_DATABASE_PORT=1135
PAM_DATABASE_NAME=pam_staging
PAM_DATABASE_USER=pam_app
PAM_DATABASE_PASSWORD=<database-password>
PAM_DATABASE_SSL=true
PAM_DATABASE_TLS_SERVERNAME=<scaleway-postgres-host>
```

For the Scaleway PostgreSQL CA certificate, use one of these:

```text
PAM_DATABASE_CA_FILE=/mounted/secrets/rdb-pam-europe-staging-db.pem
```

or:

```text
PAM_DATABASE_CA_CERT=<full-pem-certificate-as-secret>
```

Object Storage:

```text
PAM_OBJECT_STORAGE_BUCKET=pam-europe-staging-documents
PAM_OBJECT_STORAGE_REGION=nl-ams
PAM_OBJECT_STORAGE_ENDPOINT=https://s3.nl-ams.scw.cloud
PAM_OBJECT_STORAGE_ACCESS_KEY=<access-key-id>
PAM_OBJECT_STORAGE_SECRET_KEY=<secret-key>
```

## Deployment Notes

- Do not copy `.env.scaleway-staging` into a container image.
- Store database passwords, access keys and certificates as runtime secrets.
- Keep `PAM_ALLOWED_ORIGIN` restricted to the deployed frontend URL.
- Run migrations before switching the frontend sync endpoint to the backend.
- After deployment, test `/api/pam/health` before running account or sync tests.

The deployment runbook is maintained in
`docs/PAM_SCALEWAY_DEPLOYMENT_RUNBOOK.md`.

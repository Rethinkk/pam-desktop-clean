# PAM Scaleway Deployment Runbook

This runbook turns the prepared backend runtime into a deployed Scaleway staging
API.

## 1. Create Container Registry Namespace

In Scaleway Console:

- Open Container Registry.
- Create a private namespace in `nl-ams`.
- Copy the registry endpoint. It should look like:

```text
rg.nl-ams.scw.cloud/<namespace>
```

## 2. Add GitHub Secrets

In GitHub repository settings, add these Actions secrets:

```text
SCALEWAY_API_KEY=<scaleway-secret-key>
CONTAINER_REGISTRY_ENDPOINT=rg.nl-ams.scw.cloud/<namespace>
```

Only the Scaleway secret key is used for Docker login. Do not store PAM database
or Object Storage credentials in GitHub unless they are needed for a specific
GitHub-hosted deployment step.

The registry endpoint must include the namespace because Scaleway's Docker login
uses this form:

```text
docker login rg.nl-ams.scw.cloud/<namespace> -u nologin --password-stdin
```

## 3. Build Backend Image

In GitHub Actions, run:

```text
Build PAM backend image
```

This workflow is manual-only so it will not fail before the Scaleway secrets are
configured.

The workflow pushes two tags:

```text
rg.nl-ams.scw.cloud/<namespace>/pam-sync-server:<commit-sha>
rg.nl-ams.scw.cloud/<namespace>/pam-sync-server:staging
```

The backend image deliberately uses `server-runtime-package.json` instead of the
frontend package manifest. This keeps the runtime container small and limits it
to the server dependency required for PostgreSQL.

## 4. Deploy Scaleway Serverless Container

In Scaleway Console:

- Open Serverless Containers.
- Create or select a namespace in `nl-ams`.
- Deploy from Scaleway Container Registry.
- Select image `pam-sync-server:staging`.
- Configure the container port as `8787` unless Scaleway injects another `PORT`.
- Add the backend environment variables from `docs/PAM_SCALEWAY_STAGING_RUNTIME.md`.
- Keep minimum scale low for staging.

The PAM server listens on the `PORT` environment variable first, then falls back
to `PAM_SERVER_PORT`, then `8787`.

## 5. Verify Backend

After deployment, open:

```text
https://<scaleway-container-url>/api/pam/health
```

Expected staging result:

```json
{
  "ok": true,
  "service": "pam-sync-server",
  "sessionSecretConfigured": true,
  "databaseConfigured": true,
  "fileStoreForced": false,
  "objectStorageConfigured": true
}
```

If `ok` is false, fix backend environment variables before connecting the
frontend.

## 6. Connect Vercel Frontend

Use `.env.vercel-staging.example` as the checklist for Vercel environment
variables. Replace the placeholder backend URL with the deployed Scaleway URL.

Required frontend values:

```text
VITE_AUTH_API_URL=https://pameuropestagingapie8be34a0-pam-sync-server.functions.fnc.nl-ams.scw.cloud
VITE_API_URL=https://pameuropestagingapie8be34a0-pam-sync-server.functions.fnc.nl-ams.scw.cloud
VITE_CLOUD_SYNC_ENDPOINT=https://pameuropestagingapie8be34a0-pam-sync-server.functions.fnc.nl-ams.scw.cloud/api/pam/sync/push
VITE_CLOUD_SYNC_ENABLED=true
VITE_CLOUD_PROVIDER=scaleway-eu
VITE_CLOUD_REGION_POLICY=eu-only
```

After changing Vercel variables, redeploy the frontend and run a full user flow:

- Create account.
- Log out and log in.
- Create asset.
- Link document.
- Confirm document appears in register.
- Confirm sync push reaches backend.

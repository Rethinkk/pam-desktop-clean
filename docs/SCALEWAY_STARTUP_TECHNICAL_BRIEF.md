# PAM Technical Brief For Scaleway Startup Program

Status: draft input for startup application

This document describes PAM from an architecture and technical infrastructure
perspective. The commercial startup paragraph, founder story and market
positioning can be added separately.

## Product Summary

PAM stands for Personal Asset Manager. PAM is a local-first web application that
helps people structure, document and manage important personal assets,
documents, people, permissions and context.

PAM is intended for sensitive private situations where clarity, trust and
continuity matter. Typical contexts include family circumstances, estate
planning, fiscal preparation, professional advisory workflows and personal
administration.

The product direction is simple for the user and serious underneath:

- calm consumer-grade user experience;
- strong privacy and security posture;
- local-first data handling;
- encrypted cloud sync;
- explicit consent for professional access;
- data residency as a product feature.

## Why Scaleway

PAM release 1 is designed as **PAM Europe**. Scaleway is the preferred cloud
provider for this first release because it supports the European positioning of
PAM and offers the services needed for a secure production architecture:

- managed PostgreSQL;
- object storage;
- compute/runtime for the PAM API;
- secrets management;
- private networking where available;
- monitoring and operational tooling;
- European cloud positioning.

For PAM, choosing Scaleway is not only a technical decision. It supports the
trust story: sensitive personal information should be handled by a European
cloud architecture that matches the promise made to users.

## Data Residency Strategy

PAM is one product with multiple data-residency profiles.

| Profile | Code | Provider profile | Region policy | Status |
| --- | --- | --- | --- | --- |
| PAM Europe | `eu` | `scaleway-eu` | `eu-only` | Release 1 target |
| PAM Switzerland | `ch` | `exoscale-ch` | `ch-only` | Premium profile prepared |
| PAM United States | `us` | `custom-us` | `us-only` | Expansion profile prepared |

Release 1 focuses on PAM Europe. Switzerland and United States are prepared in
the architecture so PAM does not need a future rewrite when international
expansion becomes relevant.

## Target Architecture

```text
Browser app
  -> IndexedDB encrypted local cache
  -> Sync queue
  -> PAM API
    -> Managed PostgreSQL
    -> Object Storage
    -> Audit/event log
```

The application keeps a local encrypted cache and synchronizes encrypted record
groups to the backend. The backend is responsible for account, workspace,
vault, consent, sync and operational metadata. Sensitive PAM content is designed
to remain encrypted before it is stored in the cloud.

## Required Scaleway Services

For the first production/staging environment, PAM expects to use:

- **Managed PostgreSQL** for users, workspaces, vaults, encrypted records,
  consent records, document metadata and audit/sync events.
- **Object Storage** for encrypted document/file blobs.
- **Compute or container runtime** for the PAM API.
- **Secret management or deployment secrets** for database URL, object storage
  credentials and session secrets.
- **Private networking** where available between API and database.
- **Monitoring/logging** for uptime, operational events and safe error
  observability.

## Current Engineering State

Implemented:

- React/Vite proof of concept.
- Public onboarding flow and logged-in workspace.
- Local-first account flow for proof-of-concept use.
- Asset, document, people, consent, audit and export functionality.
- Data-residency profiles for Europe, Switzerland and United States.
- Cloud sync boundary for encrypted records.
- Server skeleton with HttpOnly session-cookie authentication.
- PostgreSQL schema migration.
- PostgreSQL store adapter.
- Migration runner.
- Automated server tests and Playwright smoke tests.

Not production-ready yet:

- real Scaleway deployment;
- real managed PostgreSQL test database;
- PostgreSQL integration test against live/staging database;
- object storage adapter for encrypted document blobs;
- production vault unlock and recovery flow;
- production legal/privacy/account deletion flows.

## Backend And Database Model

PAM has an initial PostgreSQL schema covering:

- `users`
- `workspaces`
- `workspace_members`
- `vaults`
- `vault_members`
- `sessions`
- `encrypted_records`
- `document_objects`
- `consent_records`
- `audit_events`
- `sync_events`

Every production record is intended to be scoped by:

```text
workspace_id
vault_id
data_residency
cloud_provider
region_policy
```

The API rejects synchronization requests when provider or region policy does
not match the workspace profile.

## Security Principles

PAM handles sensitive personal, legal, fiscal and financial information. The
security model is therefore a product feature, not a secondary technical layer.

Core principles:

- The user owns the workspace and vault.
- Sensitive records are encrypted before cloud storage.
- The backend should not need plaintext access to assets, people, documents or
  consent details for normal synchronization.
- Raw vault keys must never be stored by the backend.
- Professionals only gain access after explicit user consent.
- Logs and audit events must not contain decrypted private content.
- Browser environment variables must not contain secrets.

## Consent And Professional Access

PAM treats professional access as consent-based access, not as a loose
invitation link.

Professional access is expected to include:

- professional identity;
- organization and role;
- purpose;
- allowed rights;
- valid-from and valid-until;
- active, expired or revoked status;
- audit logging for access and changes.

This is important for users and for professional parties such as notaries,
fiscal advisors, accountants and legal advisors.

## What We Need From Scaleway

For the next technical phase, PAM needs:

1. A Scaleway project suitable for PAM Europe.
2. A managed PostgreSQL staging database.
3. Object Storage for encrypted document blobs.
4. Guidance on the best runtime for the PAM API: container, serverless
   container or virtual instance.
5. Guidance on private networking between API and database.
6. Guidance on secrets management for production credentials.
7. Guidance on backup, restore and monitoring setup.
8. Optional architecture review from a Scaleway solution architect.

The immediate engineering goal is:

```text
Run PAM migrations on Scaleway PostgreSQL
Run PostgreSQL integration tests
Connect the PAM API to the managed database
Add encrypted document object storage
Deploy a controlled staging environment
```

## Startup Program Fit

PAM is a strong fit for the Scaleway Startup Program because the product is
being designed around European cloud trust, privacy-sensitive data handling and
a scalable architecture.

Scaleway support would directly accelerate:

- moving from proof of concept to secure staging;
- validating the PostgreSQL and object storage architecture;
- reducing early infrastructure cost risk;
- receiving technical guidance before production launch;
- positioning PAM as a European privacy-conscious cloud product.

## Suggested Next Milestone

The first Scaleway-backed milestone should be:

```text
PAM Europe staging
  -> React frontend
  -> PAM API
  -> Managed PostgreSQL
  -> encrypted sync records
  -> object storage design ready
  -> smoke tests passing
```

This milestone would prove that PAM can move from local proof of concept to a
secure European cloud application without changing the user experience.

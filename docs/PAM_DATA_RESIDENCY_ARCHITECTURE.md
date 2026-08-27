# PAM Data Residency Architecture

Status: strategic production architecture

PAM should be one product with multiple data-residency wings. The user
experience, domain model and security model remain the same, while each
workspace belongs to a specific residency profile.

This prevents PAM from being locked into a Europe-only architecture while still
allowing release 1 to stay focused.

## Three Wings

PAM prepares three residency profiles:

| Profile | Code | Provider profile | Region policy | Status |
| --- | --- | --- | --- | --- |
| PAM Europe | `eu` | `scaleway-eu` | `eu-only` | Release 1 target |
| PAM Switzerland | `ch` | `exoscale-ch` | `ch-only` | Premium profile prepared |
| PAM United States | `us` | `custom-us` | `us-only` | Expansion profile prepared |

The United States profile is intentionally `custom-us` for now. PAM should not
select a US provider before there is a real market, legal and compliance reason
to do so.

## Architecture Principle

PAM must not become three separate applications.

The architecture is:

```text
One PAM app
One PAM domain model
One PAM security model
One API contract
Multiple workspace residency profiles
```

Every workspace stores:

```text
data_residency
cloud_provider
region_policy
```

The API rejects requests when the provider or region-policy headers do not match
the workspace. This makes data residency an enforceable technical boundary, not
only a commercial label.

## Release Order

Release order should stay disciplined:

1. Build PAM Europe on Scaleway.
2. Keep database, object storage and sync adapters provider-neutral.
3. Add PAM Switzerland when there is paid demand for Swiss residency.
4. Add PAM United States only after US legal/compliance and provider choices are
   clear.

This gives PAM speed now and strategic room later.

## What Is Shared

These parts remain shared across all wings:

- React/Vite frontend.
- Account and workspace model.
- Vault model.
- Consent model.
- Audit model.
- Encrypted record contract.
- Document object metadata model.
- Export and backup concepts.
- Playwright release smoke tests.

## What Varies Per Wing

These parts may vary per residency profile:

- provider;
- physical region;
- object storage endpoint;
- database region;
- backup location;
- legal terms and subprocessor list;
- operational support rules;
- pricing.

## Provider Positioning

### PAM Europe

Default release profile. Target: Scaleway EU.

This profile is optimized for:

- European positioning;
- cost control;
- first production release;
- broad customer adoption.

### PAM Switzerland

Premium profile. Target: Exoscale CH.

This profile is optimized for:

- trust positioning;
- private wealth and family contexts;
- customers who explicitly want Swiss residency;
- higher pricing.

### PAM United States

Expansion profile. Provider not selected yet.

This profile is optimized for:

- future US customers;
- US-specific residency expectations;
- later legal/compliance work;
- avoiding a premature US infrastructure commitment.

## Implementation Rule

Any new backend table, sync endpoint or storage adapter must include the
workspace boundary explicitly. No production record should be stored without a
workspace and vault relationship.

Minimum identifiers:

```text
workspace_id
vault_id
data_residency
cloud_provider
region_policy
```

## Product Rule

Customers may eventually choose between:

- PAM Europe;
- PAM Switzerland;
- PAM United States.

They should experience this as a trust and pricing choice, not as a different
app. PAM should explain it in plain language first and legal language second.

## Current Engineering State

Implemented in code:

- `eu`, `ch` and `us` residency profiles.
- provider-policy matching in frontend config.
- provider-policy matching in the sync server.
- server tests for Europe, Switzerland and United States profiles.
- Security screen display of the active residency profile.

Not implemented yet:

- real Scaleway deployment;
- PostgreSQL production repository;
- object storage adapter;
- US provider selection;
- per-profile legal terms and pricing.

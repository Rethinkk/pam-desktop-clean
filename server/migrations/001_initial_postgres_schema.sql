-- PAM production PostgreSQL schema v1
-- Target: PAM Europe first, portable to Switzerland and United States profiles.

begin;

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text not null,
  password_salt text not null,
  password_hash text not null,
  password_algorithm text not null default 'scrypt',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint users_email_not_blank check (length(trim(email)) > 3),
  constraint users_name_not_blank check (length(trim(name)) > 0)
);

create unique index if not exists users_email_unique_idx
  on users (lower(email))
  where deleted_at is null;

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references users(id) on delete restrict,
  name text not null,
  data_residency text not null default 'eu',
  cloud_provider text not null default 'scaleway-eu',
  region_policy text not null default 'eu-only',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint workspaces_name_not_blank check (length(trim(name)) > 0),
  constraint workspaces_data_residency_check check (data_residency in ('eu', 'ch', 'us')),
  constraint workspaces_region_policy_check check (region_policy in ('eu-only', 'ch-only', 'us-only')),
  constraint workspaces_cloud_provider_check check (
    cloud_provider in ('ovhcloud-eu', 'scaleway-eu', 'custom-eu', 'exoscale-ch', 'custom-ch', 'custom-us')
  ),
  constraint workspaces_residency_route_check check (
    (region_policy = 'eu-only' and cloud_provider in ('ovhcloud-eu', 'scaleway-eu', 'custom-eu')) or
    (region_policy = 'ch-only' and cloud_provider in ('exoscale-ch', 'custom-ch')) or
    (region_policy = 'us-only' and cloud_provider = 'custom-us')
  )
);

create index if not exists workspaces_owner_user_id_idx
  on workspaces(owner_user_id)
  where deleted_at is null;

create table if not exists workspace_members (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null,
  status text not null default 'active',
  invited_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, user_id),
  constraint workspace_members_role_check check (role in ('owner', 'family', 'professional', 'support')),
  constraint workspace_members_status_check check (status in ('invited', 'active', 'suspended', 'revoked'))
);

create table if not exists vaults (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  owner_user_id uuid not null references users(id) on delete restrict,
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint vaults_name_not_blank check (length(trim(name)) > 0),
  constraint vaults_status_check check (status in ('active', 'locked', 'deleted'))
);

create index if not exists vaults_workspace_id_idx
  on vaults(workspace_id)
  where deleted_at is null;

create table if not exists vault_members (
  vault_id uuid not null references vaults(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (vault_id, user_id),
  constraint vault_members_role_check check (role in ('owner', 'editor', 'viewer', 'professional'))
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  workspace_id uuid references workspaces(id) on delete cascade,
  vault_id uuid references vaults(id) on delete cascade,
  session_hash text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_seen_at timestamptz,
  user_agent_hash text,
  ip_hash text
);

create index if not exists sessions_user_id_idx
  on sessions(user_id)
  where revoked_at is null;

create unique index if not exists sessions_session_hash_unique_idx
  on sessions(session_hash)
  where revoked_at is null;

create table if not exists encrypted_records (
  id text not null,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  vault_id uuid not null references vaults(id) on delete cascade,
  owner_user_id uuid not null references users(id) on delete restrict,
  type text not null,
  encrypted_payload jsonb not null,
  encryption_version integer not null,
  client_updated_at timestamptz not null,
  server_updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (workspace_id, vault_id, id),
  constraint encrypted_records_type_check check (type in ('assets', 'people', 'documents', 'schema', 'consents')),
  constraint encrypted_records_encryption_version_check check (encryption_version = 1),
  constraint encrypted_records_payload_shape_check check (
    encrypted_payload->>'version' = '1' and
    encrypted_payload->>'algorithm' = 'AES-GCM' and
    encrypted_payload ? 'iv' and
    encrypted_payload ? 'ciphertext'
  )
);

create index if not exists encrypted_records_vault_type_idx
  on encrypted_records(vault_id, type, server_updated_at);

create index if not exists encrypted_records_sync_idx
  on encrypted_records(vault_id, server_updated_at)
  where deleted_at is null;

create table if not exists document_objects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  vault_id uuid not null references vaults(id) on delete cascade,
  owner_user_id uuid not null references users(id) on delete restrict,
  encrypted_record_id text,
  object_bucket text not null,
  object_key text not null,
  content_sha256 text,
  size_bytes bigint,
  encryption_version integer not null default 1,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint document_objects_object_bucket_not_blank check (length(trim(object_bucket)) > 0),
  constraint document_objects_object_key_not_blank check (length(trim(object_key)) > 0),
  constraint document_objects_size_bytes_check check (size_bytes is null or size_bytes >= 0),
  constraint document_objects_encryption_version_check check (encryption_version = 1)
);

create unique index if not exists document_objects_object_unique_idx
  on document_objects(object_bucket, object_key)
  where deleted_at is null;

create index if not exists document_objects_vault_id_idx
  on document_objects(vault_id)
  where deleted_at is null;

create table if not exists consent_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  vault_id uuid not null references vaults(id) on delete cascade,
  user_id uuid not null references users(id) on delete restrict,
  professional_user_id uuid references users(id) on delete set null,
  professional_email text,
  status text not null default 'active',
  scope jsonb not null,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint consent_records_status_check check (status in ('active', 'expired', 'revoked')),
  constraint consent_records_scope_is_object check (jsonb_typeof(scope) = 'object'),
  constraint consent_records_valid_until_check check (valid_until is null or valid_until > valid_from)
);

create index if not exists consent_records_vault_status_idx
  on consent_records(vault_id, status, valid_until);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete set null,
  vault_id uuid references vaults(id) on delete set null,
  actor_user_id uuid references users(id) on delete set null,
  actor_role text,
  action text not null,
  record_type text,
  record_id text,
  result text not null default 'success',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_events_result_check check (result in ('success', 'failure', 'blocked')),
  constraint audit_events_metadata_is_object check (jsonb_typeof(metadata) = 'object')
);

create index if not exists audit_events_workspace_created_at_idx
  on audit_events(workspace_id, created_at desc);

create index if not exists audit_events_vault_created_at_idx
  on audit_events(vault_id, created_at desc);

create table if not exists sync_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete set null,
  vault_id uuid references vaults(id) on delete set null,
  user_id uuid references users(id) on delete set null,
  type text not null,
  uploaded_count integer,
  downloaded_count integer,
  provider text,
  region_policy text,
  data_residency text,
  created_at timestamptz not null default now(),
  constraint sync_events_uploaded_count_check check (uploaded_count is null or uploaded_count >= 0),
  constraint sync_events_downloaded_count_check check (downloaded_count is null or downloaded_count >= 0)
);

create index if not exists sync_events_vault_created_at_idx
  on sync_events(vault_id, created_at desc);

commit;

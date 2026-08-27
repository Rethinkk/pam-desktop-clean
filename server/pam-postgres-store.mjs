import pg from "pg";

const { Pool } = pg;

function toPublicUserRow(row) {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    vaultId: row.vault_id,
    name: row.name,
    email: row.email,
    dataResidency: row.data_residency,
    cloudProvider: row.cloud_provider,
    regionPolicy: row.region_policy,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    passwordSalt: row.password_salt,
    passwordHash: row.password_hash,
  };
}

function toRecordRow(row) {
  return {
    id: row.id,
    vaultId: row.vault_id,
    ownerUserId: row.owner_user_id,
    type: row.type,
    encryptedPayload: row.encrypted_payload,
    encryptionVersion: row.encryption_version,
    clientUpdatedAt: row.client_updated_at instanceof Date
      ? row.client_updated_at.toISOString()
      : row.client_updated_at,
    serverUpdatedAt: row.server_updated_at instanceof Date
      ? row.server_updated_at.toISOString()
      : row.server_updated_at,
    deletedAt: row.deleted_at instanceof Date ? row.deleted_at.toISOString() : row.deleted_at,
  };
}

export function createPostgresPamStore(connectionString, options = {}) {
  const pool = new Pool({
    connectionString,
    max: Number(options.max ?? 10),
    ssl: options.ssl,
  });

  async function withClient(callback) {
    const client = await pool.connect();
    try {
      return await callback(client);
    } finally {
      client.release();
    }
  }

  return {
    async close() {
      await pool.end();
    },

    async readUserStore() {
      return withClient(async (client) => {
        const result = await client.query(`
          select
            users.id,
            users.name,
            users.email,
            users.password_salt,
            users.password_hash,
            users.created_at,
            workspaces.id as workspace_id,
            workspaces.data_residency,
            workspaces.cloud_provider,
            workspaces.region_policy,
            vaults.id as vault_id
          from users
          join workspaces on workspaces.owner_user_id = users.id and workspaces.deleted_at is null
          join vaults on vaults.workspace_id = workspaces.id and vaults.owner_user_id = users.id and vaults.deleted_at is null
          where users.deleted_at is null
          order by users.created_at asc
        `);
        return { users: result.rows.map(toPublicUserRow) };
      });
    },

    async saveUserStore() {
      throw new Error("PostgreSQL user writes must use createUserWithWorkspace().");
    },

    async createUserWithWorkspace(user) {
      return withClient(async (client) => {
        await client.query("begin");
        try {
          const userResult = await client.query(
            `
              insert into users (id, name, email, password_salt, password_hash, created_at, updated_at)
              values ($1, $2, $3, $4, $5, $6, $6)
              returning id, name, email, password_salt, password_hash, created_at
            `,
            [user.id, user.name, user.email, user.passwordSalt, user.passwordHash, user.createdAt],
          );

          const workspaceResult = await client.query(
            `
              insert into workspaces (
                id, owner_user_id, name, data_residency, cloud_provider, region_policy, created_at, updated_at
              )
              values ($1, $2, $3, $4, $5, $6, $7, $7)
              returning id, data_residency, cloud_provider, region_policy
            `,
            [
              user.workspaceId,
              user.id,
              `${user.name} workspace`,
              user.dataResidency,
              user.cloudProvider,
              user.regionPolicy,
              user.createdAt,
            ],
          );

          const vaultResult = await client.query(
            `
              insert into vaults (id, workspace_id, owner_user_id, name, created_at, updated_at)
              values ($1, $2, $3, $4, $5, $5)
              returning id
            `,
            [user.vaultId, user.workspaceId, user.id, "Persoonlijke PAM kluis", user.createdAt],
          );

          await client.query(
            `
              insert into workspace_members (workspace_id, user_id, role, status, created_at, updated_at)
              values ($1, $2, 'owner', 'active', $3, $3)
              on conflict (workspace_id, user_id) do nothing
            `,
            [user.workspaceId, user.id, user.createdAt],
          );

          await client.query(
            `
              insert into vault_members (vault_id, user_id, role, created_at, updated_at)
              values ($1, $2, 'owner', $3, $3)
              on conflict (vault_id, user_id) do nothing
            `,
            [user.vaultId, user.id, user.createdAt],
          );

          await client.query("commit");

          return toPublicUserRow({
            ...userResult.rows[0],
            workspace_id: workspaceResult.rows[0].id,
            vault_id: vaultResult.rows[0].id,
            data_residency: workspaceResult.rows[0].data_residency,
            cloud_provider: workspaceResult.rows[0].cloud_provider,
            region_policy: workspaceResult.rows[0].region_policy,
          });
        } catch (error) {
          await client.query("rollback");
          throw error;
        }
      });
    },

    async readRecordStore() {
      return withClient(async (client) => {
        const result = await client.query(`
          select
            id,
            vault_id,
            owner_user_id,
            type,
            encrypted_payload,
            encryption_version,
            client_updated_at,
            server_updated_at,
            deleted_at
          from encrypted_records
          order by server_updated_at asc
        `);

        const records = {};
        for (const row of result.rows) {
          const record = toRecordRow(row);
          records[record.vaultId] = records[record.vaultId] ?? {};
          records[record.vaultId][record.id] = record;
        }
        return { records };
      });
    },

    async saveRecordStore() {
      throw new Error("PostgreSQL record writes must use upsertEncryptedRecords().");
    },

    async upsertEncryptedRecords(session, records, now) {
      return withClient(async (client) => {
        await client.query("begin");
        try {
          for (const record of records) {
            await client.query(
              `
                insert into encrypted_records (
                  id,
                  workspace_id,
                  vault_id,
                  owner_user_id,
                  type,
                  encrypted_payload,
                  encryption_version,
                  client_updated_at,
                  server_updated_at,
                  deleted_at
                )
                values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10)
                on conflict (workspace_id, vault_id, id) do update set
                  owner_user_id = excluded.owner_user_id,
                  type = excluded.type,
                  encrypted_payload = excluded.encrypted_payload,
                  encryption_version = excluded.encryption_version,
                  client_updated_at = excluded.client_updated_at,
                  server_updated_at = excluded.server_updated_at,
                  deleted_at = excluded.deleted_at
              `,
              [
                record.id,
                session.workspaceId,
                session.vaultId,
                session.userId,
                record.type,
                JSON.stringify(record.encryptedPayload),
                record.encryptionVersion,
                record.updatedAt,
                now,
                record.deletedAt ?? null,
              ],
            );
          }
          await client.query("commit");
        } catch (error) {
          await client.query("rollback");
          throw error;
        }
      });
    },

    async appendSyncEvent(event) {
      await pool.query(
        `
          insert into sync_events (
            id,
            workspace_id,
            vault_id,
            user_id,
            type,
            uploaded_count,
            provider,
            region_policy,
            data_residency,
            created_at
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `,
        [
          event.id,
          event.workspaceId ?? null,
          event.vaultId ?? null,
          event.userId ?? null,
          event.type,
          event.uploadedCount ?? null,
          event.provider ?? null,
          event.regionPolicy ?? null,
          event.dataResidency ?? null,
          event.createdAt,
        ],
      );
    },
  };
}

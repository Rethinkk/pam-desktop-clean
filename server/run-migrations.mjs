import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { createDatabaseConnectionConfig } from "./pam-database-config.mjs";

const { Client } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "migrations");

export async function runMigrations({
  databaseConfig = createDatabaseConnectionConfig(),
} = {}) {
  if (!databaseConfig) {
    throw new Error("PAM_DATABASE_URL or PAM_DATABASE_HOST is required to run migrations.");
  }

  const client = new Client(databaseConfig);

  await client.connect();

  const result = {
    applied: [],
    skipped: [],
  };

  try {
    await client.query(`
      create table if not exists schema_migrations (
        id text primary key,
        applied_at timestamptz not null default now()
      )
    `);

    const files = (await readdir(migrationsDir))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const alreadyApplied = await client.query(
        "select 1 from schema_migrations where id = $1",
        [file],
      );
      if (alreadyApplied.rowCount) {
        result.skipped.push(file);
        console.log(`skip ${file}`);
        continue;
      }

      const sql = await readFile(join(migrationsDir, file), "utf8");
      await client.query(sql);
      await client.query("insert into schema_migrations (id) values ($1)", [file]);
      result.applied.push(file);
      console.log(`applied ${file}`);
    }

    return result;
  } finally {
    await client.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await runMigrations();
}

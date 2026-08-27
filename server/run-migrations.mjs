import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "migrations");
const databaseUrl = process.env.PAM_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("PAM_DATABASE_URL is required to run migrations.");
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: process.env.PAM_DATABASE_SSL === "true" ? { rejectUnauthorized: true } : undefined,
});

await client.connect();

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
      console.log(`skip ${file}`);
      continue;
    }

    const sql = await readFile(join(migrationsDir, file), "utf8");
    await client.query(sql);
    await client.query("insert into schema_migrations (id) values ($1)", [file]);
    console.log(`applied ${file}`);
  }
} finally {
  await client.end();
}

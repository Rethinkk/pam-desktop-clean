import express from "express";
import cors from "cors";
import pkg from "pg";
const { Pool } = pkg;

const app = express();
app.use(express.json());

const allowed = process.env.CORS_ORIGIN || "*";
app.use(cors({ origin: allowed === "*" ? true : allowed }));

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function init() {
  await pool.query(`create extension if not exists "pgcrypto";`);
  await pool.query(`
    create table if not exists people (
      id uuid primary key default gen_random_uuid(),
      name text,
      email text,
      created_at timestamptz default now()
    );`);
  await pool.query(`
    create table if not exists asset_types (
      id text primary key,
      label text not null
    );`);
  await pool.query(`
    create table if not exists assets (
      id uuid primary key default gen_random_uuid(),
      type_id text references asset_types(id),
      label text,
      domain text,
      category text,
      expiry_date date,
      created_at timestamptz default now()
    );`);
  await pool.query(`
    create table if not exists triggers (
      id uuid primary key default gen_random_uuid(),
      asset_id uuid references assets(id) on delete cascade,
      rule jsonb,
      enabled boolean default true,
      created_at timestamptz default now()
    );`);
  await pool.query(`
    create table if not exists documents (
      id uuid primary key default gen_random_uuid(),
      asset_id uuid references assets(id) on delete set null,
      filename text,
      mime text,
      size_bytes int,
      storage_url text,
      created_at timestamptz default now()
    );`);
  await pool.query(`
    insert into asset_types (id,label) values
    ('bank','Bankrekening'),('verzekering','Verzekering'),('ict','ICT-apparatuur')
    on conflict (id) do nothing;`);
}

app.get("/healthz", async (_req, res) => {
  try { await pool.query("select 1"); res.send("ok"); }
  catch { res.status(500).send("db-error"); }
});

app.get("/people", async (_req, res) => {
  const { rows } = await pool.query("select * from people order by created_at desc");
  res.json(rows);
});
app.post("/people", async (req, res) => {
  const { name, email } = req.body || {};
  const { rows } = await pool.query(
    `insert into people (name, email) values ($1,$2) returning *`,
    [name || null, email || null]
  );
  res.status(201).json(rows[0]);
});

app.get("/assets", async (_req, res) => {
  const { rows } = await pool.query("select * from assets order by created_at desc");
  res.json(rows);

  });
app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "pam-api", time: new Date().toISOString() });
});
  

app.post("/assets", async (req, res) => {
  const { type_id, label, domain, category, expiry_date } = req.body || {};
  const { rows } = await pool.query(
    `insert into assets (type_id,label,domain,category,expiry_date)
     values ($1,$2,$3,$4,$5) returning *`,
    [type_id || null, label || null, domain || null, category || null, expiry_date || null]
  );
  res.status(201).json(rows[0]);
});

const PORT = process.env.PORT || 3000;
init().then(() => {
  app.listen(PORT, () => console.log(`API listening on ${PORT}`));
});

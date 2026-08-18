// Run once to create the DB tables, RLS, and storage buckets/policies.
// Usage:
//   1. Fill SUPABASE_DB_PASSWORD in .env.local
//   2. node --env-file=.env.local scripts/setup-supabase.mjs
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL
  ?.replace(/^https?:\/\//, "")
  .split(".")[0];
const password = process.env.SUPABASE_DB_PASSWORD;
const dbHost = process.env.SUPABASE_DB_HOST; // optional override
const dbPort = process.env.SUPABASE_DB_PORT || "5432";

if (!projectRef || !password) {
  console.error(
    "Missing env vars. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_DB_PASSWORD are set in .env.local"
  );
  process.exit(1);
}

// Try multiple hostnames — some Supabase projects use pooler endpoints,
// and the direct db.* hostname may not resolve from certain networks.
const candidates = dbHost
  ? [{ host: dbHost, port: dbPort, user: "postgres", label: "custom" }]
  : [
      { host: `db.${projectRef}.supabase.co`, port: "5432", user: "postgres", label: "direct" },
      { host: `${projectRef}.supabase.co`, port: "5432", user: "postgres", label: "alt-direct" },
      // Pooler: use project ref as username (required for pooler routing)
      { host: "aws-0-ap-northeast-1.pooler.supabase.com", port: "6543", user: projectRef, label: "pooler-seoul" },
      { host: "aws-0-ap-southeast-1.pooler.supabase.com", port: "6543", user: projectRef, label: "pooler-sg" },
      { host: "aws-0-us-east-1.pooler.supabase.com", port: "6543", user: projectRef, label: "pooler-us" },
    ];

const sqlPath = resolve(__dirname, "..", "supabase", "schema.sql");
const sql = readFileSync(sqlPath, "utf8");

async function tryConnect(host, port, user, label) {
  const connectionString = `postgresql://${user}:${encodeURIComponent(
    password
  )}@${host}:${port}/postgres`;
  const isPooler = host.includes("pooler");
  const client = new Client({
    connectionString,
    ssl: isPooler
      ? { host: projectRef, rejectUnauthorized: false }
      : { rejectUnauthorized: false },
  });
  try {
    await client.connect();
    console.log(`✅ Connected via ${label} (${host}:${port})`);
    return client;
  } catch (err) {
    await client.end().catch(() => {});
    console.log(`  ❌ ${label} failed: ${err.message}`);
    return null;
  }
}

async function main() {
  let client = null;
  for (const c of candidates) {
    client = await tryConnect(c.host, c.port, c.user, c.label);
    if (client) break;
  }

  if (!client) {
    console.error("\nAll connection attempts failed.");
    console.error(
      "Find your DB host: Settings → Database → Connection string. Set SUPABASE_DB_HOST and SUPABASE_DB_PORT in .env.local, then rerun."
    );
    process.exit(1);
  }

  try {
    console.log("Running schema.sql...");
    await client.query(sql);
    console.log("✅ Schema applied successfully.");

    const { rows: tables } = await client.query(`
      select table_name from information_schema.tables
      where table_schema = 'public' and table_name in ('users','statements')
      order by table_name
    `);
    console.log(
      "Tables created:",
      tables.map((r) => r.table_name).join(", ") || "(none)"
    );

    const { rows: buckets } = await client.query(
      "select id, public from storage.buckets where id in ('statements','exports') order by id"
    );
    console.log(
      "Storage buckets:",
      buckets
        .map((b) => `${b.id}${b.public ? " (public)" : " (private)"}`)
        .join(", ") || "(none)"
    );
  } catch (err) {
    console.error("❌ Setup failed:", err.message);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

main();

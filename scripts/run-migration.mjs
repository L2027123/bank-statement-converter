// Run a SQL migration against Supabase Postgres.
// Tries multiple host candidates (direct + poolers) since the direct
// db.* hostname may not resolve from all networks.
// Usage: node --env-file=.env.local scripts/run-migration.mjs <migration-name>
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const migrationName = process.argv[2];

if (!migrationName) {
  console.error("Usage: node scripts/run-migration.mjs <migration-name>");
  process.exit(1);
}

const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL
  ?.replace(/^https?:\/\//, "")
  .split(".")[0];
const password = process.env.SUPABASE_DB_PASSWORD;
const dbHost = process.env.SUPABASE_DB_HOST;
const dbPort = process.env.SUPABASE_DB_PORT || "5432";

if (!projectRef || !password) {
  console.error(
    "Missing env vars. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_DB_PASSWORD are set in .env.local"
  );
  process.exit(1);
}

const candidates = dbHost
  ? [{ host: dbHost, port: dbPort, user: "postgres", label: "custom" }]
  : [
      { host: `db.${projectRef}.supabase.co`, port: "5432", user: "postgres", label: "direct" },
      { host: `${projectRef}.supabase.co`, port: "5432", user: "postgres", label: "alt-direct" },
      { host: "aws-0-ap-northeast-1.pooler.supabase.com", port: "6543", user: projectRef, label: "pooler-seoul" },
      { host: "aws-0-ap-southeast-1.pooler.supabase.com", port: "6543", user: projectRef, label: "pooler-sg" },
      { host: "aws-0-us-east-1.pooler.supabase.com", port: "6543", user: projectRef, label: "pooler-us" },
    ];

const sqlPath = resolve(__dirname, "..", "supabase", "migrations", `${migrationName}.sql`);
let sql;
try {
  sql = readFileSync(sqlPath, "utf8");
} catch {
  console.error(`Migration file not found: ${sqlPath}`);
  process.exit(1);
}

async function tryConnect(host, port, user, label) {
  const connectionString = `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/postgres`;
  const isPooler = host.includes("pooler");
  const client = new Client({
    connectionString,
    ssl: isPooler
      ? { host: projectRef, rejectUnauthorized: false }
      : { rejectUnauthorized: false },
  });
  try {
    await client.connect();
    console.log(`Connected via ${label} (${host}:${port})`);
    return client;
  } catch (err) {
    await client.end().catch(() => {});
    console.log(`  ${label} failed: ${err.message}`);
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
    process.exit(1);
  }

  try {
    console.log(`Running ${migrationName}.sql ...`);
    await client.query(sql);
    console.log("Migration applied successfully.");

    const { rows } = await client.query(`
      select policyname, cmd from pg_policies where tablename = 'page_views' order by policyname;
    `);
    console.log(
      "page_views policies:",
      rows.map((r) => `${r.policyname} (${r.cmd})`).join(", ") || "(none)"
    );
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

main();

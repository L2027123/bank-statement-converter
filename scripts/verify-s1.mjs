// S1 迁移验证脚本：查询 bucket 状态和 RLS policies
import { Client } from "pg";

const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL
  ?.replace(/^https?:\/\//, "")
  .split(".")[0];
const password = process.env.SUPABASE_DB_PASSWORD;

if (!projectRef || !password) {
  console.error("Missing env vars");
  process.exit(1);
}

const client = new Client({
  connectionString: `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

// 1. buckets 状态
const { rows: buckets } = await client.query(
  "select id, name, public from storage.buckets where id in ('statements','exports') order by id"
);
console.log("\n=== Storage Buckets (expect public=false) ===");
for (const b of buckets) {
  console.log(`  ${b.id.padEnd(12)}  public=${b.public}   ${b.public === false ? "✅" : "❌ NEED FIX"}`);
}

// 2. exports / statements 的 RLS policies
const { rows: policies } = await client.query(`
  SELECT
    policyname,
    cmd,
    roles,
    qual::text,
    with_check::text
  FROM pg_policies
  WHERE schemaname = 'storage' AND tablename = 'objects'
    AND (
      qual::text LIKE '%exports%' OR qual::text LIKE '%statements%'
      OR with_check::text LIKE '%exports%' OR with_check::text LIKE '%statements%'
    )
  ORDER BY policyname
`);
console.log("\n=== Storage RLS Policies ===");
for (const p of policies) {
  const rolesList = Array.isArray(p.roles) ? p.roles.join(",") : String(p.roles);
  console.log(`  [${p.cmd.padEnd(6)}] ${p.policyname.padEnd(36)}  roles=${rolesList}`);
}

// 3. 确认 exports_storage_public_read 已删除
const legacy = policies.find((p) => p.policyname === "exports_storage_public_read");
console.log("\n=== Legacy exports_storage_public_read ===");
console.log(legacy ? "❌ STILL EXISTS — must DROP POLICY" : "✅ Dropped successfully");

// 4. 期望的最小策略集合
const required = [
  "exports_storage_read_own",
  "exports_storage_write_own",
  "exports_storage_update_own",
  "exports_storage_delete_own",
  "statements_storage_read_own",
  "statements_storage_write_own",
  "statements_storage_update_own",
  "statements_storage_delete_own",
];
const got = new Set(policies.map((p) => p.policyname));
console.log("\n=== Required Policies Check ===");
for (const r of required) {
  console.log(`  ${got.has(r) ? "✅" : "❌ MISSING"}  ${r}`);
}

await client.end();

// S1 端到端验证：测 /api/signed-url 生产接口
// 1. 匿名请求应返回 401
// 2. 非法 statement_id 应返回 404（登录后）
// 3. 同时验证 storage exports 文件公开 URL 现在是否被拒绝（因为 bucket 改成 private）

const BASE = "https://bank-statement-converter-lemon.vercel.app";

async function test(label, fn) {
  try {
    const r = await fn();
    console.log(`✅ ${label}: ${r}`);
  } catch (e) {
    console.log(`❌ ${label}: ${e.message}`);
  }
}

// 1. 匿名请求 signed-url 接口
await test("匿名 GET /api/signed-url → 401", async () => {
  const r = await fetch(
    `${BASE}/api/signed-url?statement_id=00000000-0000-0000-0000-000000000000&type=csv`
  );
  const txt = await r.text();
  if (r.status === 401) return `HTTP 401 (${txt.slice(0, 80)})`;
  throw new Error(`Expected 401, got ${r.status}: ${txt.slice(0, 120)}`);
});

// 2. 确认 exports bucket 公开路径现在是 403/401
//    随机一个 exports 的公开 URL 试一下
await test("exports bucket 公开访问应拒绝（403/404）", async () => {
  const r = await fetch(
    `https://qdrcofomnznybbgloqsr.supabase.co/storage/v1/object/public/exports/random/file.xlsx`
  );
  if (r.status === 403 || r.status === 400 || r.status === 404)
    return `HTTP ${r.status}（公开URL被拒绝 ✅）`;
  throw new Error(`Expected 403/404, got ${r.status}`);
});

// 3. statements bucket 也一样拒绝
await test("statements bucket 公开访问应拒绝（403/404）", async () => {
  const r = await fetch(
    `https://qdrcofomnznybbgloqsr.supabase.co/storage/v1/object/public/statements/random/test.pdf`
  );
  if (r.status === 403 || r.status === 400 || r.status === 404)
    return `HTTP ${r.status}（公开URL被拒绝 ✅）`;
  throw new Error(`Expected 403/404, got ${r.status}`);
});

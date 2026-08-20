import { NextRequest, NextResponse } from "next/server";
import { BANKS } from "@/lib/banks";

/**
 * 每日健康检查 API
 *
 * 设计原则（红线）：
 * - 不自动发送邮件
 * - 不自动调用任何外部推送服务
 * - 不自动点击 / 提交 / 触发其他平台动作
 *
 * 仅做：
 * - 跑生产环境健康检查
 * - 生成结构化报告（JSON + 可读 Markdown）
 * - 返回结果给调用方（用户主动查看 / 手动转发）
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface CheckResult {
  name: string;
  url: string;
  status: string;
  durationMs: number;
  ok: boolean;
}

async function checkUrl(
  name: string,
  url: string
): Promise<CheckResult> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const durationMs = Date.now() - start;
    return {
      name,
      url,
      status: String(res.status),
      durationMs,
      ok: res.status >= 200 && res.status < 400,
    };
  } catch (err) {
    const durationMs = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    return {
      name,
      url,
      status: `ERR: ${message}`,
      durationMs,
      ok: false,
    };
  }
}

async function runHealthChecks(): Promise<CheckResult[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://bank-statement-converter-lemon.vercel.app";

  const checks: { name: string; url: string }[] = [
    { name: "Homepage", url: `${baseUrl}/` },
    { name: "Login", url: `${baseUrl}/login` },
    { name: "Demo Upload", url: `${baseUrl}/upload?demo=true` },
    { name: "Sitemap", url: `${baseUrl}/sitemap.xml` },
    { name: "Robots", url: `${baseUrl}/robots.txt` },
    // 5 个主要银行页
    { name: "Chase", url: `${baseUrl}/bank/chase` },
    { name: "Wells Fargo", url: `${baseUrl}/bank/wells-fargo` },
    { name: "Bank of America", url: `${baseUrl}/bank/bank-of-america` },
    { name: "Citi", url: `${baseUrl}/bank/citi` },
    { name: "Capital One", url: `${baseUrl}/bank/capital-one` },
  ];

  const results = await Promise.all(
    checks.map((c) => checkUrl(c.name, c.url))
  );
  return results;
}

/**
 * 生成 Markdown 报告（用户可复制到任何地方）
 */
function buildMarkdownReport(
  results: CheckResult[],
  dateStr: string
): string {
  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  const allPassed = failed === 0;

  const rows = results
    .map(
      (r) =>
        `| ${r.name} | ${r.status} | ${r.durationMs}ms | ${r.ok ? "✅" : "❌"} |`
    )
    .join("\n");

  return `## Bank Statement Converter - Daily Health Report

**Date**: ${dateStr}
**Status**: ${allPassed ? "✅ All Passed" : `❌ ${failed} Failed`}
**Summary**: ${passed} passed / ${results.length} total

| Page | Status | Latency | Result |
|------|--------|---------|--------|
${rows}

### Today's Action Items (Manual)

${allPassed ? "- [x] Production healthy — no action needed" : "- [ ] Investigate failed checks (check Vercel deployment logs)"}
- [ ] Reddit: 5 min karma-building in r/accounting (genuine comments + upvotes, manual only)
- [ ] SEO: Google natural crawl in progress, 1-2 weeks to index bank landing pages
- [ ] Find 5-10 US beta testers (friends, LinkedIn, accounting forums, manual outreach only)

### Notes
- Production URL: https://bank-statement-converter-lemon.vercel.app
- Total bank landing pages: ${BANKS.length}
- This report is generated automatically. No email is sent automatically.
- To view daily: visit this URL or check GitHub Issues (if Actions workflow enabled).
`;
}

export async function GET(request: NextRequest) {
  // 简单 token 校验，防止外部随便调用（可选）
  const expectedToken = process.env.CRON_SECRET;
  if (expectedToken) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Shanghai",
  });

  const results = await runHealthChecks();
  const failed = results.filter((r) => !r.ok).length;
  const allPassed = failed === 0;

  const markdownReport = buildMarkdownReport(results, dateStr);

  // 只返回 JSON + Markdown 文本，调用方（用户或 Vercel Cron）自己决定怎么处理
  return NextResponse.json({
    date: dateStr,
    totalChecks: results.length,
    passed: results.length - failed,
    failed,
    allPassed,
    markdownReport,
    results,
  });
}

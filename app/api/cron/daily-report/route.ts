import { NextRequest, NextResponse } from "next/server";
import { BANKS } from "@/lib/banks";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

/**
 * 每日访问统计报告 + 邮件推送
 *
 * 功能：
 * 1. 跑生产环境健康检查
 * 2. 获取 Supabase 访问统计数据
 * 3. 生成 HTML 邮件报告
 * 4. 发送邮件到指定邮箱
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// 初始化 Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 初始化 Resend 客户端（如果配置了 API Key）
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// 收件人邮箱
const REPORT_EMAIL = process.env.REPORT_EMAIL || "junliang2027@outlook.com";

interface CheckResult {
  name: string;
  url: string;
  status: string;
  durationMs: number;
  ok: boolean;
}

interface StatsData {
  totalViews: number;
  uniqueVisitors: number;
  demoUsers: number;
  realUsers: number;
  daily: Array<{ day: string; views: number; unique: number }>;
  topPages: Array<{ path: string; visits: number; unique: number }>;
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
    { name: "Chase Bank", url: `${baseUrl}/bank/chase` },
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
 * 获取访问统计数据
 */
async function fetchStats(): Promise<StatsData> {
  const { data: views, error } = await supabase
    .from("page_views")
    .select("path, session_id, is_demo, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Stats fetch error:", error.message);
    return {
      totalViews: 0,
      uniqueVisitors: 0,
      demoUsers: 0,
      realUsers: 0,
      daily: [],
      topPages: [],
    };
  }

  const allViews = views || [];

  // 独立访客
  const uniqueSessions = new Set(allViews.map((v) => v.session_id));
  const demoSessions = new Set(allViews.filter((v) => v.is_demo).map((v) => v.session_id));
  const realSessions = new Set(allViews.filter((v) => !v.is_demo).map((v) => v.session_id));

  // 按页面分组
  const pathMap = new Map<string, { visits: number; unique: Set<string> }>();
  for (const v of allViews) {
    const path = v.path || "/";
    if (!pathMap.has(path)) {
      pathMap.set(path, { visits: 0, unique: new Set() });
    }
    const entry = pathMap.get(path)!;
    entry.visits++;
    entry.unique.add(v.session_id);
  }

  const topPages = Array.from(pathMap.entries())
    .map(([path, data]) => ({
      path,
      visits: data.visits,
      unique: data.unique.size,
    }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 10);

  // 最近 7 天统计
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const weekViews = allViews.filter((v) => v.created_at >= sevenDaysAgo);

  const dailyMap = new Map<string, { views: number; unique: Set<string> }>();
  for (const v of weekViews) {
    const day = v.created_at?.slice(0, 10) || "unknown";
    if (!dailyMap.has(day)) {
      dailyMap.set(day, { views: 0, unique: new Set() });
    }
    const entry = dailyMap.get(day)!;
    entry.views++;
    entry.unique.add(v.session_id);
  }

  const daily = Array.from(dailyMap.entries())
    .map(([day, data]) => ({
      day,
      views: data.visits,
      unique: data.unique.size,
    }))
    .sort((a, b) => b.day.localeCompare(a.day));

  return {
    totalViews: allViews.length,
    uniqueVisitors: uniqueSessions.size,
    demoUsers: demoSessions.size,
    realUsers: realSessions.size,
    daily,
    topPages,
  };
}

/**
 * 生成 HTML 邮件模板
 */
function buildEmailHtml(
  results: CheckResult[],
  stats: StatsData,
  dateStr: string
): string {
  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  const allPassed = failed === 0;

  const healthIcon = allPassed ? "✅" : "⚠️";
  const healthColor = allPassed ? "#22c55e" : "#f59e0b";

  // 健康检查表格行
  const healthRows = results
    .map(
      (r) => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${r.name}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center;">${r.status}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center;">${r.durationMs}ms</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center;">${r.ok ? "✅" : "❌"}</td>
        </tr>`
    )
    .join("");

  // 热门页面表格行
  const pageRows = stats.topPages
    .map(
      (p, i) => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${i + 1}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-family: monospace; font-size: 13px;">${p.path}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">${p.visits}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">${p.unique}</td>
        </tr>`
    )
    .join("");

  // 日统计表格行
  const dailyRows = stats.daily
    .map(
      (d) => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${d.day}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">${d.views}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">${d.unique}</td>
        </tr>`
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Bank Statement Converter - Daily Report</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px;">
            <h1 style="margin: 0; font-size: 22px;">${healthIcon} Bank Statement Converter</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">Daily Visitor Report</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.8;">${dateStr}</p>
          </div>

          <!-- Summary Cards -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 20px;">
            <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #667eea;">${stats.totalViews}</div>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">Total Views</div>
            </div>
            <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #22c55e;">${stats.uniqueVisitors}</div>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">Unique Visitors</div>
            </div>
            <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${stats.realUsers}</div>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">Real Users</div>
            </div>
            <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${stats.demoUsers}</div>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">Demo Users</div>
            </div>
          </div>

          <!-- Health Check -->
          <div style="padding: 0 20px 20px;">
            <h2 style="font-size: 16px; color: #333; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid ${healthColor};">
              ${healthIcon} System Health
            </h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #ddd;">Page</th>
                  <th style="padding: 8px 12px; text-align: center; border-bottom: 2px solid #ddd;">Status</th>
                  <th style="padding: 8px 12px; text-align: center; border-bottom: 2px solid #ddd;">Speed</th>
                  <th style="padding: 8px 12px; text-align: center; border-bottom: 2px solid #ddd;">OK</th>
                </tr>
              </thead>
              <tbody>${healthRows}</tbody>
            </table>
          </div>

          <!-- Top Pages -->
          <div style="padding: 0 20px 20px;">
            <h2 style="font-size: 16px; color: #333; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #667eea;">
              📊 Top Pages
            </h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #ddd;">#</th>
                  <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #ddd;">Page</th>
                  <th style="padding: 8px 12px; text-align: right; border-bottom: 2px solid #ddd;">Views</th>
                  <th style="padding: 8px 12px; text-align: right; border-bottom: 2px solid #ddd;">Unique</th>
                </tr>
              </thead>
              <tbody>${pageRows || '<tr><td colspan="4" style="padding: 16px; text-align: center; color: #999;">No data yet</td></tr>'}</tbody>
            </table>
          </div>

          <!-- Daily Trend -->
          <div style="padding: 0 20px 20px;">
            <h2 style="font-size: 16px; color: #333; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #3b82f6;">
              📈 7-Day Trend
            </h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #ddd;">Date</th>
                  <th style="padding: 8px 12px; text-align: right; border-bottom: 2px solid #ddd;">Views</th>
                  <th style="padding: 8px 12px; text-align: right; border-bottom: 2px solid #ddd;">Unique</th>
                </tr>
              </thead>
              <tbody>${dailyRows || '<tr><td colspan="3" style="padding: 16px; text-align: center; color: #999;">No data yet</td></tr>'}</tbody>
            </table>
          </div>

          <!-- Footer -->
          <div style="background: #f8f9fa; padding: 16px 20px; font-size: 12px; color: #666; text-align: center;">
            <p style="margin: 0 0 4px 0;">Bank Statement Converter</p>
            <p style="margin: 0 0 4px 0;">Production: https://bank-statement-converter-lemon.vercel.app</p>
            <p style="margin: 0; color: #999;">This report is sent automatically at 8:00 AM (CST) via Vercel Cron</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function GET(request: NextRequest) {
  // Token 校验
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

  // 并行获取健康检查和统计数据
  const [results, stats] = await Promise.all([
    runHealthChecks(),
    fetchStats(),
  ]);

  const failed = results.filter((r) => !r.ok).length;
  const allPassed = failed === 0;

  // 生成报告
  const htmlReport = buildEmailHtml(results, stats, dateStr);

  // 发送邮件（如果配置了 Resend API Key）
  let emailSent = false;
  let emailError = null;

  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: "Bank Statement Converter <reports@bankstatementconverter.com>",
        to: [REPORT_EMAIL],
        subject: `📊 Daily Report - ${dateStr}`,
        html: htmlReport,
      });

      if (error) {
        console.error("Email send error:", error);
        emailError = error.message;
      } else {
        console.log("Email sent successfully:", data?.id);
        emailSent = true;
      }
    } catch (err) {
      console.error("Email send exception:", err);
      emailError = err instanceof Error ? err.message : String(err);
    }
  } else {
    console.log("Resend not configured (RESEND_API_KEY not set), skipping email send");
  }

  return NextResponse.json({
    date: dateStr,
    totalChecks: results.length,
    passed: results.length - failed,
    failed,
    allPassed,
    stats,
    emailSent,
    emailError,
    emailRecipient: REPORT_EMAIL,
  });
}

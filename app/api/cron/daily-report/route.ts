import { NextRequest, NextResponse } from "next/server";
import { BANKS } from "@/lib/banks";

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

function buildReportEmail(
  results: CheckResult[],
  dateStr: string
): string {
  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  const allPassed = failed === 0;

  const rows = results
    .map(
      (r) =>
        `<tr><td>${r.name}</td><td>${r.status}</td><td>${r.durationMs}ms</td><td>${
          r.ok ? "✅" : "❌"
        }</td></tr>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
  <div style="background: #1e3a5f; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 22px;">📊 Daily Report — Bank Statement Converter</h1>
    <p style="margin: 5px 0 0 0; opacity: 0.9;">${dateStr}</p>
  </div>

  <div style="background: ${
    allPassed ? "#f0fdf4" : "#fef2f2"
  }; border: 1px solid ${
    allPassed ? "#bbf7d0" : "#fecaca"
  }; padding: 16px; border-radius: 0 0 8px 8px;">

    <h2 style="margin-top: 0; color: ${
      allPassed ? "#166534" : "#991b1b"
    };">${allPassed ? "✅ All Passed" : "❌ " + failed + " Check(s) Failed"}</h2>

    <p style="font-size: 14px; color: #6b7280;">${passed} passed / ${
    results.length
  } total</p>

    <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px;">
      <thead>
        <tr style="background: #f3f4f6; text-align: left;">
          <th style="padding: 8px; border: 1px solid #e5e7eb;">Page</th>
          <th style="padding: 8px; border: 1px solid #e5e7eb;">Status</th>
          <th style="padding: 8px; border: 1px solid #e5e7eb;">Latency</th>
          <th style="padding: 8px; border: 1px solid #e5e7eb;">Result</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <h3 style="margin-top: 24px; font-size: 16px;">📋 Today's Action Items</h3>
    <ul style="font-size: 14px; line-height: 1.6;">
      ${
        allPassed
          ? "<li>✅ Production is healthy — no action needed</li>"
          : "<li>❌ Investigate failed checks (see Vercel deployment logs)</li>"
      }
      <li>🤖 Reddit: leave 2-3 genuine comments in r/accounting + upvote 5 posts (karma-building)</li>
      <li>📈 SEO: Google will start indexing 52 bank pages in 1-2 weeks (no action needed)</li>
      <li>👥 Find 5-10 US beta testers for the demo flow</li>
    </ul>

    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;">

    <p style="font-size: 12px; color: #9ca3af;">
      Production URL: <a href="https://bank-statement-converter-lemon.vercel.app" style="color: #1e3a5f;">bank-statement-converter-lemon.vercel.app</a><br>
      GitHub Repo: <a href="https://github.com/L2027123/bank-statement-converter" style="color: #1e3a5f;">L2027123/bank-statement-converter</a><br>
      Daily Issue Log: Check <code>daily-check</code> label in GitHub Issues<br>
      Total bank landing pages: ${BANKS.length}
    </p>
  </div>
</body>
</html>`;
}

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY not set" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Bank Statement Converter <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Resend API ${res.status}: ${text}` };
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export async function GET(request: NextRequest) {
  // Vercel Cron 调用 / 手动测试
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.CRON_SECRET;

  // 如果配了 CRON_SECRET，校验（防止外部随便调用）
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const html = buildReportEmail(results, dateStr);
  const subject = `${
    allPassed ? "✅ All Passed" : "❌ " + failed + " Failed"
  } — Bank Statement Converter Daily Report`;

  const recipientEmail =
    process.env.REPORT_RECIPIENT_EMAIL || "junliang2027@outlook.com";

  const emailResult = await sendEmail(recipientEmail, subject, html);

  return NextResponse.json({
    date: dateStr,
    totalChecks: results.length,
    passed: results.length - failed,
    failed,
    email: emailResult,
    results,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "niuniu7626";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PageView {
  path: string;
  session_id: string;
  is_demo: boolean;
  created_at: string;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const password = authHeader?.replace("Bearer ", "");

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch all page views (analytics data only — safe to expose aggregate)
    const { data: views, error: viewsErr } = await supabase
      .from("page_views")
      .select("path, session_id, is_demo, created_at")
      .order("created_at", { ascending: false })
      .limit(5000);

    if (viewsErr) {
      throw new Error(`page_views query failed: ${viewsErr.message}`);
    }

    const allViews = (views || []) as PageView[];

    // Total page views
    const totalViews = allViews.length;

    // Unique visitors + demo users
    const uniqueSessions = new Set<string>();
    const demoSessions = new Set<string>();
    for (const v of allViews) {
      uniqueSessions.add(v.session_id);
      if (v.is_demo) demoSessions.add(v.session_id);
    }

    // Funnel — group by path
    const funnelMap = new Map<
      string,
      { visits: number; unique: Set<string> }
    >();
    for (const v of allViews) {
      if (!funnelMap.has(v.path)) {
        funnelMap.set(v.path, { visits: 0, unique: new Set() });
      }
      const entry = funnelMap.get(v.path)!;
      entry.visits++;
      entry.unique.add(v.session_id);
    }
    const funnel = Array.from(funnelMap.entries())
      .map(([path, data]) => ({
        path,
        visits: String(data.visits),
        unique_visits: String(data.unique.size),
      }))
      .sort((a, b) => Number(b.visits) - Number(a.visits))
      .slice(0, 20);

    // Recent 20 page views
    const recent = allViews.slice(0, 20).map((v) => ({
      path: v.path,
      session_id: v.session_id,
      is_demo: v.is_demo,
      created_at: v.created_at,
    }));

    // Last 7 days daily stats
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();
    const weekViews = allViews.filter((v) => v.created_at >= sevenDaysAgo);
    const dailyMap = new Map<
      string,
      { views: number; unique: Set<string> }
    >();
    for (const v of weekViews) {
      const day = v.created_at.slice(0, 10);
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
        views: String(data.views),
        unique_visitors: String(data.unique.size),
      }))
      .sort((a, b) => b.day.localeCompare(a.day));

    // Statements count — try with anon (RLS may block; return 0 if blocked)
    let totalStatements = 0;
    let completedStatements = 0;
    try {
      const { count } = await supabase
        .from("statements")
        .select("*", { count: "exact", head: true });
      totalStatements = count || 0;
      const { count: completed } = await supabase
        .from("statements")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed");
      completedStatements = completed || 0;
    } catch {
      // RLS blocks anon access to statements — needs service_role key
    }

    return NextResponse.json({
      totalViews,
      uniqueVisitors: uniqueSessions.size,
      demoUsers: demoSessions.size,
      registeredUsers: 0, // requires service_role key to query auth.users
      totalStatements,
      completedStatements,
      funnel,
      recent,
      daily,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

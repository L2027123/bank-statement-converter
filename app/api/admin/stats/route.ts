import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "niuniu7626";

function createConn() {
  return new Client({
    host: "db.qdrcofomnznybbgloqsr.supabase.co",
    port: 5432,
    user: "postgres",
    password: "niuniu7626Lj$",
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  });
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const password = authHeader?.replace("Bearer ", "");

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conn = createConn();
  try {
    await conn.connect();

    // Total page views
    const { rows: viewsRows } = await conn.query(
      "SELECT count(*) as total FROM page_views;"
    );
    const totalViews = parseInt(viewsRows[0].total);

    // Unique visitors
    const { rows: uniqueRows } = await conn.query(
      "SELECT count(DISTINCT session_id) as unique FROM page_views;"
    );
    const uniqueVisitors = parseInt(uniqueRows[0].unique);

    // Demo users
    const { rows: demoRows } = await conn.query(
      "SELECT count(DISTINCT session_id) as demo FROM page_views WHERE is_demo = true;"
    );
    const demoUsers = parseInt(demoRows[0].demo);

    // Funnel: each step
    const { rows: funnelRows } = await conn.query(`
      SELECT
        path,
        count(*) as visits,
        count(DISTINCT session_id) as unique_visits
      FROM page_views
      GROUP BY path
      ORDER BY visits DESC
      LIMIT 20;
    `);

    // Registered users
    const { rows: userRows } = await conn.query(
      "SELECT count(*) as total FROM auth.users;"
    );
    const registeredUsers = parseInt(userRows[0].total);

    // Statements
    const { rows: stmtRows } = await conn.query(
      "SELECT count(*) as total, count(*) FILTER (WHERE status = 'completed') as completed FROM statements;"
    );
    const totalStatements = parseInt(stmtRows[0].total);
    const completedStatements = parseInt(stmtRows[0].completed);

    // Recent 20 page views
    const { rows: recentRows } = await conn.query(`
      SELECT path, session_id, is_demo, created_at
      FROM page_views
      ORDER BY created_at DESC
      LIMIT 20;
    `);

    // Last 7 days daily stats
    const { rows: dailyRows } = await conn.query(`
      SELECT date_trunc('day', created_at) as day,
             count(*) as views,
             count(DISTINCT session_id) as unique_visitors
      FROM page_views
      WHERE created_at > now() - interval '7 days'
      GROUP BY day
      ORDER BY day DESC;
    `);

    await conn.end();

    return NextResponse.json({
      totalViews,
      uniqueVisitors,
      demoUsers,
      registeredUsers,
      totalStatements,
      completedStatements,
      funnel: funnelRows,
      recent: recentRows,
      daily: dailyRows,
    });
  } catch (err) {
    await conn.end();
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import pg from "pg";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "niuniu7626";

// Direct DB connection — bypasses RLS (equivalent to service role key).
// Used because we dropped the authenticated SELECT policy on waitlist
// and don't have SUPABASE_SERVICE_ROLE_KEY in env.
const CONNECTION_STRING = `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.qdrcofomnznybbgloqsr.supabase.co:5432/postgres`;

interface WaitlistEntry {
  id: string;
  email: string;
  source: string;
  created_at: string;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const password = authHeader?.replace("Bearer ", "");

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let client: pg.Client | null = null;
  try {
    client = new pg.Client({ connectionString: CONNECTION_STRING });
    await client.connect();

    const { rows } = await client.query<WaitlistEntry>(
      `SELECT id, email, source, created_at FROM waitlist ORDER BY created_at DESC LIMIT 500;`
    );

    return NextResponse.json({
      total: rows.length,
      entries: rows,
    });
  } catch (err) {
    console.error("admin/waitlist error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  } finally {
    if (client) await client.end().catch(() => {});
  }
}

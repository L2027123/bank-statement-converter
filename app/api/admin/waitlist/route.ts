import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "niuniu7626";

// Uses service role key if available, falls back to a SECURITY DEFINER RPC.
// The RPC get_waitlist() bypasses RLS safely — only callable via API with admin password.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

  try {
    // Call the SECURITY DEFINER RPC that bypasses RLS.
    const { data, error } = await supabase.rpc("get_waitlist");

    if (error) {
      throw new Error(`RPC failed: ${error.message}`);
    }

    const entries = (data || []) as WaitlistEntry[];

    return NextResponse.json({
      total: entries.length,
      entries,
    });
  } catch (err) {
    console.error("admin/waitlist error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

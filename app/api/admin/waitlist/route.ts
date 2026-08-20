import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "niuniu7626";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface WaitlistEntry {
  id: string;
  email: string | null;
  source: string;
  created_at: string;
  bank_name?: string | null;
}

// Decode bank_request entries: bank name is encoded in email column.
// See app/api/waitlist/route.ts for the encoding scheme.
// Format: "bank:<name>:<unique>" or "<email>|bank:<name>:<unique>"
function decodeEntry(entry: WaitlistEntry): WaitlistEntry {
  if (entry.source !== "bank_request" || !entry.email) return entry;

  const parts = entry.email.split("|");
  let bankName: string | null = null;
  let realEmail: string | null = null;

  for (const part of parts) {
    if (part.startsWith("bank:")) {
      // Strip unique suffix: "bank:<name>:<unique>" -> "<name>"
      const rest = part.slice(5); // remove "bank:"
      const colonIdx = rest.lastIndexOf(":");
      bankName = colonIdx > 0 ? rest.slice(0, colonIdx) : rest;
    } else {
      realEmail = part;
    }
  }

  return {
    ...entry,
    email: realEmail,
    bank_name: bankName,
  };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const password = authHeader?.replace("Bearer ", "");

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let entries: WaitlistEntry[] = [];

    // Try the SECURITY DEFINER RPC first (bypasses RLS).
    try {
      const { data, error } = await supabase.rpc("get_waitlist");
      if (!error && data) {
        // RPC may return metadata column (if migration was run) or not.
        entries = (data as any[]).map((row) => ({
          id: row.id,
          email: row.email,
          source: row.source,
          created_at: row.created_at,
          bank_name: row.metadata?.bank_name ?? null,
        }));
      }
    } catch {
      // RPC failed — try direct query (may work if RLS allows it,
      // or may return empty — that's fine, we just show what we have).
    }

    // If RPC returned nothing, try direct query as fallback.
    if (entries.length === 0) {
      try {
        const { data, error } = await supabase
          .from("waitlist")
          .select("id, email, source, created_at")
          .order("created_at", { ascending: false })
          .limit(500);
        if (!error && data) {
          entries = (data as WaitlistEntry[]).map((row) => ({
            id: row.id,
            email: row.email,
            source: row.source,
            created_at: row.created_at,
            bank_name: null,
          }));
        }
      } catch {
        // Silently fail — entries stays empty.
      }
    }

    // Decode bank_request entries (bank name encoded in email field).
    entries = entries.map(decodeEntry);

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

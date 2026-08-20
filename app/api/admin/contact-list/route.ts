import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "niuniu7626";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  message: string;
  source: string | null;
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
    const { data, error } = await supabase
      .from("contact_submissions")
      .select("id, name, email, message, source, is_demo, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      throw new Error(`contact_submissions query failed: ${error.message}`);
    }

    const submissions = (data || []) as ContactSubmission[];

    const totalCount = submissions.length;
    const demoCount = submissions.filter((s) => s.is_demo).length;

    return NextResponse.json({
      total: totalCount,
      demoCount,
      submissions,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

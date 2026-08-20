import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Uses anon key — RLS policy allows anonymous INSERT on waitlist table.
// No service role key needed (safer — no privileged credentials in env).
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface WaitlistInsert {
  email: string | null;
  source: string;
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string | null;
      source?: string;
      metadata?: Record<string, unknown> | null;
    };
    const source = (body.source || "landing_page").trim();

    // F2 — bank_request: email optional, bank name encoded in email field
    // as "bank:<bank_name>" when no real email is provided.
    if (source === "bank_request") {
      const bankName =
        (body.metadata?.bank_name as string | undefined)?.trim() ?? "";
      if (!bankName) {
        return NextResponse.json(
          { error: "Please enter the bank name." },
          { status: 400 }
        );
      }
      const email = body.email?.trim() ?? "";
      // Encode bank name into email column for persistence without migration.
      // Format: "bank:<bank_name>" when no real email, or "<email>|bank:<bank_name>" when both.
      let emailValue: string | null;
      if (email && isEmail(email)) {
        emailValue = `${email}|bank:${bankName}`;
      } else {
        emailValue = `bank:${bankName}`;
      }
      const { error } = await supabase.from("waitlist").insert({
        email: emailValue,
        source,
      });
      if (error) throw error;
      return NextResponse.json(
        {
          message:
            "Thanks! We'll email you when this bank is supported.",
        },
        { status: 200 }
      );
    }

    // Default path — landing_page / pricing — requires valid email.
    const email = (body.email ?? "").trim();
    if (!email || !isEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }
    const { error } = await supabase.from("waitlist").insert({
      email: email.toLowerCase(),
      source,
    });
    if (error) {
      // 23505 = unique_violation (email already on waitlist)
      if (error.code === "23505") {
        return NextResponse.json(
          {
            message:
              "You're already on the waitlist! We'll notify you soon.",
          },
          { status: 200 }
        );
      }
      throw error;
    }
    return NextResponse.json(
      {
        message:
          "Thanks! You're on the waitlist. We'll email you when credits go live.",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Waitlist error:", err);
    const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
    return NextResponse.json({ error: message, detail: String(err) }, { status: 500 });
  }
}

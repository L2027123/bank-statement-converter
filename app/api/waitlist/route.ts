import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Uses anon key — RLS policy allows anonymous INSERT on waitlist table.
// No service role key needed (safer — no privileged credentials in env).
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, source = "landing_page" } = await req.json();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }
    const { error } = await supabase
      .from("waitlist")
      .insert([{ email: email.toLowerCase().trim(), source }]);
    if (error) {
      // 23505 = unique_violation (email already on waitlist)
      if (error.code === "23505") {
        return NextResponse.json(
          { message: "You're already on the waitlist! We'll notify you soon." },
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
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

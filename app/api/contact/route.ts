import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Basic spam/abuse guards
const MAX_MESSAGE_LENGTH = 2000;
const MAX_NAME_LENGTH = 100;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message, source, is_demo } = body || {};

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    const nameStr = String(name).trim().slice(0, MAX_NAME_LENGTH);
    const emailStr = String(email).trim().slice(0, 200);
    const messageStr = String(message).trim().slice(0, MAX_MESSAGE_LENGTH);

    if (!nameStr || !emailStr || !messageStr) {
      return NextResponse.json(
        { error: "Fields cannot be empty." },
        { status: 400 }
      );
    }

    if (!EMAIL_RE.test(emailStr)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("contact_submissions").insert({
      name: nameStr,
      email: emailStr,
      message: messageStr,
      source: source ? String(source).slice(0, 100) : null,
      is_demo: Boolean(is_demo),
    });

    if (error) {
      console.error("Contact insert error:", error.message);
      return NextResponse.json(
        { error: "Failed to submit. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/signed-url?statement_id=xxx&type=excel|csv
// Returns a short-lived signed URL (5 minutes) for downloading the Excel or CSV file.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statementId = searchParams.get("statement_id");
    const type = searchParams.get("type"); // "excel" | "csv"

    if (!statementId || !type) {
      return NextResponse.json(
        { error: "Missing statement_id or type parameter." },
        { status: 400 }
      );
    }
    if (type !== "excel" && type !== "csv") {
      return NextResponse.json(
        { error: "Invalid type. Must be 'excel' or 'csv'." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Look up the statement; RLS ensures the user can only see their own.
    const { data: statement, error: stmtErr } = await supabase
      .from("statements")
      .select("id, user_id, excel_url, csv_url, status")
      .eq("id", statementId)
      .single();

    if (stmtErr || !statement) {
      return NextResponse.json({ error: "Statement not found." }, { status: 404 });
    }
    if (statement.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
    if (statement.status !== "completed") {
      return NextResponse.json(
        { error: "Statement is not ready for download." },
        { status: 400 }
      );
    }

    // The excel_url / csv_url columns now store the storage PATH (not a full URL).
    // For legacy rows that still contain a full URL, extract the path portion.
    const storagePath = type === "excel" ? statement.excel_url : statement.csv_url;
    if (!storagePath) {
      return NextResponse.json(
        { error: `No ${type} file available for this statement.` },
        { status: 404 }
      );
    }

    // Normalize: if it's a full URL, extract the path after "/exports/"
    let cleanPath = storagePath;
    if (cleanPath.startsWith("http")) {
      const match = cleanPath.match(/\/exports\/(.+)$/);
      if (match) {
        cleanPath = match[1];
      } else {
        return NextResponse.json(
          { error: "Stored file path is malformed." },
          { status: 500 }
        );
      }
    }

    // Generate signed URL valid for 5 minutes (300 seconds).
    const { data, error: signErr } = await supabase.storage
      .from("exports")
      .createSignedUrl(cleanPath, 300);

    if (signErr || !data?.signedUrl) {
      return NextResponse.json(
        { error: "Could not generate download link." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: data.signedUrl });
  } catch (err) {
    console.error("signed-url error:", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}

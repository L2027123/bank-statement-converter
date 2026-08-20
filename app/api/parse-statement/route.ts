import { NextResponse, type NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveCredits, getPlanLimit, nextResetDate } from "@/lib/credits";

export const maxDuration = 60;

interface Transaction {
  date: string | null;
  description: string | null;
  debit: number | null;
  credit: number | null;
  balance: number | null;
}

interface ParsedResult {
  transactions: Transaction[];
  opening_balance: number | null;
  closing_balance: number | null;
}

interface BalanceCheck {
  verified: boolean;
  opening: number | null;
  closing: number | null;
  calculated: number | null;
  delta: number | null;
  message: string;
}

const SYSTEM_PROMPT =
  "You are a bank statement parsing expert. Extract all transaction records from the following bank statement text. Return a JSON object with this shape: { \"opening_balance\": number_or_null, \"closing_balance\": number_or_null, \"transactions\": [ { \"date\": \"YYYY-MM-DD\", \"description\": \"string\", \"debit\": number_or_null, \"credit\": number_or_null, \"balance\": number_or_null } ] }. Opening and closing balance should be the numbers shown on the statement (null if not present). Return ONLY the JSON object, no other text.";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-chat";

async function parseWithAI(text: string): Promise<ParsedResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DeepSeek API key not configured. Set DEEPSEEK_API_KEY env var.");
  }
  const aiResp = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
      temperature: 0,
      max_tokens: 4000,
    }),
  });

  if (!aiResp.ok) {
    const errText = await aiResp.text();
    throw new Error(`DeepSeek API parsing failed (${aiResp.status}): ${errText}`);
  }

  const aiData = await aiResp.json();
  const responseText: string =
    aiData?.choices?.[0]?.message?.content ?? "";

  return extractParsedResult(responseText);
}

function parseRuleBased(text: string): ParsedResult {
  const transactions: Transaction[] = [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const datePattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
  const amountPattern = /\$?\s?([\d,]+(?:\.\d{2})?)/g;

  const skipPatterns = /^(statement period|opening balance|closing balance|account number|statement date|balance as of|daily balance|average balance)/i;

  // Extract opening / closing balance from full text via regex.
  const openingBalance = extractBalanceFromText(text, /opening\s+balance[:\s]+\$?\s?([\d,]+(?:\.\d{1,2})?)/i);
  const closingBalance = extractBalanceFromText(text, /closing\s+balance[:\s]+\$?\s?([\d,]+(?:\.\d{1,2})?)/i);

  for (const line of lines) {
    const dateMatch = line.match(datePattern);
    if (!dateMatch) continue;

    if (skipPatterns.test(line)) continue;

    const month = dateMatch[1].padStart(2, "0");
    const day = dateMatch[2].padStart(2, "0");
    let year = dateMatch[3];
    if (year.length === 2) year = "20" + year;
    const date = `${year}-${month}-${day}`;

    const rest = line.replace(datePattern, "").trim();

    const amounts: number[] = [];
    let amtMatch;
    const seen = new Set<string>();
    while ((amtMatch = amountPattern.exec(rest)) !== null) {
      const raw = amtMatch[1];
      const val = parseFloat(raw.replace(/,/g, ""));
      if (!isNaN(val) && !seen.has(raw)) {
        seen.add(raw);
        amounts.push(val);
      }
    }

    let debit: number | null = null;
    let credit: number | null = null;
    let balance: number | null = null;

    // Detect explicit leading CREDIT/DEBIT keyword first (e.g. "01/20/2026 CREDIT Freelance Payment $850.00").
    // This takes priority over substring matching to avoid misclassifying
    // "Freelance Payment" (contains "payment") as a debit when labeled CREDIT.
    const leadingCredit = /^\s*(credit|deposit|refund|income|transfer in|salary)\b/i.test(rest);
    const leadingDebit = /^\s*(debit|withdrawal|payment|charge|expense|check card|purchase)\b/i.test(rest);

    if (amounts.length === 1) {
      if (leadingCredit) credit = amounts[0];
      else if (leadingDebit) debit = amounts[0];
      else {
        const isCredit = /(credit|deposit|refund|income|transfer in|salary)/i.test(rest);
        const isDebit = /(debit|withdrawal|payment|charge|expense|check card|purchase)/i.test(rest);
        if (isCredit) credit = amounts[0];
        else if (isDebit) debit = amounts[0];
        else debit = amounts[0];
      }
    } else if (amounts.length === 2) {
      if (leadingCredit) {
        credit = amounts[0];
        balance = amounts[1];
      } else if (leadingDebit) {
        debit = amounts[0];
        balance = amounts[1];
      } else {
        const hasCreditLabel = /(credit|deposit|refund|income|transfer in|salary)/i.test(rest);
        const hasDebitLabel = /(debit|withdrawal|payment|charge|expense|check card|purchase)/i.test(rest);
        if (hasCreditLabel) {
          credit = amounts[0];
          balance = amounts[1];
        } else if (hasDebitLabel) {
          debit = amounts[0];
          balance = amounts[1];
        } else {
          debit = amounts[0];
          credit = amounts[1];
        }
      }
    } else if (amounts.length >= 3) {
      debit = !isNaN(amounts[0]) ? amounts[0] : null;
      credit = !isNaN(amounts[1]) ? amounts[1] : null;
      balance = amounts[2];
    }

    const description = rest
      .replace(/^(debit|credit)\b/i, "")
      .replace(/\$?\s?[\d,]+\.?\d*/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (description || debit !== null || credit !== null) {
      transactions.push({
        date,
        description: description || "Unknown transaction",
        debit,
        credit,
        balance,
      });
    }
  }

  return { transactions, opening_balance: openingBalance, closing_balance: closingBalance };
}

function extractBalanceFromText(text: string, pattern: RegExp): number | null {
  const m = text.match(pattern);
  if (!m || !m[1]) return null;
  const val = parseFloat(m[1].replace(/,/g, ""));
  return isNaN(val) ? null : val;
}

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000000";

const DEMO_SAMPLE_TEXT = `Chase Bank Statement
Account Number: XXXX-XXXX-1234
Statement Period: 01/01/2026 - 01/31/2026

Opening Balance: $5,000.00

Transactions:
01/02/2026 DEBIT Walmart Purchase $45.99
01/03/2026 CREDIT Salary Deposit $3,500.00
01/05/2026 DEBIT Netflix Subscription $15.99
01/08/2026 DEBIT Amazon Order $123.45
01/10/2026 CREDIT Refund from Store $25.00
01/12/2026 DEBIT Grocery Store $67.80
01/15/2026 DEBIT Gas Station $42.15
01/18/2026 DEBIT Electric Bill $89.00
01/20/2026 CREDIT Freelance Payment $850.00
01/22/2026 DEBIT Restaurant $56.30
01/25/2026 DEBIT Pharmacy $34.50
01/28/2026 DEBIT Internet Service $65.00

Closing Balance: $8,834.82
`;

export async function POST(request: NextRequest) {
  const isDemo = request.cookies.get("demo_mode")?.value === "true";

  if (isDemo) {
    return handleDemoMode(request);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { statementId } = (await request.json()) as { statementId?: string };
  if (!statementId) {
    return NextResponse.json({ error: "Missing statementId." }, { status: 400 });
  }

  const { data: statement, error: stmtError } = await supabase
    .from("statements")
    .select("id, user_id, filename, storage_path, status")
    .eq("id", statementId)
    .single();

  if (stmtError || !statement) {
    return NextResponse.json({ error: "Statement not found." }, { status: 404 });
  }
  if (statement.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (!statement.storage_path) {
    return NextResponse.json({ error: "Statement file is missing." }, { status: 400 });
  }

  let { data: profile } = await supabase
    .from("users")
    .select("plan, credits_remaining, credits_reset_date")
    .eq("id", user.id)
    .single();

  const eff = getEffectiveCredits((profile as any) ?? null);
  if (eff.resetNeeded) {
    const limit = getPlanLimit(eff.plan);
    await supabase
      .from("users")
      .update({ credits_remaining: limit, credits_reset_date: nextResetDate() })
      .eq("id", user.id);
  }
  if (!profile) {
    await supabase.from("users").insert({
      id: user.id,
      plan: "free",
      credits_remaining: getPlanLimit("free"),
      credits_reset_date: nextResetDate(),
    });
  }

  if (eff.remaining <= 0) {
    return NextResponse.json(
      { error: "You have no statements left this month. Please upgrade your plan." },
      { status: 403 }
    );
  }

  await supabase
    .from("statements")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("id", statementId);

  try {
    const { data: fileData, error: dlError } = await supabase.storage
      .from("statements")
      .download(statement.storage_path);
    if (dlError || !fileData) {
      throw new Error("Could not download the statement file.");
    }
    const buffer = Buffer.from(await fileData.arrayBuffer());

    // Dynamic import — pdf-parse is a heavy lib with Node-only deps that
    // can crash the Vercel function if loaded at module eval time.
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    await parser.destroy().catch(() => {});
    const text = textResult.text?.trim() ?? "";

    if (!text) {
      throw new Error("No text could be extracted from this PDF (it may be a scanned image).");
    }

    let parsed: ParsedResult;

    try {
      parsed = await parseWithAI(text);
    } catch {
      parsed = parseRuleBased(text);
    }

    const transactions = parsed.transactions;

    // Validation: don't deduct credits if parsing yielded no usable transactions.
    // This enforces the "Parse failed? No credits deducted" promise on the homepage.
    if (!Array.isArray(transactions) || transactions.length === 0) {
      throw new Error(
        "No transactions could be extracted from this statement. Please try a different PDF — you were not charged for this attempt."
      );
    }

    // Also reject if every transaction has null for date, description, and amounts
    // (means the parser returned junk objects, not real transactions).
    const hasAnyUsableField = transactions.some(
      (t) =>
        t.date ||
        (t.description && t.description.length > 0) ||
        t.debit != null ||
        t.credit != null
    );
    if (!hasAnyUsableField) {
      throw new Error(
        "The parsed result was empty or invalid. You were not charged for this attempt."
      );
    }

    // F1 — Balance auto-verification.
    const balanceCheck = computeBalanceCheck(
      transactions,
      parsed.opening_balance,
      parsed.closing_balance
    );

    const ws = XLSX.utils.json_to_sheet(transactions);
    // Append a balance verification marker row at the bottom of the sheet.
    XLSX.utils.sheet_add_aoa(
      ws,
      [[balanceCheck.verified ? "✓ Balance Verified" : "⚠ Balance mismatch detected, please review"]],
      { origin: -1 }
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const csvString = XLSX.utils.sheet_to_csv(ws);

    const excelPath = `${user.id}/${statementId}.xlsx`;
    const csvPath = `${user.id}/${statementId}.csv`;
    const { error: upErr } = await supabase.storage
      .from("exports")
      .upload(excelPath, excelBuffer, {
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        upsert: true,
      });
    if (upErr) {
      throw new Error(`Failed to store Excel file: ${upErr.message}`);
    }
    const { error: csvErr } = await supabase.storage
      .from("exports")
      .upload(csvPath, csvString, {
        contentType: "text/csv",
        upsert: true,
      });
    if (csvErr) {
      throw new Error(`Failed to store CSV file: ${csvErr.message}`);
    }

    // Store the storage PATH (not a public URL) — signed URLs are generated on demand.
    await supabase
      .from("statements")
      .update({
        status: "completed",
        parsed_data: transactions,
        excel_url: excelPath,
        csv_url: csvPath,
        updated_at: new Date().toISOString(),
      })
      .eq("id", statementId);

    await supabase
      .from("users")
      .update({ credits_remaining: eff.remaining - 1 })
      .eq("id", user.id);

    return NextResponse.json({
      statement: {
        id: statementId,
        filename: statement.filename,
        status: "completed",
        parsed_data: transactions,
        excel_url: excelPath,
        csv_url: csvPath,
      },
      balanceCheck,
    });
  } catch (err) {
    await supabase
      .from("statements")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("id", statementId);
    const message = err instanceof Error ? err.message : "Failed to parse statement.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleDemoMode(request: NextRequest) {
  try {
    const { statementId, filename } = (await request.json()) as {
      statementId?: string;
      filename?: string;
    };

    const text = DEMO_SAMPLE_TEXT;
    const parsed = parseRuleBased(text);
    const transactions = parsed.transactions;

    const balanceCheck = computeBalanceCheck(
      transactions,
      parsed.opening_balance,
      parsed.closing_balance
    );

    const ws = XLSX.utils.json_to_sheet(transactions);
    // Append balance verification marker to demo Excel as well.
    XLSX.utils.sheet_add_aoa(
      ws,
      [[balanceCheck.verified ? "✓ Balance Verified" : "⚠ Balance mismatch detected, please review"]],
      { origin: -1 }
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const csvString = XLSX.utils.sheet_to_csv(ws);

    const id = statementId || `demo-${Date.now()}`;
    const fn = filename || "demo-statement.pdf";

    return NextResponse.json({
      statement: {
        id,
        filename: fn,
        status: "completed",
        parsed_data: transactions,
        excel_url: null,
        csv_url: null,
      },
      balanceCheck,
      demo: true,
      excel_base64: excelBuffer.toString("base64"),
      csv_base64: Buffer.from(csvString, "utf-8").toString("base64"),
    });
  } catch (err) {
    console.error("handleDemoMode error:", err);
    const message = err instanceof Error ? err.message : "Demo mode failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// F1 — verify opening + sum(debits/credits) == closing.
// Tolerates a 0.01 rounding error.
function computeBalanceCheck(
  transactions: Transaction[],
  opening: number | null,
  closing: number | null
): BalanceCheck {
  if (opening == null || closing == null) {
    return {
      verified: false,
      opening,
      closing,
      calculated: null,
      delta: null,
      message: "Opening or closing balance not found on statement — skipped.",
    };
  }
  const sum = transactions.reduce((acc, t) => {
    return acc + (t.credit ?? 0) - (t.debit ?? 0);
  }, 0);
  const calculated = opening + sum;
  const delta = Math.round((calculated - closing) * 100) / 100;
  const verified = Math.abs(delta) < 0.01;
  return {
    verified,
    opening,
    closing,
    calculated,
    delta,
    message: verified
      ? "Balance verified — opening + transactions = closing."
      : `Balance mismatch detected, please review (off by ${delta.toFixed(2)}).`,
  };
}

function extractParsedResult(text: string): ParsedResult {
  // DeepSeek may wrap JSON in markdown code blocks (```json ... ```), strip them first.
  const cleaned = text
    .replace(/```(?:json)?/gi, "")
    .trim();

  // Try parsing as an object first (new format).
  const objStart = cleaned.indexOf("{");
  const objEnd = cleaned.lastIndexOf("}");
  if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
    const jsonText = cleaned.slice(objStart, objEnd + 1);
    try {
      const obj = JSON.parse(jsonText);
      if (obj && typeof obj === "object" && !Array.isArray(obj)) {
        const txns = Array.isArray(obj.transactions) ? obj.transactions : [];
        const transactions = txns.map((t: any) => ({
          date: t.date ?? null,
          description: t.description ?? null,
          debit: t.debit == null ? null : Number(t.debit),
          credit: t.credit == null ? null : Number(t.credit),
          balance: t.balance == null ? null : Number(t.balance),
        }));
        return {
          transactions,
          opening_balance:
            obj.opening_balance == null ? null : Number(obj.opening_balance),
          closing_balance:
            obj.closing_balance == null ? null : Number(obj.closing_balance),
        };
      }
    } catch {
      // fall through to array-format parsing below
    }
  }

  // Backward compat: AI may still return a JSON array (no opening/closing).
  const arrStart = cleaned.indexOf("[");
  const arrEnd = cleaned.lastIndexOf("]");
  if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
    const jsonText = cleaned.slice(arrStart, arrEnd + 1);
    try {
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed)) {
        const transactions = parsed.map((t: any) => ({
          date: t.date ?? null,
          description: t.description ?? null,
          debit: t.debit == null ? null : Number(t.debit),
          credit: t.credit == null ? null : Number(t.credit),
          balance: t.balance == null ? null : Number(t.balance),
        }));
        return { transactions, opening_balance: null, closing_balance: null };
      }
    } catch {
      // fall through
    }
  }

  return { transactions: [], opening_balance: null, closing_balance: null };
}

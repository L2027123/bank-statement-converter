"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { getEffectiveCredits, type Profile } from "@/lib/credits";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

type Stage = "idle" | "uploading" | "parsing" | "done" | "error";

interface Transaction {
  date: string | null;
  description: string | null;
  debit: number | null;
  credit: number | null;
  balance: number | null;
}

interface Statement {
  id: string;
  filename: string;
  status: string;
  parsed_data: Transaction[] | null;
  excel_url: string | null;
  csv_url: string | null;
}

const PARSE_MESSAGES = [
  "Reading your statement...",
  "Extracting transactions...",
  "Almost done...",
];

export default function UploadPage() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [limit, setLimit] = useState<number>(3);
  const [isDemo, setIsDemo] = useState(false);
  const [excelBase64, setExcelBase64] = useState<string | null>(null);
  const [csvBase64, setCsvBase64] = useState<string | null>(null);

  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [progressTarget, setProgressTarget] = useState(0);
  const [parseMsg, setParseMsg] = useState(PARSE_MESSAGES[0]);
  const [statement, setStatement] = useState<Statement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const checkDemo = useCallback(() => {
    if (typeof window === "undefined") return false;
    const urlParams = new URLSearchParams(window.location.search);
    const demoParam = urlParams.get("demo") === "true";
    const demoCookie = document.cookie.includes("demo_mode=true");
    return demoParam || demoCookie;
  }, []);

  // Load profile + credits on mount
  const loadCredits = useCallback(async () => {
    const demo = checkDemo();
    setIsDemo(demo);
    if (demo) {
      setRemaining(999);
      setLimit(999);
      return;
    }
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: p } = await supabase
      .from("users")
      .select("plan, credits_remaining, credits_reset_date")
      .eq("id", user.id)
      .single();
    const eff = getEffectiveCredits(p as Profile | null);
    setRemaining(eff.remaining);
    setLimit(eff.limit);
  }, [checkDemo]);

  useEffect(() => {
    loadCredits();
  }, [loadCredits]);

  // Animate progress toward target
  useEffect(() => {
    if (stage === "idle" || stage === "done") return;
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= progressTarget) return p;
        // ease toward target, leaving room for the real completion
        return Math.min(progressTarget, p + Math.max(1, (progressTarget - p) * 0.15));
      });
    }, 200);
    return () => clearInterval(id);
  }, [stage, progressTarget]);

  // Cycle parsing messages
  useEffect(() => {
    if (stage !== "parsing") return;
    let i = 0;
    setParseMsg(PARSE_MESSAGES[0]);
    const id = setInterval(() => {
      i = (i + 1) % PARSE_MESSAGES.length;
      setParseMsg(PARSE_MESSAGES[i]);
    }, 2200);
    return () => clearInterval(id);
  }, [stage]);

  async function processFile(file: File) {
    setError(null);
    setStatement(null);
    setProgress(0);
    setExcelBase64(null);
    setCsvBase64(null);

    if (!isDemo) {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login?redirect=/upload";
        return;
      }

      if (remaining !== null && remaining <= 0) {
        setError("You have no statements left this month. Upgrade your plan to continue.");
        setStage("error");
        return;
      }
    }

    setSelectedFile(file);

    // ---- Stage 1: upload + create statement row (skip in demo mode) ----
    setStage("uploading");
    setProgressTarget(30);

    let statementId: string;
    if (isDemo) {
      statementId = `demo-${Date.now()}`;
      await new Promise((r) => setTimeout(r, 600));
    } else {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login?redirect=/upload";
        return;
      }

      const path = `${user.id}/${crypto.randomUUID()}.pdf`;
      const { error: upErr } = await supabase.storage
        .from("statements")
        .upload(path, file, { contentType: "application/pdf", upsert: false });
      if (upErr) {
        setError(upErr.message);
        setStage("error");
        return;
      }

      const { data: row, error: insertErr } = await supabase
        .from("statements")
        .insert({
          user_id: user.id,
          filename: file.name,
          storage_path: path,
          status: "processing",
        })
        .select("id, filename, status")
        .single();
      if (insertErr || !row) {
        setError(insertErr?.message ?? "Failed to create statement record.");
        setStage("error");
        return;
      }
      statementId = row.id;
    }

    // ---- Stage 2: parse (server) ----
    setStage("parsing");
    setProgressTarget(92);

    try {
      const res = await fetch("/api/parse-statement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statementId, filename: file.name }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to parse statement.");
      }
      setStatement(data.statement as Statement);
      if (data.excel_base64) setExcelBase64(data.excel_base64);
      if (data.csv_base64) setCsvBase64(data.csv_base64);
      setProgress(100);
      setProgressTarget(100);
      setStage("done");
      if (!isDemo) await loadCredits();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStage("error");
    }
  }

  async function processDemoNoFile() {
    setError(null);
    setStatement(null);
    setProgress(0);
    setExcelBase64(null);
    setCsvBase64(null);
    setSelectedFile({ name: "demo-statement.pdf", size: 0 } as File);

    setStage("uploading");
    setProgressTarget(30);
    await new Promise((r) => setTimeout(r, 500));

    const statementId = `demo-${Date.now()}`;
    setStage("parsing");
    setProgressTarget(92);

    try {
      const res = await fetch("/api/parse-statement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statementId, filename: "demo-statement.pdf" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to parse statement.");
      }
      setStatement(data.statement as Statement);
      if (data.excel_base64) setExcelBase64(data.excel_base64);
      if (data.csv_base64) setCsvBase64(data.csv_base64);
      setProgress(100);
      setProgressTarget(100);
      setStage("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStage("error");
    }
  }

  function handleDownloadExcel() {
    if (excelBase64) {
      try {
        const binaryString = window.atob(excelBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = (statement?.filename?.replace(/\.pdf$/i, "") || "transactions") + ".xlsx";
        document.body.appendChild(a);
        a.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      } catch (err) {
        console.error("Download failed:", err);
        alert("下载失败: " + (err instanceof Error ? err.message : String(err)));
      }
    } else if (statement?.excel_url) {
      window.open(statement.excel_url, "_blank");
    } else {
      console.warn("No excel data available for download", { excelBase64, statement });
      alert("Excel 数据未就绪，请重试。");
    }
  }

  function handleDownloadCSV() {
    const baseName = statement?.filename?.replace(/\.pdf$/i, "") || "transactions";
    if (csvBase64) {
      try {
        const binaryString = window.atob(csvBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = baseName + ".csv";
        document.body.appendChild(a);
        a.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      } catch (err) {
        console.error("CSV download failed:", err);
        alert("下载失败: " + (err instanceof Error ? err.message : String(err)));
      }
    } else if (statement?.csv_url) {
      window.open(statement.csv_url, "_blank");
    } else {
      console.warn("No csv data available for download", { csvBase64, statement });
      alert("CSV 数据未就绪，请重试。");
    }
  }

  function handleFileInput(file: File | undefined) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a PDF file.");
      setStage("error");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("File is too large. Max size is 10 MB.");
      setStage("error");
      return;
    }
    processFile(file);
  }

  const previewRows = (statement?.parsed_data ?? []).slice(0, 10);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold text-brand">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white font-bold">
              B
            </span>
            Bank Statement Converter
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        {/* Remaining credits */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Convert a statement</h1>
          {remaining !== null && (
            <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand">
              You have {remaining} statement{remaining === 1 ? "" : "s"} left this month
            </span>
          )}
        </div>

        {/* Idle / uploading / parsing: dropzone or status */}
        {(stage === "idle" || stage === "uploading" || stage === "parsing") && (
          <Card>
            <CardContent className="p-8">
              {stage === "idle" && (
                <div className="flex flex-col gap-4">
                  <label
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragging(false);
                      handleFileInput(e.dataTransfer.files?.[0]);
                    }}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-white px-6 py-16 transition-colors ${
                      dragging ? "border-brand bg-brand/5" : "border-border hover:border-brand/50"
                    }`}
                  >
                    <svg
                      className="mb-3 h-10 w-10 text-brand"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 3A2.25 2.25 0 004.5 5.25v13.5A2.25 2.25 0 006.75 21h10.5a2.25 2.25 0 002.25-2.25V5.25A2.25 2.25 0 0017.25 3H6.75z"
                      />
                    </svg>
                    <p className="text-sm font-medium text-foreground">
                      Drag &amp; drop your PDF statement
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      or click to browse — PDF only, max 10 MB
                    </p>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      className="hidden"
                      onChange={(e) => handleFileInput(e.target.files?.[0])}
                    />
                  </label>
                  {isDemo && (
                    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-brand/30 bg-brand/5 px-6 py-4">
                      <p className="text-sm text-foreground">
                        👋 演示模式 — 点击下方按钮试用示例数据
                      </p>
                      <Button
                        onClick={() => processDemoNoFile()}
                        className="bg-brand hover:bg-brand/90"
                      >
                        ✨ 立即试用（无需上传文件）
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {(stage === "uploading" || stage === "parsing") && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-brand/20 border-t-brand" />
                  <p className="text-sm font-medium text-foreground">
                    {selectedFile?.name}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {stage === "uploading" ? "Uploading your statement..." : parseMsg}
                  </p>
                  <div className="mt-6 w-full max-w-md">
                    <Progress value={progress} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Done: preview + download */}
        {stage === "done" && statement && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-semibold text-success">Statement ready</p>
                    <p className="text-sm text-muted-foreground">
                      {statement.filename} · {(statement.parsed_data ?? []).length} transactions extracted
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="success" size="lg" onClick={handleDownloadExcel}>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                        />
                      </svg>
                      Download Excel
                    </Button>
                    <Button variant="outline" size="lg" onClick={handleDownloadCSV}>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                        />
                      </svg>
                      Download CSV
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <div className="border-b border-border px-6 py-4">
                  <p className="font-semibold text-foreground">Preview</p>
                  <p className="text-sm text-muted-foreground">First 10 transactions</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium">Description</th>
                        <th className="px-4 py-3 text-right font-medium">Debit</th>
                        <th className="px-4 py-3 text-right font-medium">Credit</th>
                        <th className="px-4 py-3 text-right font-medium">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {previewRows.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                            No transactions found.
                          </td>
                        </tr>
                      )}
                      {previewRows.map((t, i) => (
                        <tr key={i} className="text-foreground">
                          <td className="whitespace-nowrap px-4 py-3">{t.date ?? "—"}</td>
                          <td className="px-4 py-3">{t.description ?? "—"}</td>
                          <td className="px-4 py-3 text-right text-danger">
                            {t.debit != null ? t.debit.toLocaleString("en-US", { style: "currency", currency: "USD" }) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right text-success">
                            {t.credit != null ? t.credit.toLocaleString("en-US", { style: "currency", currency: "USD" }) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {t.balance != null ? t.balance.toLocaleString("en-US", { style: "currency", currency: "USD" }) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setStage("idle")}>
                Convert another statement
              </Button>
            </div>
          </div>
        )}

        {/* Error */}
        {stage === "error" && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <svg
                className="mb-3 h-10 w-10 text-danger"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m0 3.75h.007v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm font-medium text-danger">{error}</p>
              <Button variant="outline" className="mt-6" onClick={() => setStage("idle")}>
                Try again
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

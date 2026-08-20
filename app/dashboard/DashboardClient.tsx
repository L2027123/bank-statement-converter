"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface StatementRow {
  id: string;
  filename: string;
  status: string;
  excel_url: string | null;
  csv_url: string | null;
  created_at: string;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: "bg-success/10 text-success",
    processing: "bg-brand/10 text-brand",
    pending: "bg-muted text-muted-foreground",
    failed: "bg-danger/10 text-danger",
  };
  const cls = map[status] ?? map.pending;
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function DashboardHeader({ isDemo }: { isDemo: boolean }) {
  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-brand">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white font-bold">
            B
          </span>
          Bank Statement Converter
        </Link>
        <div className="flex items-center gap-2">
          {isDemo && (
            <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
              演示模式
            </span>
          )}
          <Link
            href={isDemo ? "/upload?demo=true" : "/upload"}
            className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
          >
            New statement
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function DashboardClient({
  plan,
  remaining,
  limit,
  used,
  history,
  isDemo,
}: {
  plan: string;
  remaining: number;
  limit: number;
  used: number;
  history: StatementRow[];
  isDemo: boolean;
}) {
  const percent = limit > 0 ? Math.min(100, (used / limit) * 100) : 100;

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader isDemo={isDemo} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Current plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold capitalize text-foreground">
                    {plan}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {used} of {limit} statements used this month
                  </p>
                </div>
                {plan === "free" && (
                  <Button asChild>
                    <Link href="/#pricing">Upgrade to Pro</Link>
                  </Button>
                )}
              </div>
              <div className="mt-4">
                <Progress value={percent} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-brand">{remaining}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                statements left this month
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3 font-medium">File</th>
                    <th className="px-6 py-3 font-medium">Uploaded</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                        No statements yet.{" "}
                        <Link href="/upload" className="text-brand underline-offset-4 hover:underline">
                          Convert your first one
                        </Link>
                        .
                      </td>
                    </tr>
                  )}
                  {history.map((s) => (
                    <tr key={s.id} className="text-foreground">
                      <td className="max-w-[18rem] truncate px-6 py-3">{s.filename}</td>
                      <td className="whitespace-nowrap px-6 py-3 text-muted-foreground">
                        {new Date(s.created_at).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-6 py-3 text-right">
                        {s.status === "completed" ? (
                          <div className="flex justify-end gap-1">
                            {s.excel_url && !isDemo ? (
                              <Button
                                size="sm"
                                variant="success"
                                onClick={async () => {
                                  try {
                                    const r = await fetch(`/api/signed-url?statement_id=${s.id}&type=excel`);
                                    const data = await r.json();
                                    if (!r.ok) throw new Error(data.error || "Failed to get download link");
                                    window.open(data.url, "_blank");
                                  } catch (e) {
                                    alert(e instanceof Error ? e.message : "Download failed");
                                  }
                                }}
                              >
                                Excel
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => {
                                  alert(isDemo ? "演示模式：请回到上传页生成 Excel" : "Excel 文件不可用");
                                }}
                              >
                                Excel
                              </Button>
                            )}
                            {s.csv_url && !isDemo ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  try {
                                    const r = await fetch(`/api/signed-url?statement_id=${s.id}&type=csv`);
                                    const data = await r.json();
                                    if (!r.ok) throw new Error(data.error || "Failed to get download link");
                                    window.open(data.url, "_blank");
                                  } catch (e) {
                                    alert(e instanceof Error ? e.message : "Download failed");
                                  }
                                }}
                              >
                                CSV
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  alert(isDemo ? "演示模式：请回到上传页生成 CSV" : "CSV 文件不可用");
                                }}
                              >
                                CSV
                              </Button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
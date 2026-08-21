"use client";

import { useEffect, useState } from "react";

export default function DemoAnimation() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    function runCycle() {
      setStage(0);
      timers.push(setTimeout(() => setStage(1), 2000));
      timers.push(setTimeout(() => setStage(2), 5000));
      timers.push(setTimeout(() => setStage(3), 7500));
      timers.push(setTimeout(() => setStage(4), 10000));
    }

    runCycle();
    const cycleInterval = setInterval(runCycle, 15500);

    return () => {
      clearInterval(cycleInterval);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="relative mx-auto mt-10 max-w-3xl">
      {/* Browser frame */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xl ring-1 ring-brand/10">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-border bg-muted px-4 py-2">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            <span className="h-3 w-3 rounded-full bg-yellow-400" />
            <span className="h-3 w-3 rounded-full bg-green-400" />
          </div>
          <div className="mx-auto rounded-md bg-background px-3 py-0.5 text-xs text-muted-foreground">
            bank-statement-converter.vercel.app/upload?demo=true
          </div>
        </div>

        {/* Demo content */}
        <div className="relative min-h-[380px] bg-gradient-to-b from-background to-muted/50 p-6">
          {/* Stage 0: Upload zone */}
          {stage === 0 && (
            <div className="demo-stage is-active">
              <div className="mx-auto max-w-md">
                <div className="mb-4 text-center text-sm font-medium text-muted-foreground">
                  Drop your bank statement PDF here
                </div>
                <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-brand/30 bg-brand/5">
                  <div className="demo-pdf-icon">
                    <div className="flex h-12 w-12 items-center justify-center rounded bg-red-100">
                      <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <span className="mt-1 text-[10px] font-medium text-red-400">Chase_Statement.pdf</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stage 1: Parsing */}
          {stage === 1 && (
            <div className="demo-stage is-active">
              <div className="mx-auto max-w-md py-8 text-center">
                <div className="mb-3 flex items-center justify-center gap-2">
                  <div className="demo-spinner h-5 w-5 rounded-full border-2 border-brand/20 border-t-brand" />
                  <span className="text-sm font-medium text-foreground">AI parsing your statement...</span>
                </div>
                <div className="mx-auto h-2 max-w-xs overflow-hidden rounded-full bg-muted">
                  <div className="demo-progress h-full rounded-full bg-brand" />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Detecting bank format · Extracting transactions · Verifying balances
                </p>
              </div>
            </div>
          )}

          {/* Stage 2-4: Results */}
          {stage >= 2 && (
            <div className="demo-stage is-active">
              <div className="mx-auto max-w-lg">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Transactions (255)</h3>
                  <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                    100% accuracy
                  </span>
                </div>

                <div className="overflow-hidden rounded-lg border border-border bg-background">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted text-muted-foreground">
                        <th className="px-3 py-2 text-left font-medium">Date</th>
                        <th className="px-3 py-2 text-left font-medium">Description</th>
                        <th className="px-3 py-2 text-right font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[
                        { date: "03/01", desc: "STARBUCKS #123 SEATTLE WA", amt: "-$6.75" },
                        { date: "03/02", desc: "DIRECT DEPOSIT PAYROLL", amt: "+$3,200.00" },
                        { date: "03/03", desc: "AMAZON.COM*123ABC", amt: "-$45.99" },
                        { date: "03/05", desc: "SHELL OIL 57410123", amt: "-$52.30" },
                        { date: "03/08", desc: "NETFLIX.COM", amt: "-$15.49" },
                      ].map((t, i) => (
                        <tr key={i}>
                          <td className="px-3 py-1.5 text-foreground">{t.date}</td>
                          <td className="px-3 py-1.5 text-muted-foreground">{t.desc}</td>
                          <td className={`px-3 py-1.5 text-right font-medium ${t.amt.startsWith("+") ? "text-success" : "text-danger"}`}>
                            {t.amt}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {stage >= 3 && (
                    <div className="border-t border-border bg-muted/50 px-3 py-2 text-center text-xs text-muted-foreground">
                      + 250 more transactions...
                    </div>
                  )}
                </div>

                {stage >= 3 && (
                  <div className="demo-fade-in mt-4 flex items-center gap-3 rounded-lg border border-success/30 bg-success/5 p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">Balance verified</p>
                      <p className="text-xs text-muted-foreground">Opening $5,000.00 + 255 transactions = Closing $8,834.82</p>
                    </div>
                  </div>
                )}

                {stage >= 4 && (
                  <div className="demo-fade-in mt-4 flex gap-3">
                    <button className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Download Excel
                    </button>
                    <button className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Download CSV
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        10 seconds. No signup. No credit card. See your bank statement as a clean Excel.
      </p>

      <div className="mt-3 flex justify-center gap-1.5">
        {[0, 1, 2, 3, 4].map((s) => (
          <span
            key={s}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              stage >= s ? "bg-brand" : "bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

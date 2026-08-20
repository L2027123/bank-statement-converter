import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "BankStatementConverter.com Alternative — Why Bookkeepers Are Switching",
  description:
    "Free BankStatementConverter.com alternative. Parse Chase, BofA, Wells Fargo PDFs to Excel & CSV with AI. No monthly subscription — pay only for what you use.",
  alternates: { canonical: "/alternatives/bankstatementconverter" },
};

const COMPETITOR = {
  name: "BankStatementConverter.com",
  freePages: "2–5 pages/day",
  paidPlan: "$19/month for 100 pages",
  keyWeaknesses: [
    {
      title: "Free quota too limited",
      competitor: "2–5 pages per day on the free plan",
      ours: "3 free conversions — no daily cap, no page count",
    },
    {
      title: "Scan accuracy is inconsistent",
      competitor: "Basic OCR skips transactions or misreads amounts on scanned/image PDFs",
      ours: "DeepSeek AI parser handles scanned layouts with 85%+ accuracy",
    },
    {
      title: "No AI transaction categorization",
      competitor: "All transactions exported as raw text — manual categorization in Excel or QuickBooks required",
      ours: "AI auto-categorizes transactions (Office Supplies, Food, Travel, etc.)",
    },
    {
      title: "No client management",
      competitor: "Flat history — all clients' conversions mixed together. Bookkeepers use filenames to manually distinguish",
      ours: "Per-client organization with folder grouping for multi-client bookkeepers",
    },
    {
      title: "Monthly subscription lock-in",
      competitor: "$19/month for 100 pages — unused quota expires monthly",
      ours: "Pay-per-use credit packs. Credits never expire. Buy only when you need.",
    },
  ],
};

const COMPARE_ROWS = [
  { feature: "Free tier", competitor: "2–5 pages/day", ours: "3 free conversions — no signup, no daily cap" },
  { feature: "Paid model", competitor: "$19/month (100 pages, expires monthly)", ours: "Credit packs from $5 — credits never expire" },
  { feature: "Parser", competitor: "Rule-based + basic OCR", ours: "DeepSeek AI with 85%+ accuracy on scanned PDFs" },
  { feature: "Transaction categories", competitor: "Manual in Excel/QuickBooks", ours: "AI auto-categorization built-in" },
  { feature: "Client management", competitor: "None — flat history only", ours: "Per-client folders for multi-client bookkeepers" },
  { feature: "Export formats", competitor: "Excel only", ours: "Excel + CSV" },
  { feature: "Bulk processing", competitor: "Limited", ours: "Coming soon" },
  { feature: "AI parsing fails?", competitor: "Credits deducted regardless", ours: "You pay nothing — credits only deducted after successful extraction" },
];

export default function AlternativePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold text-brand">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white font-bold">
              B
            </span>
            Bank Statement Converter
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/upload?demo=true">Try Free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand/5 to-white" />
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:py-20">
          <span className="inline-flex items-center rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
            Free alternative · No credit card required
          </span>
          <h1 className="mx-auto mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            BankStatementConverter.com Alternative
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Why bookkeepers are switching from {COMPETITOR.name} — and trying our
            AI-powered parser instead. Pay-per-use, not per month.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link href="/upload?demo=true">Try 3 Free Conversions →</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/#pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why bookkeepers are switching */}
      <section className="mx-auto w-full max-w-5xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold tracking-tight text-foreground">
          5 reasons to switch
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
          Based on public reviews and bookkeeper feedback about{" "}
          {COMPETITOR.name}.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {COMPETITOR.keyWeaknesses.map((w, i) => (
            <div
              key={i}
              className="flex flex-col rounded-xl border border-border bg-white p-6 shadow-sm"
            >
              <h3 className="font-semibold text-foreground">{w.title}</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <span className="font-medium text-danger">
                    {COMPETITOR.name}:
                  </span>{" "}
                  <span className="text-muted-foreground">{w.competitor}</span>
                </div>
                <div>
                  <span className="font-medium text-success">Us:</span>{" "}
                  <span className="text-muted-foreground">{w.ours}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Side-by-side comparison */}
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-3xl font-bold tracking-tight text-foreground">
            Side-by-side comparison
          </h2>
          <div className="mt-10 overflow-hidden rounded-xl border border-border bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                    Feature
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                    {COMPETITOR.name}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-brand">
                    Us
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row, i) => (
                  <tr
                    key={i}
                    className={i % 2 === 0 ? "bg-white" : "bg-muted/20"}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {row.feature}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {row.competitor}
                    </td>
                    <td className="px-4 py-3 text-sm text-brand">
                      {row.ours}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-4xl px-4 py-16 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Ready to convert your first statement?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          No credit card required. Parse 3 free statements — if you're not
          satisfied, you owe nothing.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="/upload?demo=true">Try 3 Free — No Signup</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/#pricing">See Credit Packs</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Bank Statement Converter. All rights
            reserved.
          </p>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-brand">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-brand">
              Terms of Service
            </Link>
            <Link href="/" className="hover:text-brand">
              Back to home
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BANKS } from "@/lib/banks";
import WaitlistForm from "@/components/WaitlistForm";
import DemoAnimation from "@/components/DemoAnimation";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const PLANS = [
  {
    name: "Starter",
    credits: 10,
    price: 5,
    blurb: "For occasional use",
    features: [
      "10 credits = 10 statements",
      "Excel & CSV export",
      "No subscription, no auto-renew",
      "Credits never expire",
    ],
    cta: "Get Started Free",
    source: "pricing_starter",
    highlight: false,
  },
  {
    name: "Pro",
    credits: 50,
    price: 19,
    blurb: "Most popular for regular bookkeeping",
    features: [
      "50 credits = 50 statements",
      "Excel & CSV export",
      "Priority email support",
      "Credits never expire",
    ],
    cta: "Get Started Free",
    source: "pricing_pro",
    highlight: true,
  },
  {
    name: "Tax Season Pack",
    credits: 100,
    price: 29,
    blurb: "For busy season — 90-day priority",
    features: [
      "100 credits = 100 statements",
      "90-day priority processing queue",
      "Excel & CSV export",
      "Credits never expire",
    ],
    cta: "Get Started Free",
    source: "pricing_tax",
    highlight: false,
  },
];

const HERO_BULLETS = [
  "Currently optimized for Chase, Bank of America, and Wells Fargo",
  "Other major banks supported via AI parsing (85%+ accuracy)",
  "Supports IBAN / VAT extraction for European business statements",
  "Scanning/image-based PDFs not yet supported — we're adding OCR soon",
];

export default function Home() {
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a PDF file.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("File is too large. Max size is 10 MB.");
      return;
    }
    // Upload + parsing happen on /upload (auth-protected). Middleware will
    // redirect to /login if the visitor is not signed in.
    router.push("/upload");
  }

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
              <Link href="/login?redirect=/upload">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand/5 to-white" />
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">
            Bank Statement Converter
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            PDF to Excel &amp; CSV — Pay Per Use, Not Per Month
          </h1>

          {/* Hero bullets */}
          <ul className="mx-auto mt-8 max-w-2xl space-y-3 text-left">
            {HERO_BULLETS.map((b) => (
              <li
                key={b}
                className="flex items-start gap-3 text-base text-foreground"
              >
                <svg
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-success"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
                <span>{b}</span>
              </li>
            ))}
          </ul>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={() => router.push("/upload?demo=true")}
              className="h-12 px-6 text-base"
            >
              Try 3 Free — No Signup
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                const el = document.getElementById("pricing");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="h-12 px-6 text-base"
            >
              View Pricing
            </Button>
          </div>

          {/* Auto-playing demo */}
          <DemoAnimation />

          {/* Upload area */}
          <div className="mx-auto mt-12 max-w-2xl">
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handleFile(e.dataTransfer.files?.[0]);
              }}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-white px-6 py-12 transition-colors ${
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
                Drag &amp; drop your statement here
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                or click to browse — PDF only, max 10 MB
              </p>
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </label>
            {error && <p className="mt-3 text-sm text-danger">{error}</p>}
          </div>
        </div>
      </section>

      {/* Trust — Why bookkeepers trust us */}
      <section className="w-full border-t border-b border-border bg-brand/[0.03]">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:py-16">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand">
              Why bookkeepers trust us
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-sm">
            <ul className="space-y-4">
              {[
                "Try 3 statements free — no signup, no credit card",
                "Parse failed? No credits deducted",
                "Currently optimized for Chase, BofA, Wells Fargo",
              ].map((b) => (
                <li key={b} className="flex items-start gap-3 text-base text-foreground sm:text-lg">
                  <svg
                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-success"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Pay Per Use. No Subscription. No Auto-Renew.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            One credit = one bank statement PDF. Buy as many or as few as you need. Credits never expire.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col ${
                plan.highlight ? "border-brand ring-2 ring-brand/20" : ""
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-xs font-medium text-white">
                  Most popular
                </span>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{plan.blurb}</p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">
                    ${plan.price}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium text-brand">
                  {plan.credits} credits · {plan.credits} statements
                </p>
                <ul className="mt-6 flex-1 space-y-3 text-sm text-muted-foreground">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4 text-success"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <WaitlistForm source={plan.source} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Credit system launching this week. Join the waitlist above to be notified first.
          <span className="mx-2">·</span>
          <Link
            href="/alternatives/bankstatementconverter"
            className="text-brand hover:underline"
          >
            See how we compare →
          </Link>
        </p>
      </section>

      {/* Supported Banks */}
      <section
        id="banks"
        className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Supported banks
          </h2>
          <p className="mt-3 text-muted-foreground">
            Pick your bank to see how our parser handles your specific
            statement format.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {BANKS.map((bank) => (
            <Link
              key={bank.slug}
              href={`/bank/${bank.slug}`}
              className="group rounded-lg border border-border bg-white p-4 text-sm font-medium text-foreground transition-colors hover:border-brand hover:bg-brand/5"
            >
              <div className="font-semibold">{bank.name}</div>
              <div className="mt-1 text-xs text-muted-foreground line-clamp-1">
                {bank.statementTypes.slice(0, 2).join(" · ")}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Bank Statement Converter. All rights reserved.
          </p>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-brand">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-brand">
              Terms of Service
            </Link>
            <a
              href="mailto:junliang2027@outlook.com"
              className="hover:text-brand"
            >
              Contact
            </a>
            <Link
              href="/alternatives/bankstatementconverter"
              className="hover:text-brand"
            >
              Compare
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

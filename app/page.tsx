"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const PLANS = [
  {
    name: "Free",
    price: 0,
    blurb: "For trying things out",
    features: ["3 statements / month", "Excel export", "Email support"],
    cta: "Get Started Free",
    highlight: false,
  },
  {
    name: "Pro",
    price: 19,
    blurb: "For freelancers & individuals",
    features: ["50 statements / month", "Excel & CSV export", "Priority support"],
    cta: "Start Pro",
    highlight: true,
  },
  {
    name: "Business",
    price: 39,
    blurb: "For teams & high volume",
    features: ["200 statements / month", "Bulk upload", "Dedicated support"],
    cta: "Start Business",
    highlight: false,
  },
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
          <span className="inline-flex items-center rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
            AI-powered · 500+ banks supported
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Convert Bank Statements to Excel in Seconds
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            AI-powered parser for Chase, Wells Fargo, Bank of America, and 500+
            banks. Upload a PDF — get a clean Excel file back.
          </p>

          {/* Upload area */}
          <div className="mx-auto mt-10 max-w-2xl">
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
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => router.push("/upload?demo=true")}
              >
                ✨ 试用演示版（无需注册）
              </Button>
            </div>
          </div>

          {/* Supported banks */}
          <div className="mt-12">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Works with statements from
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-semibold text-foreground">
              <span>Chase</span>
              <span className="text-border">·</span>
              <span>Wells Fargo</span>
              <span className="text-border">·</span>
              <span>Bank of America</span>
              <span className="text-border">·</span>
              <span>Citi</span>
              <span className="text-border">·</span>
              <span>Capital One</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Simple, transparent pricing
          </h2>
          <p className="mt-3 text-muted-foreground">
            Start free. Upgrade when you need more.
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
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
                <p className="mt-2 text-sm font-medium text-brand">
                  {plan.price === 0 ? "3" : plan.name === "Pro" ? "50" : "200"} statements/month
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
                <Button
                  className="mt-6 w-full"
                  variant={plan.highlight ? "default" : "outline"}
                  onClick={() => router.push("/login?redirect=/upload")}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
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
              href="mailto:support@bankstatementconverter.com"
              className="hover:text-brand"
            >
              Contact
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

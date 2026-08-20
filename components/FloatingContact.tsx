"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export default function FloatingContact() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function isDemo() {
    if (typeof window === "undefined") return false;
    return (
      new URLSearchParams(window.location.search).get("demo") === "true" ||
      document.cookie.includes("demo_mode=true")
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          message: form.message,
          source: window.location.pathname,
          is_demo: isDemo(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setStatus("success");
      setForm({ name: "", email: "", message: "" });
      setTimeout(() => {
        setStatus("idle");
        setOpen(false);
      }, 2500);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-2 w-80 rounded-lg border border-border bg-white p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              Questions? Get in touch.
            </p>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {status === "success" ? (
            <div className="py-6 text-center">
              <div className="mb-2 text-3xl">✓</div>
              <p className="text-sm font-medium text-success">
                Message sent! We&apos;ll reply within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2">
              <input
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                maxLength={100}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
              <input
                type="email"
                placeholder="Your email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                maxLength={200}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
              <textarea
                placeholder="How can we help?"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
                maxLength={2000}
                rows={3}
                className="w-full resize-none rounded-md border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
              {status === "error" && errorMsg && (
                <p className="text-xs text-danger">{errorMsg}</p>
              )}
              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
              >
                {status === "submitting" ? "Sending..." : "Send Message"}
              </button>
              <p className="text-center text-xs text-muted-foreground">
                We usually reply within 24 hours.
              </p>
            </form>
          )}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white shadow-lg transition-transform hover:scale-105"
        aria-label="Contact us"
      >
        {open ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        )}
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RequestBankFormProps {
  onSuccess?: () => void;
}

type Status = "idle" | "loading" | "success" | "error";

export default function RequestBankForm({ onSuccess }: RequestBankFormProps) {
  const [bankName, setBankName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bankName.trim()) {
      setStatus("error");
      setMessage("Please enter the bank name.");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim() || null,
          source: "bank_request",
          metadata: { bank_name: bankName.trim() },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request.");
      }
      setStatus("success");
      setMessage(
        data.message ||
          "Thanks! We'll email you when this bank is supported."
      );
      setBankName("");
      setEmail("");
      if (onSuccess) {
        // Let the user see the success message briefly before the parent hides us.
        setTimeout(() => onSuccess(), 1500);
      }
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-sm text-success">
        <p className="font-medium">✓ Request received</p>
        <p className="mt-1 text-xs opacity-90">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <label htmlFor="bank-name" className="text-xs font-medium text-foreground">
          Bank name <span className="text-danger">*</span>
        </label>
        <Input
          id="bank-name"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          placeholder="e.g., American Express, TD Bank"
          required
          disabled={status === "loading"}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="bank-email" className="text-xs font-medium text-foreground">
          Your email (optional)
        </label>
        <Input
          id="bank-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="We'll notify you when this bank is supported"
          disabled={status === "loading"}
        />
      </div>
      <Button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-brand hover:bg-brand/90"
      >
        {status === "loading" ? "Submitting..." : "Submit Request"}
      </Button>
      {status === "error" && (
        <p className="text-xs text-danger">{message}</p>
      )}
      <p className="text-[11px] text-muted-foreground">
        We use this to prioritize which banks to add next. No spam.
      </p>
    </form>
  );
}

"use client";

import { useEffect } from "react";

/**
 * Tracks page views to /api/track endpoint.
 * Fires on mount and on route changes.
 * Uses a session cookie to identify unique visitors.
 */
export default function Analytics() {
  useEffect(() => {
    let sessionId = document.cookie
      .split("; ")
      .find((c) => c.startsWith("session_id="))
      ?.split("=")[1];

    if (!sessionId) {
      sessionId = `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      document.cookie = `session_id=${sessionId}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    }

    const isDemo =
      new URLSearchParams(window.location.search).get("demo") === "true" ||
      document.cookie.includes("demo_mode=true");

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: window.location.pathname + window.location.search,
        referrer: document.referrer || null,
        session_id: sessionId,
        is_demo: isDemo,
      }),
      keepalive: true,
    }).catch(() => {});
  }, []);

  return null;
}

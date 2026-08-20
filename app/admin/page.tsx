"use client";

import { useState } from "react";

interface Stats {
  totalViews: number;
  uniqueVisitors: number;
  demoUsers: number;
  registeredUsers: number;
  totalStatements: number;
  completedStatements: number;
  funnel: { path: string; visits: string; unique_visits: string }[];
  recent: { path: string; session_id: string; is_demo: boolean; created_at: string }[];
  daily: { day: string; views: string; unique_visitors: string }[];
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadStats() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${password}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load stats");
      }
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
    setLoading(false);
  }

  if (!stats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-sm rounded-lg border border-border bg-white p-8 shadow-sm">
          <h1 className="mb-4 text-2xl font-bold text-foreground">Admin</h1>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadStats()}
            className="mb-3 w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
          {error && <p className="mb-3 text-sm text-danger">{error}</p>}
          <button
            onClick={loadStats}
            disabled={loading || !password}
            className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {loading ? "Loading..." : "Login"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
          <button
            onClick={() => setStats(null)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Logout
          </button>
        </div>

        {/* Overview cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-border bg-white p-4">
            <p className="text-xs text-muted-foreground">Total Views</p>
            <p className="text-2xl font-bold text-foreground">{stats.totalViews}</p>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <p className="text-xs text-muted-foreground">Unique Visitors</p>
            <p className="text-2xl font-bold text-foreground">{stats.uniqueVisitors}</p>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <p className="text-xs text-muted-foreground">Demo Users</p>
            <p className="text-2xl font-bold text-brand">{stats.demoUsers}</p>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <p className="text-xs text-muted-foreground">Registered</p>
            <p className="text-2xl font-bold text-success">{stats.registeredUsers}</p>
          </div>
        </div>

        {/* Conversion funnel */}
        <div className="mb-8 rounded-lg border border-border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Funnel — Where users go</h2>
          <div className="space-y-2">
            {stats.funnel.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-64 truncate text-sm text-foreground">{f.path}</span>
                <span className="text-sm text-muted-foreground">{f.visits} visits</span>
                <span className="text-xs text-muted-foreground">({f.unique_visits} unique)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Statements */}
        <div className="mb-8 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-white p-4">
            <p className="text-xs text-muted-foreground">Statements Uploaded</p>
            <p className="text-2xl font-bold text-foreground">{stats.totalStatements}</p>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <p className="text-xs text-muted-foreground">Successfully Parsed</p>
            <p className="text-2xl font-bold text-success">{stats.completedStatements}</p>
          </div>
        </div>

        {/* Last 7 days */}
        {stats.daily.length > 0 && (
          <div className="mb-8 rounded-lg border border-border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Last 7 days</h2>
            <div className="space-y-2">
              {stats.daily.map((d, i) => (
                <div key={i} className="flex items-center gap-4 text-sm">
                  <span className="w-32 text-muted-foreground">
                    {new Date(d.day).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  <span className="text-foreground">{d.views} views</span>
                  <span className="text-muted-foreground">{d.unique_visitors} unique</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent activity */}
        <div className="rounded-lg border border-border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Recent 20 page views</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-4">Time</th>
                  <th className="py-2 pr-4">Path</th>
                  <th className="py-2 pr-4">Session</th>
                  <th className="py-2">Type</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((r, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 pr-4 text-muted-foreground">
                      {new Date(r.created_at).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="py-2 pr-4 text-foreground">{r.path}</td>
                    <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">
                      {r.session_id.slice(0, 12)}...
                    </td>
                    <td className="py-2">
                      {r.is_demo ? (
                        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">Demo</span>
                      ) : (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Visitor</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

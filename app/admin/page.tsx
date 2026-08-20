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

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  message: string;
  source: string | null;
  is_demo: boolean;
  created_at: string;
}

interface ContactData {
  total: number;
  demoCount: number;
  submissions: ContactSubmission[];
}

interface WaitlistEntry {
  id: string;
  email: string;
  source: string;
  created_at: string;
}

interface WaitlistData {
  total: number;
  entries: WaitlistEntry[];
}

type Tab = "analytics" | "contact" | "waitlist";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [contactData, setContactData] = useState<ContactData | null>(null);
  const [waitlistData, setWaitlistData] = useState<WaitlistData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("analytics");

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

  async function loadContacts() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/contact-list", {
        headers: { Authorization: `Bearer ${password}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load contacts");
      }
      setContactData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
    setLoading(false);
  }

  async function loadWaitlist() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/waitlist", {
        headers: { Authorization: `Bearer ${password}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load waitlist");
      }
      setWaitlistData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
    setLoading(false);
  }

  function switchTab(t: Tab) {
    if (t === "contact" && !contactData) {
      setTab(t);
      loadContacts();
    } else if (t === "waitlist" && !waitlistData) {
      setTab(t);
      loadWaitlist();
    } else {
      setTab(t);
    }
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
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <button
            onClick={() => {
              setStats(null);
              setContactData(null);
              setWaitlistData(null);
            }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-border">
          <button
            onClick={() => switchTab("analytics")}
            className={`px-4 py-2 text-sm font-medium ${
              tab === "analytics"
                ? "border-b-2 border-brand text-brand"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => switchTab("contact")}
            className={`px-4 py-2 text-sm font-medium ${
              tab === "contact"
                ? "border-b-2 border-brand text-brand"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Contact Form{contactData ? ` (${contactData.total})` : ""}
          </button>
          <button
            onClick={() => switchTab("waitlist")}
            className={`px-4 py-2 text-sm font-medium ${
              tab === "waitlist"
                ? "border-b-2 border-brand text-brand"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Waitlist{waitlistData ? ` (${waitlistData.total})` : ""}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
            {error}
          </div>
        )}

        {tab === "contact" ? (
          <ContactTab data={contactData} loading={loading} onRefresh={loadContacts} />
        ) : tab === "waitlist" ? (
          <WaitlistTab data={waitlistData} loading={loading} onRefresh={loadWaitlist} />
        ) : (
          <AnalyticsTab stats={stats} />
        )}
      </div>
    </div>
  );
}

function AnalyticsTab({ stats }: { stats: Stats }) {
  return (
    <>
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
    </>
  );
}

function ContactTab({
  data,
  loading,
  onRefresh,
}: {
  data: ContactData | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  if (loading && !data) {
    return (
      <div className="rounded-lg border border-border bg-white p-8 text-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!data || data.submissions.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-white p-8 text-center">
        <p className="text-sm text-muted-foreground">No contact form submissions yet.</p>
        <button
          onClick={onRefresh}
          className="mt-3 text-sm text-brand hover:underline"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data.total} submission{data.total === 1 ? "" : "s"} ({data.demoCount} from demo mode)
        </p>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="text-sm text-brand hover:underline disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="space-y-3">
        {data.submissions.map((s) => (
          <div key={s.id} className="rounded-lg border border-border bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{s.name}</span>
                <a
                  href={`mailto:${s.email}`}
                  className="text-sm text-brand hover:underline"
                >
                  {s.email}
                </a>
                {s.is_demo && (
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">
                    Demo
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(s.created_at).toLocaleString("en-US", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap">{s.message}</p>
            {s.source && (
              <p className="mt-2 text-xs text-muted-foreground">From: {s.source}</p>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function WaitlistTab({
  data,
  loading,
  onRefresh,
}: {
  data: WaitlistData | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  if (loading && !data) {
    return (
      <div className="rounded-lg border border-border bg-white p-8 text-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!data || data.entries.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-white p-8 text-center">
        <p className="text-sm text-muted-foreground">No waitlist entries yet.</p>
        <button
          onClick={onRefresh}
          className="mt-3 text-sm text-brand hover:underline"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data.total} entr{data.total === 1 ? "y" : "ies"} on the waitlist
        </p>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="text-sm text-brand hover:underline disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.entries.map((e) => (
              <tr key={e.id} className="text-foreground">
                <td className="px-4 py-3">
                  <a href={`mailto:${e.email}`} className="text-brand hover:underline">
                    {e.email}
                  </a>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{e.source}</td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {new Date(e.created_at).toLocaleString("en-US", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

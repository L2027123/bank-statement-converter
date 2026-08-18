import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import DashboardClient from "./DashboardClient";
import { createClient } from "@/lib/supabase/server";
import {
  getEffectiveCredits,
  getPlanLimit,
  nextResetDate,
  type Profile,
} from "@/lib/credits";

interface StatementRow {
  id: string;
  filename: string;
  status: string;
  excel_url: string | null;
  created_at: string;
}

const DEMO_HISTORY: StatementRow[] = [
  {
    id: "demo-1",
    filename: "chase-statement-jan.pdf",
    status: "completed",
    excel_url: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "demo-2",
    filename: "wells-february-statement.pdf",
    status: "completed",
    excel_url: null,
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "demo-3",
    filename: "bank-of-america.pdf",
    status: "processing",
    excel_url: null,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const isDemo = cookieStore.get("demo_mode")?.value === "true";

  if (isDemo) {
    return (
      <DashboardClient
        plan="free"
        remaining={999}
        limit={999}
        used={0}
        history={DEMO_HISTORY}
        isDemo={true}
      />
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  let { data: profile } = await supabase
    .from("users")
    .select("plan, credits_remaining, credits_reset_date")
    .eq("id", user.id)
    .single();

  const eff = getEffectiveCredits(profile as Profile | null);

  if (eff.resetNeeded) {
    const limit = getPlanLimit(eff.plan);
    await supabase
      .from("users")
      .update({
        credits_remaining: limit,
        credits_reset_date: nextResetDate(),
      })
      .eq("id", user.id);
  }

  if (!profile) {
    await supabase.from("users").insert({
      id: user.id,
      plan: "free",
      credits_remaining: getPlanLimit("free"),
      credits_reset_date: nextResetDate(),
    });
  }

  const used = eff.limit - eff.remaining;

  const { data: statements } = await supabase
    .from("statements")
    .select("id, filename, status, excel_url, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const history = (statements ?? []) as StatementRow[];

  return (
    <DashboardClient
      plan={eff.plan}
      remaining={eff.remaining}
      limit={eff.limit}
      used={used}
      history={history}
      isDemo={false}
    />
  );
}
export const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  pro: 50,
  business: 200,
};

export interface Profile {
  plan: string;
  credits_remaining: number;
  credits_reset_date: string | null;
}

export function getPlanLimit(plan: string) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
}

/**
 * Returns the effective credits for a profile, resetting to the plan limit
 * when the monthly cycle date has passed.
 */
export function getEffectiveCredits(profile: Profile | null) {
  const plan = profile?.plan ?? "free";
  const limit = getPlanLimit(plan);
  if (!profile) {
    return { plan, remaining: limit, limit, resetNeeded: true };
  }
  const today = new Date().toISOString().slice(0, 10);
  if (profile.credits_reset_date && profile.credits_reset_date < today) {
    return { plan, remaining: limit, limit, resetNeeded: true };
  }
  return {
    plan,
    remaining: profile.credits_remaining ?? limit,
    limit,
    resetNeeded: false,
  };
}

/** Next monthly reset date as YYYY-MM-DD. */
export function nextResetDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

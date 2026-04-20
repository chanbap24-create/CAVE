import { serviceClient } from "./supabase.ts";

export interface RateLimitOptions {
  /** Table to count rows in. Must have `user_id` and `created_at` columns. */
  table: string;
  /** User whose rows to count. */
  userId: string;
  /** Rolling window size in minutes. */
  windowMinutes: number;
  /** Max rows allowed within the window before the caller should be rejected. */
  max: number;
  /** Name/label for log lines (e.g. "mux-upload", "wine-vision"). */
  label: string;
}

/**
 * Generic per-user, rolling-window rate limiter backed by a Postgres table.
 *
 * Returns true when the caller has reached or exceeded `max` rows in the last
 * `windowMinutes`. Fail-open on DB error — we'd rather accept an extra call
 * than drop a legitimate one when the counter is unreachable.
 */
export async function isRateLimited(opts: RateLimitOptions): Promise<boolean> {
  const since = new Date(Date.now() - opts.windowMinutes * 60 * 1000).toISOString();

  const { count, error } = await serviceClient()
    .from(opts.table)
    .select("*", { count: "exact", head: true })
    .eq("user_id", opts.userId)
    .gte("created_at", since);

  if (error) {
    console.error(`[${opts.label}] rate limit check failed:`, error.message);
    return false;
  }
  return (count ?? 0) >= opts.max;
}

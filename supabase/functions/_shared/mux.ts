import { serviceClient } from "./supabase.ts";

// ---------- Mux API credentials / tuning ----------
export const MUX_TOKEN_ID = Deno.env.get("MUX_TOKEN_ID")!;
export const MUX_TOKEN_SECRET = Deno.env.get("MUX_TOKEN_SECRET")!;
export const MUX_CORS_ORIGIN = Deno.env.get("MUX_CORS_ORIGIN") ?? "*";

// Signed playback (lazy — playback-token function only)
export const MUX_SIGNING_KEY_ID = Deno.env.get("MUX_SIGNING_KEY_ID");
export const MUX_SIGNING_PRIVATE_KEY = Deno.env.get("MUX_SIGNING_PRIVATE_KEY");

// Rate limit for mux-upload: per-user rolling window.
export const RATE_LIMIT_MAX = 10;
export const RATE_LIMIT_WINDOW_MINUTES = 60;

// Playback token lifetime. Short enough that a leak has limited blast radius;
// long enough to cover a typical viewing session without refresh.
export const PLAYBACK_TOKEN_TTL_SECONDS = 60 * 60 * 2;

// ---------- Helpers ----------
export function muxBasicAuthHeader(): string {
  return `Basic ${btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`)}`;
}

/**
 * Returns true when the user has exceeded the upload rate limit.
 * Fail-open: on DB error, allow the upload (availability over strictness)
 * but log for observability.
 */
export async function isUploadRateLimited(userId: string): Promise<boolean> {
  const since = new Date(
    Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  ).toISOString();

  const { count, error } = await serviceClient()
    .from("mux_uploads")
    .select("upload_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);

  if (error) {
    console.error("[mux] rate limit check failed:", error.message);
    return false;
  }
  return (count ?? 0) >= RATE_LIMIT_MAX;
}

// Decode MUX_SIGNING_PRIVATE_KEY which may be stored as raw PEM or base64-
// encoded PEM (some deploy flows paste either).
export function decodeSigningPem(raw: string): string {
  if (raw.includes("BEGIN PRIVATE KEY")) return raw;
  try {
    return atob(raw);
  } catch {
    return raw;
  }
}

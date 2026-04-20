import { isRateLimited } from "./rateLimit.ts";

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

export function isUploadRateLimited(userId: string): Promise<boolean> {
  return isRateLimited({
    table: "mux_uploads",
    userId,
    windowMinutes: RATE_LIMIT_WINDOW_MINUTES,
    max: RATE_LIMIT_MAX,
    label: "mux-upload",
  });
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

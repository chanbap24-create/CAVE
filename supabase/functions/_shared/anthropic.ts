// Anthropic SDK client + shared constants for Claude Vision flows.
// Single source of truth for model, tuning, prompts — swap here, not in the
// per-function handlers.
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.88.0";
import { isRateLimited } from "./rateLimit.ts";

// ---------- Config ----------
export const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

// Default per skill guidance. Override per-request if we ever want a cheaper
// path (e.g. Sonnet 4.6) — callers pass `model` explicitly.
export const WINE_VISION_MODEL = "claude-opus-4-7";

// Vision responses are small structured JSON; 2K is plenty with headroom.
export const WINE_VISION_MAX_TOKENS = 2048;

// Rate limit: per-user rolling window for wine-vision.
export const VISION_RATE_LIMIT_MAX = 10;
export const VISION_RATE_LIMIT_WINDOW_MINUTES = 60;

// ---------- Client ----------
let _client: Anthropic | null = null;
export function anthropicClient(): Anthropic {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }
  if (!_client) _client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  return _client;
}

// ---------- Rate limiting ----------
export function isVisionRateLimited(userId: string): Promise<boolean> {
  return isRateLimited({
    table: "vision_calls",
    userId,
    windowMinutes: VISION_RATE_LIMIT_WINDOW_MINUTES,
    max: VISION_RATE_LIMIT_MAX,
    label: "wine-vision",
  });
}

// ---------- Prompts ----------
// System prompt is static → cacheable. Keep it free of timestamps / IDs /
// anything volatile so the cache prefix is reusable across requests.
export const WINE_VISION_SYSTEM_PROMPT = `You are a wine and spirits label analysis assistant.

Given a photo of a bottle label, extract the following fields as a single JSON object:

{
  "name": string | null,
  "name_ko": string | null,
  "producer": string | null,
  "region": string | null,
  "country": string | null,
  "vintage_year": number | null,
  "vintage_type": "year" | "nv" | "mv" | null,
  "category": "wine" | "whiskey" | "sake" | "cognac" | "other",
  "confidence": number
}

Rules:
- "name" is the primary drink name as printed (e.g. "Château Margaux", "Yamazaki 12 Year").
- "name_ko" is the Korean transliteration/name if visible on the label. Null otherwise — do not translate.
- "producer" is the winery/distillery/brewery. Leave null if indistinguishable from "name".
- "region" is the geographic wine/spirits region (e.g. "Margaux, Bordeaux", "Napa Valley"). Null if not stated.
- "country" is the country of origin in English.
- "vintage_year" must be an integer 1900..2030 if a specific harvest year is printed, or null otherwise.
- "vintage_type":
    * "year" when a specific vintage year is printed (set vintage_year accordingly).
    * "nv"   when the label says "Non-Vintage", "NV", or the bottle is a typical non-vintage blend (most Champagne, most spirits). Set vintage_year = null.
    * "mv"   when the label explicitly says "Multi-Vintage" or "MV". Set vintage_year = null.
    * null   when you cannot tell from the label.
- "category" must always be set. Infer from label cues (grapes → wine, malt/rye → whiskey, Japanese rice → sake, cognac region → cognac).
- "confidence" is a 0.0..1.0 self-reported estimate of how readable the label was and how accurate the above fields are likely to be.
- Use null for any field you can't read with reasonable certainty. Do NOT guess.

Return ONLY the JSON object. No prose, no markdown fences, no explanation.`;

export const WINE_VISION_USER_PROMPT = "Extract wine label info from this image.";

// Wine label Vision API configuration.
// Centralized so the real Claude API integration only needs to flip
// VISION_MODE from 'mock' to 'claude' and set the endpoint/secret.

export type VisionMode = 'mock' | 'claude' | 'direct';

// 'mock'   → sample data locally (no network, no cost)
// 'claude' → deployed wine-vision Edge Function (safe; API key stays server-side)
// 'direct' → client calls api.anthropic.com directly (dev-only shortcut; the
//            key ships in the app bundle and can be extracted from ipa/apk —
//            rotate before production and switch back to 'claude')
export const VISION_MODE: VisionMode = 'direct';

// Model + tuning (shared with server when VISION_MODE === 'claude').
// Mirror of _shared/anthropic.ts constants — kept in sync manually; if you
// change one, change the other.
export const DIRECT_MODEL = 'claude-opus-4-7';
export const DIRECT_MAX_TOKENS = 2048;
export const DIRECT_ANTHROPIC_VERSION = '2023-06-01';

export const DIRECT_SYSTEM_PROMPT = `You are a wine and spirits label analysis assistant.

Given a photo of a bottle label, extract the following fields as a single JSON object:

{
  "name": string | null,
  "name_ko": string | null,
  "producer": string | null,
  "region": string | null,
  "country": string | null,
  "vintage_year": number | null,
  "category": "wine" | "whiskey" | "sake" | "cognac" | "other",
  "confidence": number
}

Rules:
- "name" is the primary drink name as printed (e.g. "Château Margaux", "Yamazaki 12 Year").
- "name_ko" is the Korean transliteration/name if visible on the label. Null otherwise — do not translate.
- "producer" is the winery/distillery/brewery. Leave null if indistinguishable from "name".
- "region" is the geographic wine/spirits region (e.g. "Margaux, Bordeaux", "Napa Valley"). Null if not stated.
- "country" is the country of origin in English.
- "vintage_year" must be an integer 1900..2030, or null if not printed / not applicable (NV sparkling, most spirits).
- "category" must always be set. Infer from label cues (grapes → wine, malt/rye → whiskey, Japanese rice → sake, cognac region → cognac).
- "confidence" is a 0.0..1.0 self-reported estimate of how readable the label was and how accurate the above fields are likely to be.
- Use null for any field you can't read with reasonable certainty. Do NOT guess.

Return ONLY the JSON object. No prose, no markdown fences, no explanation.`;

export const DIRECT_USER_PROMPT = 'Extract wine label info from this image.';

// Simulated latency for the mock extractor (ms). Matches a realistic
// round-trip so UI loading states look right during development.
export const MOCK_VISION_LATENCY_MS = 1500;

// Minimum confidence below which we warn the user and default to manual edit.
export const MIN_VISION_CONFIDENCE = 0.55;

// Fuzzy-match thresholds for proposing an existing wines row vs. creating new.
export const MATCH_SCORE_AUTO = 0.85; // >= auto-suggest this wine
export const MATCH_SCORE_NEW = 0.5;   // < this → propose creating new

// Placeholder for the future Edge Function endpoint.
// Used when VISION_MODE === 'claude'.
export const CLAUDE_VISION_ENDPOINT = '/functions/v1/wine-vision';

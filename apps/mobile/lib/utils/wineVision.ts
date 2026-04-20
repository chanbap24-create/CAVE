// Wine label extraction — provider-agnostic facade.
// Switches between a mock (dev) and the Claude Vision Edge Function based on
// VISION_MODE. The Edge Function (supabase/functions/wine-vision) handles the
// Anthropic API call server-side so the client never holds the API key.
import type { ExtractedWineInfo } from '@/lib/types/wine';
import {
  DIRECT_ANTHROPIC_VERSION,
  DIRECT_MAX_TOKENS,
  DIRECT_MODEL,
  DIRECT_SYSTEM_PROMPT,
  DIRECT_USER_PROMPT,
  MOCK_VISION_LATENCY_MS,
  VISION_MODE,
} from '@/lib/constants/wineVision';
import { authHeaders, edgeFunctionUrl } from '@/lib/utils/edgeFunction';
import { fetchAsBase64 } from '@/lib/utils/imageEncoding';

export async function extractWineFromImage(imageUri: string): Promise<ExtractedWineInfo> {
  if (VISION_MODE === 'mock') return mockExtract(imageUri);
  if (VISION_MODE === 'direct') return directExtract(imageUri);
  return claudeExtract(imageUri);
}

// --- Mock ---------------------------------------------------------------
// Rotates through a small catalogue so repeat scans feel realistic during
// development. Deterministic per imageUri hash so reviews are testable.
const SAMPLES: ExtractedWineInfo[] = [
  {
    name: 'Château Margaux',
    name_ko: '샤토 마고',
    producer: 'Château Margaux',
    region: 'Margaux, Bordeaux',
    country: 'France',
    vintage_year: 2015,
    vintage_type: 'year',
    category: 'wine',
    confidence: 0.92,
  },
  {
    name: 'Opus One',
    name_ko: '오퍼스 원',
    producer: 'Opus One Winery',
    region: 'Napa Valley',
    country: 'USA',
    vintage_year: 2018,
    vintage_type: 'year',
    category: 'wine',
    confidence: 0.88,
  },
  {
    name: 'Yamazaki 12 Year',
    name_ko: '야마자키 12년',
    producer: 'Suntory',
    region: null,
    country: 'Japan',
    vintage_year: null,
    vintage_type: 'nv',
    category: 'spirit',
    confidence: 0.78,
  },
  {
    name: null,
    name_ko: null,
    producer: null,
    region: null,
    country: null,
    vintage_year: null,
    vintage_type: null,
    category: 'wine',
    confidence: 0.3,
  },
];

async function mockExtract(imageUri: string): Promise<ExtractedWineInfo> {
  await new Promise(r => setTimeout(r, MOCK_VISION_LATENCY_MS));
  let hash = 0;
  for (let i = 0; i < imageUri.length; i++) hash = (hash * 31 + imageUri.charCodeAt(i)) | 0;
  const idx = Math.abs(hash) % SAMPLES.length;
  return SAMPLES[idx];
}

// --- Direct Anthropic call (dev shortcut, key in app bundle) ------------
// Used when Supabase Edge Function path is unavailable. Production builds
// should flip VISION_MODE to 'claude' so the key stays server-side.
async function directExtract(imageUri: string): Promise<ExtractedWineInfo> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'EXPO_PUBLIC_ANTHROPIC_API_KEY not set. Add it to apps/mobile/.env and restart with `npx expo start -c`.',
    );
  }
  const { base64, mediaType } = await fetchAsBase64(imageUri);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': DIRECT_ANTHROPIC_VERSION,
      // Required when calling from browser/app-like contexts per Anthropic's
      // SDK convention. React Native's native fetch doesn't enforce CORS but
      // the API still expects this flag for non-server callers.
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: DIRECT_MODEL,
      max_tokens: DIRECT_MAX_TOKENS,
      system: DIRECT_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: DIRECT_USER_PROMPT },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await safeText(res);
    throw new Error(`Anthropic ${res.status}: ${detail}`);
  }

  const data = await res.json();
  const textBlock = data?.content?.find?.((b: any) => b?.type === 'text');
  const raw = parseJson(textBlock?.text ?? '');
  return normalize(raw);
}

function parseJson(text: string): any {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim();
  try { return JSON.parse(trimmed); } catch { return null; }
}

// --- Claude Vision (via Edge Function) ----------------------------------
async function claudeExtract(imageUri: string): Promise<ExtractedWineInfo> {
  const { base64, mediaType } = await fetchAsBase64(imageUri);

  const res = await fetch(edgeFunctionUrl('wine-vision'), {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ image_base64: base64, media_type: mediaType }),
  });

  if (!res.ok) {
    const detail = await safeText(res);
    throw new Error(`Vision request failed (${res.status}): ${detail}`);
  }

  const raw = await res.json();
  return normalize(raw);
}

// --- Helpers ------------------------------------------------------------
async function safeText(res: Response): Promise<string> {
  try { return await res.text(); } catch { return '<no body>'; }
}

// Clamps/validates the raw Claude response into our ExtractedWineInfo shape.
// Claude is instructed to return clean JSON but we don't trust the wire.
function normalize(raw: any): ExtractedWineInfo {
  const validCategories = new Set(['wine', 'spirit', 'traditional', 'other']);
  const category = validCategories.has(raw?.category) ? raw.category : 'wine';
  const confidence = typeof raw?.confidence === 'number'
    ? Math.max(0, Math.min(1, raw.confidence))
    : 0.5;
  const vintage = Number.isInteger(raw?.vintage_year) && raw.vintage_year >= 1900 && raw.vintage_year <= 2030
    ? raw.vintage_year
    : null;
  const validVintageTypes = new Set(['year', 'nv', 'mv']);
  let vintage_type: 'year' | 'nv' | 'mv' | null = validVintageTypes.has(raw?.vintage_type)
    ? raw.vintage_type
    : null;
  // Keep vintage_year and vintage_type internally consistent: if a year is
  // present treat it as 'year'; if type is nv/mv clear any stray year the
  // model might have hallucinated.
  if (vintage && vintage_type === null) vintage_type = 'year';
  const yearOut = vintage_type === 'nv' || vintage_type === 'mv' ? null : vintage;
  const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

  return {
    name: str(raw?.name),
    name_ko: str(raw?.name_ko),
    producer: str(raw?.producer),
    region: str(raw?.region),
    country: str(raw?.country),
    vintage_year: yearOut,
    vintage_type,
    category,
    confidence,
  };
}

// Wine label extraction — provider-agnostic facade.
// Switches between a mock (dev) and the Claude Vision Edge Function based on
// VISION_MODE. The Edge Function (supabase/functions/wine-vision) handles the
// Anthropic API call server-side so the client never holds the API key.
import type { ExtractedWineInfo } from '@/lib/types/wine';
import { MOCK_VISION_LATENCY_MS, VISION_MODE } from '@/lib/constants/wineVision';
import { authHeaders, edgeFunctionUrl } from '@/lib/utils/edgeFunction';

export async function extractWineFromImage(imageUri: string): Promise<ExtractedWineInfo> {
  if (VISION_MODE === 'mock') return mockExtract(imageUri);
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
    category: 'whiskey',
    confidence: 0.78,
  },
  {
    name: null,
    name_ko: null,
    producer: null,
    region: null,
    country: null,
    vintage_year: null,
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
async function fetchAsBase64(uri: string): Promise<{ base64: string; mediaType: string }> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const mediaType = normalizeMediaType(blob.type || mediaTypeFromExt(uri));
  const base64 = await blobToBase64(blob);
  return { base64, mediaType };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Strip the "data:<type>;base64," prefix; Anthropic wants raw base64.
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image'));
    reader.readAsDataURL(blob);
  });
}

function mediaTypeFromExt(uri: string): string {
  const ext = uri.split('.').pop()?.split('?')[0]?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png', webp: 'image/webp', gif: 'image/gif',
  };
  return map[ext] ?? 'image/jpeg';
}

// Anthropic only accepts jpeg/png/webp/gif. Expo's ImagePicker with editing
// produces jpeg on both platforms, so most real images land here already OK;
// anything else we coerce to jpeg (server will reject if truly wrong).
function normalizeMediaType(t: string): string {
  const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
  return allowed.has(t) ? t : 'image/jpeg';
}

async function safeText(res: Response): Promise<string> {
  try { return await res.text(); } catch { return '<no body>'; }
}

// Clamps/validates the raw Claude response into our ExtractedWineInfo shape.
// Claude is instructed to return clean JSON but we don't trust the wire.
function normalize(raw: any): ExtractedWineInfo {
  const validCategories = new Set(['wine', 'whiskey', 'sake', 'cognac', 'other']);
  const category = validCategories.has(raw?.category) ? raw.category : 'wine';
  const confidence = typeof raw?.confidence === 'number'
    ? Math.max(0, Math.min(1, raw.confidence))
    : 0.5;
  const vintage = Number.isInteger(raw?.vintage_year) && raw.vintage_year >= 1900 && raw.vintage_year <= 2030
    ? raw.vintage_year
    : null;
  const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

  return {
    name: str(raw?.name),
    name_ko: str(raw?.name_ko),
    producer: str(raw?.producer),
    region: str(raw?.region),
    country: str(raw?.country),
    vintage_year: vintage,
    category,
    confidence,
  };
}

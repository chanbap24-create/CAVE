// Wine label extraction — provider-agnostic facade.
// Switches between a mock (dev) and the future Claude Vision call based on
// VISION_MODE. The real implementation will POST the image to an Edge
// Function that invokes Anthropic's messages API with a vision-capable model.
import type { ExtractedWineInfo } from '@/lib/types/wine';
import {
  CLAUDE_VISION_ENDPOINT,
  MOCK_VISION_LATENCY_MS,
  VISION_MODE,
} from '@/lib/constants/wineVision';

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

// --- Claude (TODO: wire up to Edge Function) ----------------------------
async function claudeExtract(_imageUri: string): Promise<ExtractedWineInfo> {
  // Placeholder. Real implementation:
  //  1. Upload/convert image to base64 (or upload to Storage and pass URL).
  //  2. POST to CLAUDE_VISION_ENDPOINT with { image, schema_version }.
  //  3. Parse structured JSON per ExtractedWineInfo contract.
  //  4. Map confidence from model self-report (logprobs, or explicit 0-1 claim).
  throw new Error(`Claude Vision not implemented (endpoint: ${CLAUDE_VISION_ENDPOINT})`);
}

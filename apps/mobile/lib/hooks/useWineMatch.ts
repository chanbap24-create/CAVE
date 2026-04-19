import { supabase } from '@/lib/supabase';
import { sanitizeSearch } from '@/lib/utils/searchUtils';
import { MATCH_SCORE_AUTO, MATCH_SCORE_NEW } from '@/lib/constants/wineVision';
import type { ExtractedWineInfo, WineMatchResult, WineRow } from '@/lib/types/wine';

// Case-insensitive token overlap score (0..1). Good enough for "similar name"
// without pulling in a fuzzy-match dependency for the mobile bundle.
function similarity(a: string, b: string): number {
  const A = new Set(a.toLowerCase().split(/\s+/).filter(t => t.length > 1));
  const B = new Set(b.toLowerCase().split(/\s+/).filter(t => t.length > 1));
  if (A.size === 0 || B.size === 0) return 0;
  let hits = 0;
  A.forEach(t => { if (B.has(t)) hits++; });
  return hits / Math.max(A.size, B.size);
}

function scoreMatch(extracted: ExtractedWineInfo, row: WineRow): number {
  if (!extracted.name || !row.name) return 0;
  let score = similarity(extracted.name, row.name) * 0.7;

  if (extracted.producer && row.producer) {
    score += similarity(extracted.producer, row.producer) * 0.2;
  }
  if (extracted.vintage_year && row.vintage_year && extracted.vintage_year === row.vintage_year) {
    score += 0.1;
  }
  return Math.min(score, 1);
}

/**
 * Finds the best candidate in `wines` for the extracted label data.
 *
 * Classification:
 *   >= MATCH_SCORE_AUTO   → 'match' (confidently the same bottle)
 *   >= MATCH_SCORE_NEW    → 'match' but lower score (caller may prompt user)
 *   <  MATCH_SCORE_NEW    → 'new' (propose creating a new wines row)
 */
export async function findWineMatch(extracted: ExtractedWineInfo): Promise<WineMatchResult> {
  if (!extracted.name) return { kind: 'new' };

  const q = sanitizeSearch(extracted.name);
  if (q.length < 2) return { kind: 'new' };

  const { data } = await supabase
    .from('wines')
    .select('id, name, name_ko, producer, region, country, vintage_year, alcohol_pct, category, image_url')
    .or(`name.ilike.%${q}%,name_ko.ilike.%${q}%,producer.ilike.%${q}%`)
    .limit(10);

  if (!data || data.length === 0) return { kind: 'new' };

  let best: { row: WineRow; score: number } | null = null;
  for (const row of data as WineRow[]) {
    const s = scoreMatch(extracted, row);
    if (!best || s > best.score) best = { row, score: s };
  }

  if (best && best.score >= MATCH_SCORE_NEW) {
    return { kind: 'match', wine: best.row, score: best.score };
  }
  return { kind: 'new' };
}

export function isAutoMatch(score: number): boolean {
  return score >= MATCH_SCORE_AUTO;
}

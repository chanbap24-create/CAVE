import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface RecommendedGathering {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  location: string | null;
  gathering_date: string | null;
  host_id: string | null;
  current_members: number | null;
  max_members: number | null;
  /** 매칭 점수: 사용자 셀러의 top category 와 모임 theme_wines 카테고리가 일치하는 정도 */
  match_score: number;
  /** 매칭 이유 (UI 노출용 한 줄) */
  match_reason: string | null;
}

const MAX_RESULTS = 5;
const FUTURE_WINDOW_DAYS = 90;

/**
 * 사용자 셀러 기반 추천 모임. v1 구현:
 *  1) 사용자 컬렉션 → wines.category 빈도수 → top 1 카테고리 추출
 *  2) 미래 open 모임의 theme_wines 를 wines 테이블과 join → category 매칭
 *  3) 매칭 점수 (top category 일치 시 +1) 로 정렬, 동점은 gathering_date asc
 *  4) 매칭 부족 시 그냥 가까운 미래 모임으로 채움 (fallback)
 *
 * 추후 v2 에서 wine_type, region, host follow 신호까지 합산하도록 확장.
 */
export function useRecommendedGatherings(userId?: string) {
  const [recs, setRecs] = useState<RecommendedGathering[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRecs = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const topCategory = await fetchTopCategory(userId);
      const gatherings = await fetchFutureOpenGatherings();
      if (gatherings.length === 0) { setRecs([]); return; }

      const themeIds = Array.from(new Set(
        gatherings.flatMap(g => Array.isArray(g.theme_wines) ? g.theme_wines : []),
      ));
      const themeCategoryMap = await fetchWineCategories(themeIds);

      const scored: RecommendedGathering[] = gatherings.map(g => {
        const themes = (g.theme_wines || []) as number[];
        const cats = themes.map(id => themeCategoryMap.get(id)).filter(Boolean) as string[];
        const matchedCount = topCategory ? cats.filter(c => c === topCategory).length : 0;
        const score = matchedCount > 0 ? 1 + matchedCount * 0.1 : 0;
        const reason = matchedCount > 0 && topCategory
          ? `내 셀러의 ${labelOfCategory(topCategory)}와 어울리는 모임`
          : null;
        return {
          id: g.id, title: g.title, description: g.description,
          image_url: g.image_url, location: g.location, gathering_date: g.gathering_date,
          host_id: g.host_id, current_members: g.current_members, max_members: g.max_members,
          match_score: score, match_reason: reason,
        };
      });

      scored.sort((a, b) => {
        if (b.match_score !== a.match_score) return b.match_score - a.match_score;
        const ad = a.gathering_date ? new Date(a.gathering_date).getTime() : Infinity;
        const bd = b.gathering_date ? new Date(b.gathering_date).getTime() : Infinity;
        return ad - bd;
      });

      setRecs(scored.slice(0, MAX_RESULTS));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { recs, loading, loadRecs };
}

async function fetchTopCategory(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('collections')
    .select('wine:wines(category)')
    .eq('user_id', userId);
  if (!data) return null;
  const counts = new Map<string, number>();
  for (const row of data as unknown as { wine: { category: string } | null }[]) {
    const c = row.wine?.category;
    if (!c) continue;
    counts.set(c, (counts.get(c) || 0) + 1);
  }
  if (counts.size === 0) return null;
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

async function fetchFutureOpenGatherings() {
  const nowIso = new Date().toISOString();
  const horizon = new Date(Date.now() + FUTURE_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('gatherings')
    .select('id, title, description, image_url, location, gathering_date, host_id, current_members, max_members, theme_wines')
    .eq('status', 'open')
    .gte('gathering_date', nowIso)
    .lte('gathering_date', horizon)
    .order('gathering_date', { ascending: true })
    .limit(50);
  return data || [];
}

async function fetchWineCategories(wineIds: number[]) {
  const map = new Map<number, string>();
  if (wineIds.length === 0) return map;
  const { data } = await supabase
    .from('wines')
    .select('id, category')
    .in('id', wineIds);
  for (const w of data || []) map.set(w.id, w.category);
  return map;
}

function labelOfCategory(c: string) {
  switch (c) {
    case 'wine': return '와인';
    case 'whiskey': return '위스키';
    case 'cognac': return '코냑';
    case 'sake': return '사케';
    case 'beer': return '맥주';
    default: return '주류';
  }
}

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { normalizeTasteProfile, type TasteProfileValue } from '@/lib/constants/tasteProfile';

export interface CatalogWine {
  id: number;
  name: string;
  name_ko: string | null;
  category: string;
  producer: string | null;
  region: string | null;
  country: string | null;
  vintage_year: number | null;
  alcohol_pct: number | null;
  image_url: string | null;
}

export interface WineAggregate {
  /** 평균 별점 (0.5 단위 보다 정밀할 수 있음 — 1자리). null = 데이터 없음. */
  rating: number | null;
  rating_count: number;
  /** 평균 taste profile (numeric, 1자리). 입력자 0이면 모두 null. */
  profile: TasteProfileValue;
  profile_count: number;
  /** 빈도 상위 5개 향 태그. */
  top_tags: { key: string; count: number }[];
}

export interface TopComment {
  id: number;
  body: string;
  like_count: number;
  created_at: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export interface WineCatalogData {
  wine: CatalogWine | null;
  aggregate: WineAggregate;
  topComments: TopComment[];
}

const EMPTY_AGGREGATE: WineAggregate = {
  rating: null, rating_count: 0,
  profile: { body: null, sweet: null, acid: null, tags: [] },
  profile_count: 0,
  top_tags: [],
};

/**
 * 와인 카탈로그 페이지 데이터 — wine row + 단일 RPC 호출로 aggregate + top comments.
 *
 * 로직:
 *   1. wines select
 *   2. wine_taste_aggregate(wine_id) RPC — 평균 + 태그 + 댓글 한 번에
 */
export function useWineCatalog(wineId: number | null) {
  const [data, setData] = useState<WineCatalogData>({
    wine: null, aggregate: EMPTY_AGGREGATE, topComments: [],
  });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (wineId == null) return;
    setLoading(true);
    try {
      const [wineRes, aggRes] = await Promise.all([
        supabase
          .from('wines')
          .select('id, name, name_ko, category, producer, region, country, vintage_year, alcohol_pct, image_url')
          .eq('id', wineId)
          .maybeSingle(),
        supabase.rpc('wine_taste_aggregate', { p_wine_id: wineId }),
      ]);

      const aggRaw = (aggRes.data as any) ?? {};
      const avg = aggRaw.avg ?? {};
      const aggregate: WineAggregate = {
        rating: typeof avg.rating === 'number' ? avg.rating : null,
        rating_count: avg.rating_count ?? 0,
        profile: normalizeTasteProfile({
          body: avg.body, sweet: avg.sweet, acid: avg.acid,
          tags: (aggRaw.top_tags ?? []).map((t: any) => t.key),
        }),
        profile_count: avg.profile_count ?? 0,
        top_tags: aggRaw.top_tags ?? [],
      };

      setData({
        wine: (wineRes.data as CatalogWine | null) ?? null,
        aggregate,
        topComments: (aggRaw.top_comments ?? []) as TopComment[],
      });
    } finally {
      setLoading(false);
    }
  }, [wineId]);

  useEffect(() => { load(); }, [load]);

  return { ...data, loading, refresh: load };
}

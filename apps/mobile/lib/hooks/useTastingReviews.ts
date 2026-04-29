import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface TastingReview {
  /** collection id */
  id: number;
  tasting_note: string;
  rating: number | null;
  created_at: string;
  photo_url: string | null;
  wine: {
    id: number;
    name: string;
    producer: string | null;
    vintage_year: number | null;
    image_url: string | null;
  } | null;
  owner: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    is_partner?: boolean | null;
    partner_label?: string | null;
  } | null;
}

const FETCH_LIMIT = 30;

/**
 * 시음 후기 피드 — 셀러에 등록하면서 본인이 작성한 tasting_note 가 있는 컬렉션만.
 *
 * 데이터: collections.tasting_note 가 not null + is_public=true 인 행 최신순.
 *
 * v1: 전체 공개 후기 노출 (follow 적은 초기 사용자 콘텐츠 보장).
 * v2: follows 필터 + 좋아요/답글 + 무한 스크롤.
 */
export function useTastingReviews() {
  const [reviews, setReviews] = useState<TastingReview[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('collections')
        .select(`
          id, tasting_note, rating, created_at, photo_url, user_id,
          wine:wines(id, name, producer, vintage_year, image_url),
          owner:profiles!collections_user_id_fkey(id, username, display_name, avatar_url, is_partner, partner_label)
        `)
        .not('tasting_note', 'is', null)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(FETCH_LIMIT);

      // tasting_note 가 빈 문자열이거나 공백만인 행 제외
      const out = (data as unknown as TastingReview[] | null ?? [])
        .filter(r => r.tasting_note && r.tasting_note.trim().length > 0);
      setReviews(out);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { reviews, loading, refresh: load };
}

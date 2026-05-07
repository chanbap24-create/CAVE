import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export interface RecentDrink {
  /** collection id */
  id: number;
  tasting_note: string;
  rating: number | null;
  /** 노트가 마지막으로 갱신된 시점 — touch_collection_tasting_note 트리거가 자동 관리 */
  tasting_note_updated_at: string;
  collection_photo_url: string | null;
  wine: {
    id: number;
    name: string;
    producer: string | null;
    vintage_year: number | null;
    image_url: string | null;
  } | null;
}

const FETCH_LIMIT = 30;

/**
 * "최근 마신 와인" 피드 — 본인 셀러에서 tasting_note 가 작성된 컬렉션 최신순.
 *
 * 별도 wine_drinks 이벤트 로그 대신 collections.tasting_note + .rating +
 * .tasting_note_updated_at 을 직접 사용한다. 노트를 작성/수정하는 순간
 * 트리거가 timestamp 를 갱신해 자연스럽게 "최근" 으로 올라온다 (00040 트리거).
 *
 * 제거된 기능: 같은 와인을 여러 번 마신 이벤트별 카드. 한 컬렉션 = 한 노트
 * = 한 카드 (덮어쓰기) 로 모델 단순화.
 */
export function useRecentDrinks() {
  const { user } = useAuth();
  const [drinks, setDrinks] = useState<RecentDrink[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setDrinks([]); return; }
    setLoading(true);
    try {
      const { data } = await supabase
        .from('collections')
        .select(`
          id, tasting_note, rating, tasting_note_updated_at, photo_url,
          wine:wines(id, name, producer, vintage_year, image_url)
        `)
        .eq('user_id', user.id)
        .not('tasting_note', 'is', null)
        .order('tasting_note_updated_at', { ascending: false })
        .limit(FETCH_LIMIT);

      const out: RecentDrink[] = ((data || []) as any[])
        .filter(r => r.tasting_note && r.tasting_note.trim().length > 0)
        .map(r => ({
          id: r.id,
          tasting_note: r.tasting_note,
          rating: r.rating,
          tasting_note_updated_at: r.tasting_note_updated_at,
          collection_photo_url: r.photo_url ?? null,
          wine: r.wine ?? null,
        }));
      setDrinks(out);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  return { drinks, loading, refresh: load };
}

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export interface RecentDrink {
  id: number;
  drank_at: string;
  rating: number | null;
  note: string | null;
  collection_id: number | null;
  wine_id: number | null;
  wine: {
    id: number;
    name: string;
    producer: string | null;
    vintage_year: number | null;
    image_url: string | null;
  } | null;
  /** collection 이 살아있을 때만 채워짐 (delete set null 대응) */
  collection_photo_url: string | null;
}

const FETCH_LIMIT = 30;

/**
 * 본인이 마신 와인 이벤트 로그 (drank_at desc).
 * collection_id 가 있으면 collection의 photo_url + wine, 없으면 wine_id 직접 join.
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
        .from('wine_drinks')
        .select(`
          id, drank_at, rating, note, collection_id, wine_id,
          collection:collections(photo_url, wine:wines(id, name, producer, vintage_year, image_url)),
          direct_wine:wines!wine_drinks_wine_id_fkey(id, name, producer, vintage_year, image_url)
        `)
        .eq('user_id', user.id)
        .order('drank_at', { ascending: false })
        .limit(FETCH_LIMIT);

      const out: RecentDrink[] = ((data || []) as any[]).map(r => ({
        id: r.id,
        drank_at: r.drank_at,
        rating: r.rating,
        note: r.note,
        collection_id: r.collection_id,
        wine_id: r.wine_id,
        wine: r.collection?.wine || r.direct_wine || null,
        collection_photo_url: r.collection?.photo_url || null,
      }));
      setDrinks(out);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  return { drinks, loading, refresh: load };
}

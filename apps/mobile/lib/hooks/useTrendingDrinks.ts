import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface TrendingDrink {
  wine_id: number;
  name: string;
  name_ko: string | null;
  category: string;
  country: string | null;
  region: string | null;
  add_count: number;
}

export function useTrendingDrinks() {
  const [drinks, setDrinks] = useState<TrendingDrink[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTrending = useCallback(async () => {
    setLoading(true);

    // Get collections from last 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: recent } = await supabase
      .from('collections')
      .select('wine_id')
      .gte('created_at', weekAgo);

    if (!recent || recent.length === 0) {
      // Fallback: all-time popular
      const { data: allTime } = await supabase
        .from('collections')
        .select('wine_id');
      if (!allTime) { setLoading(false); return; }
      await buildTrending(allTime);
    } else {
      await buildTrending(recent);
    }

    setLoading(false);
  }, []);

  async function buildTrending(collections: { wine_id: number }[]) {
    // Count by wine_id
    const counts: Record<number, number> = {};
    collections.forEach(c => { counts[c.wine_id] = (counts[c.wine_id] || 0) + 1; });

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (sorted.length === 0) return;

    const ids = sorted.map(([id]) => parseInt(id));
    const { data: wines } = await supabase
      .from('wines')
      .select('id, name, name_ko, category, country, region')
      .in('id', ids);

    if (!wines) return;

    const wineMap = new Map(wines.map(w => [w.id, w]));
    const trending: TrendingDrink[] = sorted
      .map(([id, count]) => {
        const w = wineMap.get(parseInt(id));
        if (!w) return null;
        return {
          wine_id: w.id,
          name: w.name,
          name_ko: w.name_ko,
          category: w.category,
          country: w.country,
          region: w.region,
          add_count: count,
        };
      })
      .filter(Boolean) as TrendingDrink[];

    setDrinks(trending);
  }

  return { drinks, loading, loadTrending };
}

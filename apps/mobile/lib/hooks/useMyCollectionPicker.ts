import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export interface MyCollectionItem {
  id: number;                 // collections.id
  photo_url: string | null;
  wine: {
    id: number;
    name: string;
    name_ko: string | null;
    category: string;
    region: string | null;
    country: string | null;
    vintage_year: number | null;
    image_url: string | null;
  } | null;
}

/**
 * Lists the current user's cellar entries for wine-picker UIs (gathering
 * contribution, host slot, change request). Callers can optionally exclude
 * specific collection IDs — used when a picker shouldn't re-offer bottles
 * already committed to the same gathering.
 */
export function useMyCollectionPicker(excludeIds: number[] = []) {
  const { user } = useAuth();
  const [items, setItems] = useState<MyCollectionItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('collections')
      .select('id, photo_url, wine:wines(id, name, name_ko, category, region, country, vintage_year, image_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[useMyCollectionPicker]', error.message);
      setItems([]);
    } else {
      const filtered = excludeIds.length > 0
        ? (data ?? []).filter(c => !excludeIds.includes(c.id))
        : (data ?? []);
      setItems(filtered as any);
    }
    setLoading(false);
    // exclude list is intentionally stringified so we refetch when it
    // actually changes, not just when the parent re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, excludeIds.join(',')]);

  useEffect(() => { load(); }, [load]);

  return { items, loading, refresh: load };
}

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface WineSeller {
  id: number;
  partner_id: string;
  price: number;
  partner: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    partner_label: string | null;
  } | null;
}

/**
 * 카탈로그 페이지용 — 특정 와인을 판매 중(available=true)인 파트너 리스트.
 * 가격 오름차순.
 */
export function usePartnerSellersForWine(wineId: number | null) {
  const [sellers, setSellers] = useState<WineSeller[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (wineId == null) { setSellers([]); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('partner_wine_menu')
        .select(`
          id, partner_id, price,
          partner:profiles!partner_wine_menu_partner_id_fkey(id, username, display_name, avatar_url, partner_label)
        `)
        .eq('wine_id', wineId)
        .eq('available', true)
        .order('price', { ascending: true });
      if (error) console.error('[usePartnerSellersForWine]', error.message);
      setSellers((data ?? []) as unknown as WineSeller[]);
    } finally {
      setLoading(false);
    }
  }, [wineId]);

  useEffect(() => { load(); }, [load]);

  return { sellers, loading, refresh: load };
}

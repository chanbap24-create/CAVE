import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface PartnerSale {
  id: number;
  wine_id: number;
  price: number;
  original_price: number | null;
  note: string | null;
  stock: number | null;
  vintage_year: number | null;  // override
  photo_url: string | null;     // override
  created_at: string;
  wine: {
    id: number;
    name: string;
    name_ko: string | null;
    producer: string | null;
    region: string | null;
    country: string | null;
    vintage_year: number | null;
    image_url: string | null;
  } | null;
  partner: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    partner_label: string | null;
  } | null;
}

const FETCH_LIMIT = 30;

/**
 * 모든 파트너의 판매 중(available=true) 와인 — 검색 탭 기본 화면에 노출.
 * 최근 등록순. 같은 와인이라도 파트너별로 별도 row.
 */
export function useAllPartnerSales() {
  const [sales, setSales] = useState<PartnerSale[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('partner_wine_menu')
        .select(`
          id, wine_id, price, original_price, note, stock, vintage_year, photo_url, created_at,
          wine:wines(id, name, name_ko, producer, region, country, vintage_year, image_url),
          partner:profiles!partner_wine_menu_partner_id_fkey(id, username, display_name, avatar_url, partner_label)
        `)
        .eq('available', true)
        .order('created_at', { ascending: false })
        .limit(FETCH_LIMIT);
      if (error) console.error('[useAllPartnerSales]', error.message);
      setSales((data ?? []) as unknown as PartnerSale[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { sales, loading, refresh: load };
}

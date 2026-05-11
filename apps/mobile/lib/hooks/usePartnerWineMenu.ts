import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export interface PartnerMenuItem {
  id: number;
  wine_id: number;
  price: number;
  available: boolean;
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
}

/**
 * 본인(파트너) 의 판매 와인 메뉴 — list + add/update/remove.
 *
 * 파트너 자격 검증은 INSERT RLS 가 처리 (profiles.is_partner). 이 hook 자체는
 * 권한 체크 안 함 — 호출자(검색 탭의 "내 메뉴" 모드) 가 useIsPartner 로 진입
 * 통제.
 */
export function usePartnerWineMenu() {
  const { user } = useAuth();
  const [items, setItems] = useState<PartnerMenuItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('partner_wine_menu')
        .select(`
          id, wine_id, price, available,
          wine:wines(id, name, name_ko, producer, region, country, vintage_year, image_url)
        `)
        .eq('partner_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) console.error('[usePartnerWineMenu]', error.message);
      setItems((data ?? []) as unknown as PartnerMenuItem[]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  async function add(wineId: number, price: number): Promise<boolean> {
    if (!user) return false;
    if (price < 0) { Alert.alert('가격 오류', '가격은 0 이상이어야 합니다.'); return false; }
    const { error } = await supabase
      .from('partner_wine_menu')
      .insert({ partner_id: user.id, wine_id: wineId, price, available: true });
    if (error) {
      Alert.alert(
        '등록 실패',
        error.code === '23505'
          ? '이미 등록된 와인입니다.'
          : error.message,
      );
      return false;
    }
    await load();
    return true;
  }

  async function update(id: number, patch: { price?: number; available?: boolean }): Promise<boolean> {
    if (!user) return false;
    const { error } = await supabase
      .from('partner_wine_menu')
      .update(patch)
      .eq('id', id)
      .eq('partner_id', user.id);
    if (error) { Alert.alert('수정 실패', error.message); return false; }
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
    return true;
  }

  async function remove(id: number): Promise<boolean> {
    if (!user) return false;
    const { error } = await supabase
      .from('partner_wine_menu')
      .delete()
      .eq('id', id)
      .eq('partner_id', user.id);
    if (error) { Alert.alert('삭제 실패', error.message); return false; }
    setItems(prev => prev.filter(i => i.id !== id));
    return true;
  }

  return { items, loading, refresh: load, add, update, remove };
}

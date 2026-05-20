import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export interface PartnerMenuItem {
  id: number;
  wine_id: number;
  price: number;
  available: boolean;
  // 상세 등록 필드 (2026-05-18 추가, 모두 nullable)
  original_price: number | null;
  note: string | null;
  stock: number | null;
  vintage_year: number | null;
  photo_url: string | null;
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

/** 등록/수정 입력 — id 와 partner_id 제외 모든 필드 */
export interface PartnerMenuInput {
  wine_id: number;
  price: number;
  original_price?: number | null;
  note?: string | null;
  stock?: number | null;
  vintage_year?: number | null;
  photo_url?: string | null;
  available?: boolean;
}

const SELECT_COLS = `
  id, wine_id, price, available,
  original_price, note, stock, vintage_year, photo_url,
  wine:wines(id, name, name_ko, producer, region, country, vintage_year, image_url)
`;

/**
 * 본인(파트너) 의 판매 와인 메뉴 — list + add/update/remove.
 *
 * 파트너 자격 검증은 INSERT RLS 가 처리. hook 은 권한 체크 안 함 — 호출자가
 * useIsPartner 로 진입 통제.
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
        .select(SELECT_COLS)
        .eq('partner_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) console.error('[usePartnerWineMenu]', error.message);
      setItems((data ?? []) as unknown as PartnerMenuItem[]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  async function add(input: PartnerMenuInput): Promise<boolean> {
    if (!user) return false;
    if (input.price < 0) { Alert.alert('가격 오류', '가격은 0 이상이어야 합니다.'); return false; }
    if (input.original_price != null && input.original_price < input.price) {
      Alert.alert('정가 오류', '정가는 판매가보다 커야 합니다.'); return false;
    }
    if (input.stock != null && input.stock < 0) {
      Alert.alert('재고 오류', '재고는 0 이상이어야 합니다.'); return false;
    }
    const { error } = await supabase
      .from('partner_wine_menu')
      .insert({ partner_id: user.id, available: true, ...input });
    if (error) {
      Alert.alert(
        '등록 실패',
        error.code === '23505' ? '이미 등록된 와인입니다.' : error.message,
      );
      return false;
    }
    await load();
    return true;
  }

  async function update(id: number, patch: Partial<PartnerMenuInput>): Promise<boolean> {
    if (!user) return false;
    const { error } = await supabase
      .from('partner_wine_menu')
      .update(patch)
      .eq('id', id)
      .eq('partner_id', user.id);
    if (error) { Alert.alert('수정 실패', error.message); return false; }
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } as PartnerMenuItem : i));
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

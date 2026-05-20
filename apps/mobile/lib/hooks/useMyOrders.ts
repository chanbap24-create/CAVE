import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export type OrderStatus = 'pending' | 'confirmed' | 'picked_up' | 'cancelled';

export interface MyOrder {
  id: number;
  wine_menu_id: number;
  wine_id: number;
  partner_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: OrderStatus;
  customer_note: string | null;
  partner_note: string | null;
  created_at: string;
  updated_at: string;
  wine: {
    id: number;
    name: string;
    image_url: string | null;
    vintage_year: number | null;
  } | null;
  partner: {
    id: string;
    username: string | null;
    display_name: string | null;
    partner_label: string | null;
  } | null;
}

const SELECT_COLS = `
  id, wine_menu_id, wine_id, partner_id,
  quantity, unit_price, total_price, status,
  customer_note, partner_note, created_at, updated_at,
  wine:wines(id, name, image_url, vintage_year),
  partner:profiles!orders_partner_id_fkey(id, username, display_name, partner_label)
`;

/** customer view — 본인이 주문한 내역. */
export function useMyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setOrders([]); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(SELECT_COLS)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
      if (error) console.error('[useMyOrders]', error.message);
      setOrders((data ?? []) as unknown as MyOrder[]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  async function cancel(id: number): Promise<boolean> {
    if (!user) return false;
    // 픽업 전 (pending or confirmed) 까지만 취소 가능. picked_up 면 거부.
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('customer_id', user.id)
      .in('status', ['pending', 'confirmed']);
    if (error) { Alert.alert('취소 실패', error.message); return false; }
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelled' as const } : o));
    return true;
  }

  return { orders, loading, refresh: load, cancel };
}

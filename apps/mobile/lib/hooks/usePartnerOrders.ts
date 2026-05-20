import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { OrderStatus } from './useMyOrders';

export type { OrderStatus };

export interface PartnerOrder {
  id: number;
  wine_menu_id: number;
  wine_id: number;
  customer_id: string;
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
  customer: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

const SELECT_COLS = `
  id, wine_menu_id, wine_id, customer_id,
  quantity, unit_price, total_price, status,
  customer_note, partner_note, created_at, updated_at,
  wine:wines(id, name, image_url, vintage_year),
  customer:profiles!orders_customer_id_fkey(id, username, display_name, avatar_url)
`;

/** partner view — 본인이 받은 주문. */
export function usePartnerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<PartnerOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setOrders([]); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(SELECT_COLS)
        .eq('partner_id', user.id)
        // pending 위로, 같은 status 안에선 최신순
        .order('status', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) console.error('[usePartnerOrders]', error.message);
      setOrders((data ?? []) as unknown as PartnerOrder[]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: number, status: OrderStatus, partnerNote?: string): Promise<boolean> {
    if (!user) return false;
    const patch: Record<string, unknown> = { status };
    if (partnerNote !== undefined) patch.partner_note = partnerNote;
    const { error } = await supabase
      .from('orders')
      .update(patch)
      .eq('id', id)
      .eq('partner_id', user.id);
    if (error) { Alert.alert('업데이트 실패', error.message); return false; }
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...patch } as PartnerOrder : o));
    return true;
  }

  return { orders, loading, refresh: load, updateStatus };
}

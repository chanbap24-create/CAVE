import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export interface Notification {
  id: number;
  type: string;
  title: string | null;
  body: string | null;
  reference_id: string | null;
  reference_type: string | null;
  actor_id: string | null;
  is_read: boolean;
  created_at: string;
  actor?: { username: string; display_name: string | null };
}

// 30초 디바운스 — focus 마다 매번 fetch 던 게 누적 346K seq_scan / 21s 였음.
// 캐시 무효화는 markAllRead 시점 + force 인자.
const CACHE_MS = 30_000;

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const lastFullLoadRef = useRef(0);
  const lastCountLoadRef = useRef(0);

  const loadNotifications = useCallback(async (force = false) => {
    if (!user) return;
    if (!force && Date.now() - lastFullLoadRef.current < CACHE_MS) return;
    lastFullLoadRef.current = Date.now();
    setLoading(true);

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!data) { setLoading(false); return; }

    const actorIds = [...new Set(data.map(n => n.actor_id).filter(Boolean))];
    let actorMap = new Map();
    if (actorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', actorIds);
      actorMap = new Map(profiles?.map(p => [p.id, p]) || []);
    }

    const enriched = data.map(n => ({
      ...n,
      actor: n.actor_id ? actorMap.get(n.actor_id) : undefined,
    }));

    setNotifications(enriched);
    setUnreadCount(enriched.filter(n => !n.is_read).length);
    setLoading(false);
  }, [user]);

  const loadUnreadCount = useCallback(async (force = false) => {
    if (!user) return;
    if (!force && Date.now() - lastCountLoadRef.current < CACHE_MS) return;
    lastCountLoadRef.current = Date.now();
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    setUnreadCount(count || 0);
  }, [user]);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    // 캐시 무효화 — 다음 focus 시 fresh fetch
    lastFullLoadRef.current = 0;
    lastCountLoadRef.current = 0;
  }, [user]);

  return { notifications, unreadCount, loading, loadNotifications, loadUnreadCount, markAllRead };
}

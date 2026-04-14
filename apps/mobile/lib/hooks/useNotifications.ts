import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export interface Notification {
  id: number;
  type: string;
  title: string | null;
  body: string | null;
  reference_id: string | null;
  reference_type: string | null;
  is_read: boolean;
  created_at: string;
  actor?: { username: string; display_name: string | null };
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!data) { setLoading(false); return; }

    // Get actor profiles
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

  const loadUnreadCount = useCallback(async () => {
    if (!user) return;
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
  }, [user]);

  return { notifications, unreadCount, loading, loadNotifications, loadUnreadCount, markAllRead };
}

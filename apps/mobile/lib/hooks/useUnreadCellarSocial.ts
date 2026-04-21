import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

/**
 * Cellar tab unread indicator.
 *
 * Returns true when the user has unread `collection_like` /
 * `collection_comment` notifications (others engaging with their wines).
 * The notifications screen already flips `is_read = true` for all rows
 * on open, so the dot clears naturally after the user reviews activity.
 */
export function useUnreadCellarSocial() {
  const { user } = useAuth();
  const [hasUnread, setHasUnread] = useState(false);

  const checkUnread = useCallback(async () => {
    if (!user) { setHasUnread(false); return; }
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .in('type', ['collection_like', 'collection_comment']);
    setHasUnread((count ?? 0) > 0);
  }, [user]);

  return { hasUnread, checkUnread };
}

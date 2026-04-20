import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export interface CellarActivityItem {
  id: number; // collections.id
  photo_url: string | null;
  created_at: string;
  user_id: string;
  wine: {
    id: number;
    name: string;
    category: string;
    region: string | null;
    image_url: string | null;
  } | null;
  owner: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

// Look-back window — short enough that the strip feels "fresh" on each visit,
// long enough to have content even for users who check in daily.
const WINDOW_HOURS = 48;
const LIMIT = 20;

/**
 * Recent public cellar additions from people the current user follows.
 *
 * Feeds a horizontal strip on the home screen so collecting activity is
 * visible without the main feed getting flooded with a post per bottle.
 * Falls back to the user's own recent additions when the follow list is
 * still empty — keeps the strip populated on new accounts so the feature
 * is discoverable instead of mysteriously blank.
 */
export function useCellarActivity() {
  const { user } = useAuth();
  const [items, setItems] = useState<CellarActivityItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);

    const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString();

    // Who do I follow?
    const { data: following } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);
    const ids = (following ?? []).map(f => f.following_id);

    // Fall back to self so the strip isn't empty for brand-new users.
    const targetIds = ids.length > 0 ? ids : [user.id];

    const { data, error } = await supabase
      .from('collections')
      .select(`
        id, photo_url, created_at, user_id,
        wine:wines(id, name, category, region, image_url),
        owner:profiles!collections_user_id_fkey(username, display_name, avatar_url)
      `)
      .in('user_id', targetIds)
      .eq('is_public', true)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(LIMIT);

    if (error) {
      console.error('[useCellarActivity]', error.message);
      setItems([]);
    } else {
      setItems((data ?? []) as any);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  return { items, loading, refresh: load };
}

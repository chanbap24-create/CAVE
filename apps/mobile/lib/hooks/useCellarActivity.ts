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
    producer: string | null;
    category: string;
    region: string | null;
    country: string | null;
    vintage_year: number | null;
    image_url: string | null;
  } | null;
  owner: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

// Look-back window — advertised as "recent" so kept tight at 24h.
// Additions older than this drop off regardless of how many other people
// added wines since.
const WINDOW_HOURS = 24;
// Fetch headroom so the client-side "latest per user" grouping still has
// enough rows to cover each follow with at least a few entries to swipe.
const FETCH_LIMIT = 100;

export interface CellarActivityGroup {
  user_id: string;
  owner: CellarActivityItem['owner'];
  /** Most recent entry — used as the strip card preview. */
  latest: CellarActivityItem;
  /** All of this user's entries within the window, newest first.
   *  `entries[0] === latest`; swipe in the detail sheet walks through these. */
  entries: CellarActivityItem[];
}

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
  const [groups, setGroups] = useState<CellarActivityGroup[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setGroups([]); return; }
    setLoading(true);

    const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString();

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
        wine:wines(id, name, producer, category, region, country, vintage_year, image_url),
        owner:profiles!collections_user_id_fkey(username, display_name, avatar_url)
      `)
      .in('user_id', targetIds)
      .eq('is_public', true)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(FETCH_LIMIT);

    if (error) {
      console.error('[useCellarActivity]', error.message);
      setGroups([]);
      setLoading(false);
      return;
    }

    // Group by user. DB ordered newest-first already, so the first row we
    // see per user is their latest addition.
    const byUser = new Map<string, CellarActivityGroup>();
    const rows = (data ?? []) as unknown as CellarActivityItem[];
    for (const row of rows) {
      const existing = byUser.get(row.user_id);
      if (existing) {
        existing.entries.push(row);
      } else {
        byUser.set(row.user_id, {
          user_id: row.user_id,
          owner: row.owner,
          latest: row,
          entries: [row],
        });
      }
    }

    // Preserve the newest-first card ordering using each group's latest row.
    const ordered = Array.from(byUser.values()).sort(
      (a, b) => b.latest.created_at.localeCompare(a.latest.created_at),
    );
    setGroups(ordered);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  return { groups, loading, refresh: load };
}

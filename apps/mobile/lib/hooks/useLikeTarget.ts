import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export interface LikeTableConfig {
  /** Table name, e.g. 'collection_likes' / 'cellar_likes'. */
  table: string;
  /** Column that holds the like target id, e.g. 'collection_id' / 'owner_id'. */
  targetColumn: string;
}

/**
 * Generic like-toggle backed by a `(target, user)` composite-key table.
 *
 * Shared by useCollectionLike (per-bottle) and useCellarLike (per-owner) —
 * both tables have the same shape and differ only in table/column names.
 * Encapsulates the count fetch, the "did I like it?" fetch, and optimistic
 * toggle with rollback on error.
 */
export function useLikeTarget(config: LikeTableConfig, targetId: string | number | null) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (targetId == null) {
      setCount(0); setLiked(false);
      return;
    }
    const [countRes, mineRes] = await Promise.all([
      supabase
        .from(config.table)
        .select('*', { count: 'exact', head: true })
        .eq(config.targetColumn, targetId as any),
      user
        ? supabase
            .from(config.table)
            .select(config.targetColumn)
            .eq(config.targetColumn, targetId as any)
            .eq('user_id', user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    setCount(countRes.count ?? 0);
    setLiked(!!(mineRes as any).data);
  }, [config.table, config.targetColumn, targetId, user?.id]);

  useEffect(() => { load(); }, [load]);

  async function toggle() {
    if (!user || targetId == null || busy) return;
    setBusy(true);
    const wasLiked = liked;
    // Optimistic update so taps feel instant.
    setLiked(!wasLiked);
    setCount(c => c + (wasLiked ? -1 : 1));

    const q = supabase.from(config.table);
    const { error } = wasLiked
      ? await q.delete().eq(config.targetColumn, targetId as any).eq('user_id', user.id)
      : await q.insert({ [config.targetColumn]: targetId, user_id: user.id } as any);

    if (error) {
      console.error(`[useLikeTarget:${config.table}]`, error.message);
      // Roll back optimistic update.
      setLiked(wasLiked);
      setCount(c => c + (wasLiked ? 1 : -1));
      // Surface actionable messages so the user can fix the underlying issue
      // (most commonly: migration 00022 hasn't been applied yet).
      const msg = error.message.toLowerCase();
      if (msg.includes('does not exist') || msg.includes('relation')) {
        Alert.alert(
          'Setup needed',
          'Cellar social tables are missing. Apply migration 00022_cellar_social.sql in your Supabase dashboard.',
        );
      } else if (msg.includes('check constraint')) {
        Alert.alert("Can't like your own cellar", 'The ♥ on your own cave is disabled by design.');
      } else {
        Alert.alert('Failed', error.message);
      }
    }
    setBusy(false);
  }

  return { count, liked, busy, toggle, refresh: load };
}

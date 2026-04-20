import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { tooFast } from '@/lib/utils/clientRateLimit';

interface Counts {
  likes: number;
  comments: number;
  liked: boolean;
}

export interface CollectionSocial {
  get(collectionId: number): Counts;
  toggleLike(collectionId: number): Promise<void>;
  refresh(): void;
}

const EMPTY: Counts = { likes: 0, comments: 0, liked: false };

/**
 * Batched social stats for a list of collection rows.
 *
 * Replaces per-row useCollectionLike + useCollectionComments calls which
 * fan out to ~4 queries per row. This hook makes exactly 3 queries total
 * regardless of list size:
 *   1. likes counts grouped by collection_id
 *   2. current user's likes (to know which hearts are filled)
 *   3. comments counts grouped by collection_id
 *
 * Returns a map accessor + an optimistic toggle. Comments list still
 * loads on-demand from CommentsSheet (useCollectionComments) — only the
 * count is batched here.
 */
export function useCollectionSocial(collectionIds: number[]): CollectionSocial {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Map<number, Counts>>(new Map());

  // Stable key so we don't refetch on every render if ids reference-change
  // but contents are the same. Parent passes a memoized array when possible.
  const key = collectionIds.join(',');

  const load = useCallback(async () => {
    if (collectionIds.length === 0) { setCounts(new Map()); return; }

    const [likesRes, myLikesRes, commentsRes] = await Promise.all([
      supabase
        .from('collection_likes')
        .select('collection_id')
        .in('collection_id', collectionIds),
      user
        ? supabase
            .from('collection_likes')
            .select('collection_id')
            .in('collection_id', collectionIds)
            .eq('user_id', user.id)
        : Promise.resolve({ data: [] }),
      supabase
        .from('collection_comments')
        .select('collection_id')
        .in('collection_id', collectionIds),
    ]);

    const likeCounts = new Map<number, number>();
    (likesRes.data ?? []).forEach((r: any) => {
      likeCounts.set(r.collection_id, (likeCounts.get(r.collection_id) ?? 0) + 1);
    });
    const myLiked = new Set<number>((myLikesRes as any).data?.map((r: any) => r.collection_id) ?? []);
    const commentCounts = new Map<number, number>();
    (commentsRes.data ?? []).forEach((r: any) => {
      commentCounts.set(r.collection_id, (commentCounts.get(r.collection_id) ?? 0) + 1);
    });

    const next = new Map<number, Counts>();
    collectionIds.forEach(id => {
      next.set(id, {
        likes: likeCounts.get(id) ?? 0,
        comments: commentCounts.get(id) ?? 0,
        liked: myLiked.has(id),
      });
    });
    setCounts(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, user?.id]);

  useEffect(() => { load(); }, [load]);

  async function toggleLike(collectionId: number) {
    if (!user) return;
    if (tooFast('like:collection_likes')) {
      Alert.alert('Slow down', "You're tapping too fast.");
      return;
    }
    const prev = counts.get(collectionId) ?? EMPTY;
    const wasLiked = prev.liked;

    // Optimistic update first.
    setCounts(c => {
      const n = new Map(c);
      n.set(collectionId, {
        ...prev,
        liked: !wasLiked,
        likes: prev.likes + (wasLiked ? -1 : 1),
      });
      return n;
    });

    const q = supabase.from('collection_likes');
    const { error } = wasLiked
      ? await q.delete().eq('collection_id', collectionId).eq('user_id', user.id)
      : await q.insert({ collection_id: collectionId, user_id: user.id });

    if (error) {
      console.error('[useCollectionSocial:toggle]', error.message);
      // Rollback on failure.
      setCounts(c => {
        const n = new Map(c);
        n.set(collectionId, prev);
        return n;
      });
    }
  }

  return {
    get: (id: number) => counts.get(id) ?? EMPTY,
    toggleLike,
    refresh: load,
  };
}

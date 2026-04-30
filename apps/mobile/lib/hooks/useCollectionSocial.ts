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
 * 1000 CCU 확장성 — 이전 구현은 likes/comments 의 모든 row 를 fetch 후
 * 클라이언트에서 group by 했음 (셀러 50병 × 좋아요 30 = 1500 row 다운로드).
 * RPC `get_collection_social_counts` (마이그레이션 00049) 를 도입해서
 * server-side aggregate 로 대체 — 응답 페이로드 = 컬렉션 수만큼.
 *
 * RPC 는 security invoker 라 기존 RLS (`is_public=true` 컬렉션만 노출) 가
 * 그대로 적용됨. 댓글 목록은 여전히 CommentsSheet 에서 on-demand.
 */
export function useCollectionSocial(collectionIds: number[]): CollectionSocial {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Map<number, Counts>>(new Map());

  // Stable key so we don't refetch on every render if ids reference-change
  // but contents are the same. Parent passes a memoized array when possible.
  const key = collectionIds.join(',');

  const load = useCallback(async () => {
    if (collectionIds.length === 0) { setCounts(new Map()); return; }

    // 단일 RPC 라운드트립 — count(*) group by 가 server-side 에서 수행됨.
    const { data, error } = await supabase.rpc('get_collection_social_counts', {
      p_ids: collectionIds,
    });

    if (error || !data) {
      if (__DEV__) console.warn('[useCollectionSocial] rpc error:', error?.message);
      setCounts(new Map());
      return;
    }

    const next = new Map<number, Counts>();
    for (const row of data as Array<{ collection_id: number; likes: number; comments: number; liked: boolean }>) {
      next.set(row.collection_id, {
        likes: row.likes,
        comments: row.comments,
        liked: !!row.liked,
      });
    }
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

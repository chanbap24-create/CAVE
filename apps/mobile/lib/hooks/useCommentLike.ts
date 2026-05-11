import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

interface State {
  liked: boolean;
  count: number;
}

/**
 * Toggle like on a single collection_comments row. count 는 trigger 가 자동
 * 유지하지만, optimistic 으로 즉시 UI 반영. 본인 좋아요 여부도 캐시.
 *
 * Caller 가 initialCount 을 넘겨야 함 — 부모가 댓글 목록 fetch 시 like_count
 * 를 같이 select 하기 때문에 별도 fetch 없음.
 */
export function useCommentLike(commentId: number, initialCount: number) {
  const { user } = useAuth();
  const [state, setState] = useState<State>({ liked: false, count: initialCount });
  const [busy, setBusy] = useState(false);

  // 본인이 좋아요 했는지 한 번 확인 (commentId 또는 user 변경 시).
  useEffect(() => {
    let cancelled = false;
    if (!user) { setState(s => ({ ...s, liked: false })); return; }
    (async () => {
      const { data } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (!cancelled) setState(s => ({ ...s, liked: !!data }));
    })();
    return () => { cancelled = true; };
  }, [commentId, user?.id]);

  // initialCount 이 부모로부터 갱신되면 따라가기 (refetch 후).
  useEffect(() => {
    setState(s => ({ ...s, count: initialCount }));
  }, [initialCount]);

  const toggle = useCallback(async () => {
    if (!user || busy) return;
    setBusy(true);
    const wasLiked = state.liked;
    // Optimistic
    setState(s => ({ liked: !wasLiked, count: s.count + (wasLiked ? -1 : 1) }));

    const { error } = wasLiked
      ? await supabase.from('comment_likes').delete()
          .eq('comment_id', commentId).eq('user_id', user.id)
      : await supabase.from('comment_likes').insert({
          comment_id: commentId, user_id: user.id,
        });

    if (error) {
      // Rollback
      setState(s => ({ liked: wasLiked, count: s.count + (wasLiked ? 1 : -1) }));
      Alert.alert('실패', error.message);
    }
    setBusy(false);
  }, [user, busy, state.liked, commentId]);

  return { ...state, toggle, busy };
}

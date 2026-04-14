import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export function useLike(postId: number, initialCount: number) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    if (user) checkLiked();
  }, [user, postId]);

  async function checkLiked() {
    if (!user) return;
    const { data } = await supabase
      .from('likes')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .maybeSingle();
    setLiked(!!data);
  }

  async function toggleLike() {
    if (!user) return;

    if (liked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', postId);
      setLiked(false);
      setCount(prev => prev - 1);
    } else {
      await supabase.from('likes').insert({ user_id: user.id, post_id: postId });
      setLiked(true);
      setCount(prev => prev + 1);
    }
  }

  return { liked, count, toggleLike };
}

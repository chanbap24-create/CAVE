import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export function useFollow(targetUserId: string) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && targetUserId && user.id !== targetUserId) checkFollow();
  }, [user, targetUserId]);

  async function checkFollow() {
    if (!user) return;
    const { data } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .maybeSingle();
    setFollowing(!!data);
  }

  async function toggleFollow() {
    if (!user || loading || user.id === targetUserId) return;
    setLoading(true);

    if (following) {
      await supabase.from('follows').delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);
      setFollowing(false);
    } else {
      await supabase.from('follows').insert({
        follower_id: user.id,
        following_id: targetUserId,
      });
      setFollowing(true);
    }
    setLoading(false);
  }

  const isMe = user?.id === targetUserId;

  return { following, toggleFollow, loading, isMe };
}

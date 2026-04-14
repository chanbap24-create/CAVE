import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth';

interface FollowContextType {
  followingSet: Set<string>;
  toggleFollow: (targetUserId: string) => Promise<void>;
  isFollowing: (targetUserId: string) => boolean;
  refresh: () => Promise<void>;
}

const FollowContext = createContext<FollowContextType>({
  followingSet: new Set(),
  toggleFollow: async () => {},
  isFollowing: () => false,
  refresh: async () => {},
});

export function FollowProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) loadFollowing();
  }, [user]);

  async function loadFollowing() {
    if (!user) return;
    const { data } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);
    if (data) setFollowingSet(new Set(data.map(f => f.following_id)));
  }

  async function toggleFollow(targetUserId: string) {
    if (!user || user.id === targetUserId) return;

    if (followingSet.has(targetUserId)) {
      await supabase.from('follows').delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);
      setFollowingSet(prev => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
    } else {
      await supabase.from('follows').insert({
        follower_id: user.id,
        following_id: targetUserId,
      });
      setFollowingSet(prev => new Set(prev).add(targetUserId));
    }
  }

  function isFollowing(targetUserId: string) {
    return followingSet.has(targetUserId);
  }

  return (
    <FollowContext.Provider value={{ followingSet, toggleFollow, isFollowing, refresh: loadFollowing }}>
      {children}
    </FollowContext.Provider>
  );
}

export const useFollowContext = () => useContext(FollowContext);

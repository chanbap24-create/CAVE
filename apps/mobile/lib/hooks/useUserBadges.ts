import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface UserBadge {
  badge_id: number;
  earned_at: string;
  badge: {
    code: string;
    name: string;
    name_ko: string | null;
    category: string;
    condition: any;
    tier: number;
  };
}

export function useUserBadges(userId?: string) {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [allBadges, setAllBadges] = useState<any[]>([]);

  const loadBadges = useCallback(async () => {
    if (!userId) return;

    const [earnedRes, allRes] = await Promise.all([
      supabase.from('user_badges').select('badge_id, earned_at, badge:badges(code, name, name_ko, category, condition, tier)').eq('user_id', userId),
      supabase.from('badges').select('*').eq('is_active', true).order('tier').order('name'),
    ]);

    if (earnedRes.data) setBadges(earnedRes.data as any);
    if (allRes.data) setAllBadges(allRes.data);
  }, [userId]);

  return { badges, allBadges, loadBadges };
}

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

// ─── 마스터 데이터 캐시 ──────────────────────────────────────────
// badges 테이블은 마스터 (시드된 ~30 rows, 거의 변경 없음).
// 매 hook 호출마다 fetch 했더니 누적 166K calls × 0.3ms = 45초.
// 모듈 레벨 5분 TTL 캐시 — 메모리에서 즉시 반환.
let allBadgesCache: { data: any[]; ts: number } | null = null;
const ALL_BADGES_TTL_MS = 5 * 60 * 1000;

async function loadAllBadgesCached(): Promise<any[]> {
  if (allBadgesCache && Date.now() - allBadgesCache.ts < ALL_BADGES_TTL_MS) {
    return allBadgesCache.data;
  }
  const { data } = await supabase
    .from('badges')
    .select('*')
    .eq('is_active', true)
    .order('tier').order('name');
  if (data) allBadgesCache = { data, ts: Date.now() };
  return data ?? [];
}

export function useUserBadges(userId?: string) {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [allBadges, setAllBadges] = useState<any[]>([]);

  const loadBadges = useCallback(async () => {
    if (!userId) return;

    // 캐시 hit 면 즉시 반영, miss 면 fetch. user_badges 는 매번 fresh.
    const [earnedRes, allData] = await Promise.all([
      supabase.from('user_badges').select('badge_id, earned_at, badge:badges(code, name, name_ko, category, condition, tier)').eq('user_id', userId),
      loadAllBadgesCached(),
    ]);

    if (earnedRes.data) setBadges(earnedRes.data as any);
    setAllBadges(allData);
  }, [userId]);

  return { badges, allBadges, loadBadges };
}

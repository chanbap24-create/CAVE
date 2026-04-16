import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { MyPick } from './useMyPicks';

export function useUserPicks(userId?: string) {
  const [picks, setPicks] = useState<MyPick[]>([]);

  const loadPicks = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('collection_picks')
      .select('*, wine:wines(name, category, country)')
      .eq('user_id', userId)
      .order('display_order');
    if (data) setPicks(data);
  }, [userId]);

  return { picks, loadPicks };
}

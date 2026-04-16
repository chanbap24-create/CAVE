import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Alert } from 'react-native';

export interface MyPick {
  id: number;
  wine_id: number;
  photo_url: string | null;
  memo: string | null;
  display_order: number;
  wine?: { name: string; category: string; country: string | null };
}

export function useMyPicks() {
  const { user } = useAuth();
  const [picks, setPicks] = useState<MyPick[]>([]);

  const loadPicks = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('collection_picks')
      .select('*, wine:wines(name, category, country)')
      .eq('user_id', user.id)
      .order('display_order');
    if (data) setPicks(data);
  }, [user]);

  async function addPick(wineId: number, photoUrl: string, memo: string) {
    if (!user) return;
    if (picks.length >= 5) return Alert.alert('', 'Maximum 5 picks');

    await supabase.from('collection_picks').insert({
      user_id: user.id,
      wine_id: wineId,
      photo_url: photoUrl,
      memo: memo.trim() || null,
      display_order: picks.length,
    });
    await loadPicks();
  }

  async function removePick(pickId: number) {
    await supabase.from('collection_picks').delete().eq('id', pickId);
    await loadPicks();
  }

  return { picks, loadPicks, addPick, removePick };
}

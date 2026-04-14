import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface UserGathering {
  id: number;
  title: string;
  gathering_date: string | null;
  location: string | null;
  status: string;
  role: 'host' | 'member';
}

export function useUserGatherings(userId?: string) {
  const [gatherings, setGatherings] = useState<UserGathering[]>([]);

  const loadGatherings = useCallback(async () => {
    if (!userId) return;

    // Hosted gatherings
    const { data: hosted } = await supabase
      .from('gatherings')
      .select('id, title, gathering_date, location, status')
      .eq('host_id', userId)
      .in('status', ['open', 'closed'])
      .order('gathering_date', { ascending: true });

    // Joined gatherings
    const { data: joined } = await supabase
      .from('gathering_members')
      .select('gathering_id')
      .eq('user_id', userId)
      .eq('status', 'approved');

    let memberGatherings: any[] = [];
    if (joined && joined.length > 0) {
      const ids = joined.map(j => j.gathering_id);
      const { data } = await supabase
        .from('gatherings')
        .select('id, title, gathering_date, location, status')
        .in('id', ids)
        .in('status', ['open', 'closed'])
        .order('gathering_date', { ascending: true });
      memberGatherings = data || [];
    }

    const result: UserGathering[] = [
      ...(hosted || []).map(g => ({ ...g, role: 'host' as const })),
      ...memberGatherings
        .filter(g => !(hosted || []).some(h => h.id === g.id))
        .map(g => ({ ...g, role: 'member' as const })),
    ];

    setGatherings(result);
  }, [userId]);

  return { gatherings, loadGatherings };
}

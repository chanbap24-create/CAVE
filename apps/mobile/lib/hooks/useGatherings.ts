import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export interface Gathering {
  id: number;
  host_id: string;
  title: string;
  description: string | null;
  location: string | null;
  gathering_date: string | null;
  max_members: number;
  current_members: number;
  status: string;
  price_per_person: number | null;
  external_chat_url: string | null;
  metadata: any;
  created_at: string;
  host?: { username: string; display_name: string | null; avatar_url: string | null };
}

export function useGatherings() {
  const { user } = useAuth();
  const [gatherings, setGatherings] = useState<Gathering[]>([]);
  const [loading, setLoading] = useState(false);

  const loadGatherings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('gatherings')
      .select('*')
      .order('gathering_date', { ascending: true });

    if (!data) { setLoading(false); return; }

    // Enrich with host profile
    const hostIds = [...new Set(data.map(g => g.host_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', hostIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const enriched = data.map(g => ({
      ...g,
      host: profileMap.get(g.host_id),
    }));

    setGatherings(enriched);
    setLoading(false);
  }, []);

  return { gatherings, loading, loadGatherings };
}

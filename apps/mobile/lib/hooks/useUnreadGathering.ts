import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export function useUnreadGathering() {
  const { user } = useAuth();
  const [hasUnread, setHasUnread] = useState(false);

  const checkUnread = useCallback(async () => {
    if (!user) return;

    // Check if there are pending members in my gatherings
    const { data: myGatherings } = await supabase
      .from('gatherings')
      .select('id')
      .eq('host_id', user.id)
      .eq('status', 'open');

    if (!myGatherings || myGatherings.length === 0) { setHasUnread(false); return; }

    const gatheringIds = myGatherings.map(g => g.id);

    const { count } = await supabase
      .from('gathering_members')
      .select('*', { count: 'exact', head: true })
      .in('gathering_id', gatheringIds)
      .eq('status', 'pending');

    setHasUnread((count || 0) > 0);
  }, [user]);

  return { hasUnread, checkUnread };
}

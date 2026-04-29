import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export function useUnreadDM() {
  const { user } = useAuth();
  const [hasUnread, setHasUnread] = useState(false);

  const checkUnread = useCallback(async () => {
    if (!user) return;

    // Get my DM memberships
    const { data: memberships } = await supabase
      .from('chat_members')
      .select('room_id, last_read_at')
      .eq('user_id', user.id);

    if (!memberships || memberships.length === 0) { setHasUnread(false); return; }

    // Check DM rooms only
    const roomIds = memberships.map(m => m.room_id);
    const { data: dmRooms } = await supabase
      .from('chat_rooms')
      .select('id')
      .in('id', roomIds)
      .eq('type', 'dm');

    if (!dmRooms || dmRooms.length === 0) { setHasUnread(false); return; }

    const dmRoomIds = dmRooms.map(r => r.id);
    const readMap = new Map(memberships.map(m => [m.room_id, m.last_read_at]));

    for (const roomId of dmRoomIds) {
      // Only messages from OTHERS count as unread; skip self-sent.
      const { data: lastMsg } = await supabase
        .from('chat_messages')
        .select('created_at')
        .eq('room_id', roomId)
        .neq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (lastMsg?.[0]) {
        const lastRead = readMap.get(roomId);
        if (!lastRead || new Date(lastMsg[0].created_at) > new Date(lastRead)) {
          setHasUnread(true);
          return;
        }
      }
    }

    setHasUnread(false);
  }, [user]);

  return { hasUnread, checkUnread };
}

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export interface DMRoom {
  room_id: number;
  other_user: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  last_message: string | null;
  last_message_at: string | null;
  unread: boolean;
}

export function useDMList() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<DMRoom[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRooms = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Get my chat memberships
    const { data: memberships } = await supabase
      .from('chat_members')
      .select('room_id, last_read_at')
      .eq('user_id', user.id);

    if (!memberships || memberships.length === 0) { setLoading(false); return; }

    const roomIds = memberships.map(m => m.room_id);
    const readMap = new Map(memberships.map(m => [m.room_id, m.last_read_at]));

    // Get DM rooms only
    const { data: dmRooms } = await supabase
      .from('chat_rooms')
      .select('id')
      .in('id', roomIds)
      .eq('type', 'dm');

    if (!dmRooms || dmRooms.length === 0) { setLoading(false); return; }

    const dmRoomIds = dmRooms.map(r => r.id);

    // Build room list
    const result: DMRoom[] = [];

    for (const roomId of dmRoomIds) {
      // Get other member
      const { data: members } = await supabase
        .from('chat_members')
        .select('user_id')
        .eq('room_id', roomId)
        .neq('user_id', user.id)
        .limit(1);

      if (!members?.[0]) continue;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .eq('id', members[0].user_id)
        .single();

      if (!profile) continue;

      // Get last message
      const { data: lastMsg } = await supabase
        .from('chat_messages')
        .select('content, created_at')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(1);

      const lastReadAt = readMap.get(roomId);
      const unread = lastMsg?.[0] && lastReadAt
        ? new Date(lastMsg[0].created_at) > new Date(lastReadAt)
        : false;

      result.push({
        room_id: roomId,
        other_user: profile,
        last_message: lastMsg?.[0]?.content || null,
        last_message_at: lastMsg?.[0]?.created_at || null,
        unread,
      });
    }

    // Sort by last message time
    result.sort((a, b) => {
      if (!a.last_message_at) return 1;
      if (!b.last_message_at) return -1;
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
    });

    setRooms(result);
    setLoading(false);
  }, [user]);

  return { rooms, loading, loadRooms };
}

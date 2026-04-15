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

    // 1. Get my memberships
    const { data: memberships } = await supabase
      .from('chat_members')
      .select('room_id, last_read_at')
      .eq('user_id', user.id);

    if (!memberships || memberships.length === 0) { setRooms([]); setLoading(false); return; }

    const roomIds = memberships.map(m => m.room_id);
    const readMap = new Map(memberships.map(m => [m.room_id, m.last_read_at]));

    // 2. Get DM rooms only
    const { data: dmRooms } = await supabase
      .from('chat_rooms')
      .select('id')
      .in('id', roomIds)
      .eq('type', 'dm');

    if (!dmRooms || dmRooms.length === 0) { setRooms([]); setLoading(false); return; }

    const dmRoomIds = dmRooms.map(r => r.id);

    // 3. Batch: get all members of DM rooms (to find other users)
    const { data: allMembers } = await supabase
      .from('chat_members')
      .select('room_id, user_id')
      .in('room_id', dmRoomIds)
      .neq('user_id', user.id);

    if (!allMembers) { setRooms([]); setLoading(false); return; }

    const otherUserIds = [...new Set(allMembers.map(m => m.user_id))];
    const roomToUser = new Map(allMembers.map(m => [m.room_id, m.user_id]));

    // 4. Batch: get all profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', otherUserIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // 5. Batch: get last message per room
    const { data: allMessages } = await supabase
      .from('chat_messages')
      .select('room_id, content, created_at')
      .in('room_id', dmRoomIds)
      .order('created_at', { ascending: false });

    // Group by room, take first (latest)
    const lastMsgMap = new Map<number, { content: string; created_at: string }>();
    (allMessages || []).forEach(msg => {
      if (!lastMsgMap.has(msg.room_id)) lastMsgMap.set(msg.room_id, msg);
    });

    // Build result
    const result: DMRoom[] = dmRoomIds.map(roomId => {
      const otherUserId = roomToUser.get(roomId);
      const profile = otherUserId ? profileMap.get(otherUserId) : null;
      const lastMsg = lastMsgMap.get(roomId);
      const lastReadAt = readMap.get(roomId);
      const unread = lastMsg && lastReadAt
        ? new Date(lastMsg.created_at) > new Date(lastReadAt)
        : false;

      return {
        room_id: roomId,
        other_user: profile || { id: otherUserId || '', username: 'unknown', display_name: null, avatar_url: null },
        last_message: lastMsg?.content || null,
        last_message_at: lastMsg?.created_at || null,
        unread,
      };
    }).filter(r => r.other_user.id);

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

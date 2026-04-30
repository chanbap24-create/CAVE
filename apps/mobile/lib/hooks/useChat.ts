import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

type ChatProfile = { username: string; display_name: string | null; avatar_url: string | null };

export interface ChatMessage {
  id: number;
  user_id: string;
  content: string;
  created_at: string;
  profile?: ChatProfile;
}

export function useChat(roomId: number | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  // 1000 CCU 확장성 — realtime INSERT 마다 profile 재페치 하지 않도록 캐시.
  // useRef 라 리렌더 안 일으키고 컴포넌트 언마운트 시 자연 GC.
  const profileCacheRef = useRef<Map<string, ChatProfile>>(new Map());

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);

    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (!data) { setLoading(false); return; }

    // Enrich with profiles + warm cache
    const userIds = [...new Set(data.map(m => m.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', userIds);

    const cache = profileCacheRef.current;
    for (const p of profiles ?? []) {
      cache.set(p.id, { username: p.username, display_name: p.display_name, avatar_url: p.avatar_url });
    }

    setMessages(data.map(m => ({
      ...m,
      profile: cache.get(m.user_id),
    })));
    setLoading(false);

    // Update last read
    if (user) {
      await supabase
        .from('chat_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('user_id', user.id);
    }
  }, [roomId, user]);

  // Realtime subscription
  useEffect(() => {
    if (!roomId) return;

    loadMessages();

    const channel = supabase
      .channel(`chat-${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`,
      }, async (payload) => {
        const msg = payload.new as any;
        const cache = profileCacheRef.current;
        let profile = cache.get(msg.user_id);
        // 캐시 miss 일 때만 1회 fetch — 같은 방의 같은 작성자 메시지가 연달아
        // 와도 첫 번째에서 캐시에 들어가 이후엔 재페치 X.
        if (!profile) {
          const { data: fetched } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .eq('id', msg.user_id)
            .single();
          if (fetched) {
            profile = {
              username: fetched.username,
              display_name: fetched.display_name,
              avatar_url: fetched.avatar_url,
            };
            cache.set(fetched.id, profile);
          }
        }

        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, { ...msg, profile }];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  // Send message with optimistic update
  async function sendMessage(content: string) {
    if (!user || !roomId || !content.trim()) return;

    const { data } = await supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        user_id: user.id,
        content: content.trim(),
      })
      .select()
      .single();

    if (!data) return;

    // Own message: UI doesn't show avatar/username for 'mine', so skip profile fetch.
    // Realtime echo is deduped by id check in the subscription handler.
    setMessages(prev => {
      if (prev.some(m => m.id === data.id)) return prev;
      return [...prev, data];
    });
  }

  return { messages, loading, sendMessage, loadMessages };
}

// Get or create a gathering chat room
export async function getGatheringChatRoom(gatheringId: number, userId: string): Promise<number | null> {
  // Check existing
  const { data: existing } = await supabase
    .from('chat_rooms')
    .select('id')
    .eq('type', 'gathering')
    .eq('gathering_id', gatheringId)
    .single();

  if (existing) {
    // Ensure user is a member
    await supabase.from('chat_members').upsert({
      room_id: existing.id,
      user_id: userId,
    }, { onConflict: 'room_id,user_id' });
    return existing.id;
  }

  // Create new room
  const { data: room, error } = await supabase
    .from('chat_rooms')
    .insert({ type: 'gathering', gathering_id: gatheringId })
    .select()
    .single();

  if (error || !room) return null;

  // Add user as member
  await supabase.from('chat_members').insert({
    room_id: room.id,
    user_id: userId,
  });

  return room.id;
}

// Get or create a DM room between two users.
// Delegates to SECURITY DEFINER RPC `create_dm_room` so members are inserted
// atomically under proper auth. Client-side, we can only self-insert into chat_members.
// Signature preserved (userId1 is expected to be the caller / auth.uid()).
//
// Returns `{ roomId }` on success or `{ error }` with the raw message so
// callers can surface it — silent nulls mask the common "RPC missing"
// and "not authenticated" failure modes.
export async function getDMRoom(
  _userId1: string,
  userId2: string,
): Promise<{ roomId: number; error?: never } | { roomId?: never; error: string }> {
  const { data, error } = await supabase.rpc('create_dm_room', {
    p_other_user_id: userId2,
  });
  if (error) {
    console.error('[getDMRoom] rpc error:', error.message);
    return { error: error.message };
  }
  if (data == null) return { error: 'DM 방을 만들지 못했습니다.' };
  return { roomId: data as number };
}

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export interface ChatMessage {
  id: number;
  user_id: string;
  content: string;
  created_at: string;
  profile?: { username: string; display_name: string | null; avatar_url: string | null };
}

export function useChat(roomId: number | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

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

    // Enrich with profiles
    const userIds = [...new Set(data.map(m => m.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    setMessages(data.map(m => ({
      ...m,
      profile: profileMap.get(m.user_id),
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
        // Prevent duplicates
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return prev;
        });
        // Get profile and add
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .eq('id', msg.user_id)
          .single();

        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, { ...msg, profile }];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  // Send message
  async function sendMessage(content: string) {
    if (!user || !roomId || !content.trim()) return;

    const { error } = await supabase.from('chat_messages').insert({
      room_id: roomId,
      user_id: user.id,
      content: content.trim(),
    });

    // Fallback: reload if realtime didn't catch it within 2 seconds
    if (!error) {
      setTimeout(() => {
        setMessages(prev => {
          // Only reload if the message we just sent isn't in the list
          return prev;
        });
        loadMessages();
      }, 2000);
    }
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

// Get or create a DM room between two users
export async function getDMRoom(userId1: string, userId2: string): Promise<number | null> {
  // Find existing DM room where both users are members
  const { data: rooms1 } = await supabase
    .from('chat_members')
    .select('room_id')
    .eq('user_id', userId1);

  if (rooms1) {
    for (const r of rooms1) {
      const { data: room } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('id', r.room_id)
        .eq('type', 'dm')
        .single();

      if (room) {
        const { data: other } = await supabase
          .from('chat_members')
          .select('user_id')
          .eq('room_id', room.id)
          .eq('user_id', userId2)
          .single();

        if (other) return room.id;
      }
    }
  }

  // Create new DM room
  const { data: room, error } = await supabase
    .from('chat_rooms')
    .insert({ type: 'dm' })
    .select()
    .single();

  if (error || !room) return null;

  // Add both users
  await supabase.from('chat_members').insert([
    { room_id: room.id, user_id: userId1 },
    { room_id: room.id, user_id: userId2 },
  ]);

  return room.id;
}

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface MentionUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function useMention() {
  const [suggestions, setSuggestions] = useState<MentionUser[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  function detectMention(text: string, cursorPos?: number) {
    const pos = cursorPos ?? text.length;
    const before = text.slice(0, pos);
    const match = before.match(/@(\w*)$/);

    if (match) {
      const query = match[1];
      setMentionQuery(query);
      if (query.length >= 1) searchUsers(query);
      else setSuggestions([]);
    } else {
      setMentionQuery(null);
      setSuggestions([]);
    }
  }

  async function searchUsers(query: string) {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .ilike('username', `%${query}%`)
      .limit(5);
    if (data) setSuggestions(data);
  }

  function applyMention(text: string, user: MentionUser): string {
    const replaced = text.replace(/@(\w*)$/, `@${user.username} `);
    setSuggestions([]);
    setMentionQuery(null);
    return replaced;
  }

  return { suggestions, mentionQuery, detectMention, applyMention };
}

import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { tooFast } from '@/lib/utils/clientRateLimit';

export interface CommentsTableConfig {
  /** e.g. 'collection_comments' / 'cellar_comments'. */
  table: string;
  /** Column holding the target id, e.g. 'collection_id' / 'owner_id'. */
  targetColumn: string;
}

export interface Comment {
  id: number;
  user_id: string;
  body: string;
  created_at: string;
  profile?: { username: string | null; display_name: string | null; avatar_url: string | null };
}

/**
 * Generic comments list + add/delete backed by a table with
 * (id, <target>, user_id, body, created_at) columns.
 *
 * Shared by useCollectionComments / useCellarComments. Keeps the fetch +
 * count + insert + optimistic add/remove in one place (rule #4).
 */
export function useCommentsTarget(config: CommentsTableConfig, targetId: string | number | null) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (targetId == null) {
      setComments([]); setCount(0);
      return;
    }
    setLoading(true);
    const { data, count: total } = await supabase
      .from(config.table)
      .select('id, user_id, body, created_at, profile:profiles(username, display_name, avatar_url)', { count: 'exact' })
      .eq(config.targetColumn, targetId as any)
      .order('created_at', { ascending: true });
    setComments((data ?? []) as any);
    setCount(total ?? 0);
    setLoading(false);
  }, [config.table, config.targetColumn, targetId]);

  useEffect(() => { load(); }, [load]);

  async function add(body: string): Promise<boolean> {
    const trimmed = body.trim();
    if (!user || targetId == null || !trimmed) return false;
    if (tooFast(`comment:${config.table}`)) {
      Alert.alert('Slow down', "Too many comments too quickly. Try again in a minute.");
      return false;
    }
    const { data, error } = await supabase
      .from(config.table)
      .insert({ [config.targetColumn]: targetId, user_id: user.id, body: trimmed } as any)
      .select('id, user_id, body, created_at, profile:profiles(username, display_name, avatar_url)')
      .single();
    if (error || !data) {
      console.error(`[useCommentsTarget:${config.table}]`, error?.message);
      reportError(config.table, error?.message);
      return false;
    }
    setComments(prev => [...prev, data as any]);
    setCount(c => c + 1);
    return true;
  }

  async function remove(commentId: number): Promise<boolean> {
    const { error } = await supabase.from(config.table).delete().eq('id', commentId);
    if (error) {
      console.error(`[useCommentsTarget:${config.table}]`, error.message);
      return false;
    }
    setComments(prev => prev.filter(c => c.id !== commentId));
    setCount(c => Math.max(0, c - 1));
    return true;
  }

  return { comments, count, loading, add, remove, refresh: load };
}

function reportError(table: string, rawMessage: string | undefined) {
  const msg = (rawMessage ?? '').toLowerCase();
  const missingTable = msg.includes('does not exist')
    || msg.includes('schema cache')
    || msg.includes('could not find the table')
    || (msg.includes('relation') && msg.includes(table));
  if (missingTable) {
    Alert.alert(
      'Setup needed',
      `The table "${table}" is missing on the server. Apply migration 00022_cellar_social.sql in Supabase Dashboard → SQL Editor.`,
    );
  } else if (msg.includes('row-level security') || msg.includes('policy')) {
    Alert.alert('Not allowed', 'This cellar may be private, or you need to log in again.');
  } else if (rawMessage) {
    Alert.alert('Failed', rawMessage);
  }
}

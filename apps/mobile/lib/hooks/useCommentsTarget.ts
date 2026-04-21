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
  parent_id?: number | null;
  profile?: { username: string | null; display_name: string | null; avatar_url: string | null };
  /** Flat-list hooks set this when the caller opts into a tree view. */
  replies?: Comment[];
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
      .select('id, user_id, body, created_at, parent_id, profile:profiles(username, display_name, avatar_url)', { count: 'exact' })
      .eq(config.targetColumn, targetId as any)
      .order('created_at', { ascending: true });

    // Shape into a 2-level tree: top-level + flat list of replies under
    // each parent. Nested replies beyond 1 level not supported in the UI
    // so we flatten grandchildren to the top-level parent.
    const all = (data ?? []) as unknown as Comment[];
    const byParent = new Map<number, Comment[]>();
    const topLevel: Comment[] = [];
    for (const c of all) {
      if (c.parent_id == null) topLevel.push({ ...c, replies: [] });
      else {
        const list = byParent.get(c.parent_id) ?? [];
        list.push(c);
        byParent.set(c.parent_id, list);
      }
    }
    const tree = topLevel.map(t => ({ ...t, replies: byParent.get(t.id) ?? [] }));
    setComments(tree);
    setCount(total ?? 0);
    setLoading(false);
  }, [config.table, config.targetColumn, targetId]);

  useEffect(() => { load(); }, [load]);

  async function add(body: string, parentId?: number | null): Promise<boolean> {
    const trimmed = body.trim();
    if (!user || targetId == null || !trimmed) return false;
    if (tooFast(`comment:${config.table}`)) {
      Alert.alert('Slow down', "Too many comments too quickly. Try again in a minute.");
      return false;
    }
    const payload: Record<string, unknown> = {
      [config.targetColumn]: targetId,
      user_id: user.id,
      body: trimmed,
    };
    if (parentId != null) payload.parent_id = parentId;

    const { error } = await supabase.from(config.table).insert(payload as any);
    if (error) {
      console.error(`[useCommentsTarget:${config.table}]`, error.message);
      reportError(config.table, error.message);
      return false;
    }
    // Reload to get the correctly threaded tree back — optimistic merging
    // into a 2-level tree by hand is more fiddly than the round-trip cost.
    await load();
    return true;
  }

  async function remove(commentId: number): Promise<boolean> {
    const { error } = await supabase.from(config.table).delete().eq('id', commentId);
    if (error) {
      console.error(`[useCommentsTarget:${config.table}]`, error.message);
      return false;
    }
    await load();
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

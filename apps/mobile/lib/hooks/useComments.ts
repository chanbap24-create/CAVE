import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export interface Comment {
  id: number;
  post_id: number;
  user_id: string;
  parent_id: number | null;
  content: string;
  created_at: string;
  profile?: { username: string; display_name: string | null };
  replies?: Comment[];
}

export function useComments(postId: number) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadComments();
  }, [postId]);

  async function loadComments() {
    setLoading(true);
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (!data) { setLoading(false); return; }

    // Enrich with profiles
    const userIds = [...new Set(data.map(c => c.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Build tree: top-level + replies
    const enriched = data.map(c => ({
      ...c,
      profile: profileMap.get(c.user_id),
    }));

    const topLevel = enriched.filter(c => !c.parent_id);
    const replyMap = new Map<number, Comment[]>();
    enriched.filter(c => c.parent_id).forEach(c => {
      const list = replyMap.get(c.parent_id!) || [];
      list.push(c);
      replyMap.set(c.parent_id!, list);
    });

    const tree = topLevel.map(c => ({
      ...c,
      replies: replyMap.get(c.id) || [],
    }));

    setComments(tree);
    setLoading(false);
  }

  async function addComment(content: string, parentId?: number) {
    if (!user || !content.trim()) return;

    await supabase.from('comments').insert({
      post_id: postId,
      user_id: user.id,
      parent_id: parentId || null,
      content: content.trim(),
    });

    // Send mention notifications from comment
    const mentions = content.match(/@([^\s@]+)/g);
    if (mentions) {
      const usernames = mentions.map(m => m.replace('@', ''));
      const { data: mentionedUsers } = await supabase
        .from('profiles')
        .select('id')
        .in('username', usernames);
      if (mentionedUsers) {
        const notifs = mentionedUsers
          .filter(u => u.id !== user.id)
          .map(u => ({
            user_id: u.id,
            type: 'mention' as const,
            actor_id: user.id,
            reference_id: postId.toString(),
            reference_type: 'post',
            body: 'mentioned you in a comment',
          }));
        if (notifs.length > 0) await supabase.from('notifications').insert(notifs);
      }
    }

    await loadComments();
  }

  async function deleteComment(commentId: number) {
    if (!user) return;
    await supabase.from('comments').delete().eq('id', commentId).eq('user_id', user.id);
    await loadComments();
  }

  return { comments, loading, addComment, deleteComment };
}

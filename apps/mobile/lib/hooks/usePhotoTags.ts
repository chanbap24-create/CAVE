import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface PhotoTag {
  id: number;
  post_id: number;
  tag_type: 'user' | 'wine';
  user_id: string | null;
  wine_id: number | null;
  x_position: number;
  y_position: number;
  label?: string; // username or wine name
}

export function usePhotoTags(postId: number) {
  const [tags, setTags] = useState<PhotoTag[]>([]);

  const loadTags = useCallback(async () => {
    const { data } = await supabase
      .from('photo_tags')
      .select('*')
      .eq('post_id', postId);

    if (!data || data.length === 0) { setTags([]); return; }

    // Enrich with labels
    const userIds = data.filter(t => t.tag_type === 'user' && t.user_id).map(t => t.user_id!);
    const wineIds = data.filter(t => t.tag_type === 'wine' && t.wine_id).map(t => t.wine_id!);

    let userMap = new Map<string, string>();
    let wineMap = new Map<number, string>();

    if (userIds.length > 0) {
      const { data: users } = await supabase.from('profiles').select('id, username').in('id', userIds);
      users?.forEach(u => userMap.set(u.id, u.username));
    }
    if (wineIds.length > 0) {
      const { data: wines } = await supabase.from('wines').select('id, name').in('id', wineIds);
      wines?.forEach(w => wineMap.set(w.id, w.name));
    }

    const enriched = data.map(t => ({
      ...t,
      label: t.tag_type === 'user'
        ? userMap.get(t.user_id!) || 'unknown'
        : wineMap.get(t.wine_id!) || 'unknown',
    }));

    setTags(enriched);
  }, [postId]);

  async function addTag(tag: Omit<PhotoTag, 'id' | 'label'>) {
    await supabase.from('photo_tags').insert(tag);

    // Send notification for user tags
    if (tag.tag_type === 'user' && tag.user_id) {
      const { data: post } = await supabase.from('posts').select('user_id').eq('id', tag.post_id).single();
      if (post && post.user_id !== tag.user_id) {
        await supabase.from('notifications').insert({
          user_id: tag.user_id,
          type: 'mention',
          actor_id: post.user_id,
          reference_id: tag.post_id.toString(),
          reference_type: 'post',
          body: 'tagged you in a photo',
        });
      }
    }

    await loadTags();
  }

  return { tags, loadTags, addTag };
}

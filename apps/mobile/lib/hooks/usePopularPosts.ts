import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface PopularPost {
  id: number;
  user_id: string;
  caption: string | null;
  like_count: number;
  created_at: string;
  image_url: string | null;
  video_playback_id: string | null;
  username: string;
  avatar_url: string | null;
}

export function usePopularPosts(category?: string | null) {
  const [posts, setPosts] = useState<PopularPost[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPopular = useCallback(async () => {
    setLoading(true);

    let q = supabase
      .from('posts')
      .select('id, user_id, caption, like_count, created_at, video_playback_id')
      .eq('is_public', true)
      .order('like_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10);
    if (category) q = q.eq('category', category);

    const { data } = await q;

    if (!data || data.length === 0) { setPosts([]); setLoading(false); return; }

    const postIds = data.map(p => p.id);
    const userIds = [...new Set(data.map(p => p.user_id))];

    // Batch queries
    const [imgRes, profileRes] = await Promise.all([
      supabase.from('post_images').select('post_id, image_url').in('post_id', postIds),
      supabase.from('profiles').select('id, username, avatar_url').in('id', userIds),
    ]);

    const imgMap = new Map<number, string>();
    (imgRes.data || []).forEach(img => { if (!imgMap.has(img.post_id)) imgMap.set(img.post_id, img.image_url); });
    const profileMap = new Map((profileRes.data || []).map(p => [p.id, p]));

    const enriched: PopularPost[] = data.map(post => {
      let imageUrl = imgMap.get(post.id) || null;
      if (!imageUrl && post.video_playback_id) {
        imageUrl = `https://image.mux.com/${post.video_playback_id}/thumbnail.jpg?width=320&height=320&fit_mode=crop`;
      }
      const profile = profileMap.get(post.user_id);
      return {
        ...post,
        image_url: imageUrl,
        username: profile?.username || 'unknown',
        avatar_url: profile?.avatar_url || null,
      };
    });

    setPosts(enriched);
    setLoading(false);
  }, [category]);

  return { posts, loading, loadPopular };
}

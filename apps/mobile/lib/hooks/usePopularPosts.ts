import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface PopularPost {
  id: number;
  user_id: string;
  caption: string | null;
  like_count: number;
  created_at: string;
  image_url: string | null;
  username: string;
  avatar_url: string | null;
}

export function usePopularPosts() {
  const [posts, setPosts] = useState<PopularPost[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPopular = useCallback(async () => {
    setLoading(true);

    const { data } = await supabase
      .from('posts')
      .select('id, user_id, caption, like_count, created_at')
      .eq('is_public', true)
      .gt('like_count', 0)
      .order('like_count', { ascending: false })
      .limit(10);

    if (!data || data.length === 0) {
      // Fallback: recent posts
      const { data: recent } = await supabase
        .from('posts')
        .select('id, user_id, caption, like_count, created_at')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(10);
      if (recent) await enrichPosts(recent);
    } else {
      await enrichPosts(data);
    }

    setLoading(false);
  }, []);

  async function enrichPosts(rawPosts: any[]) {
    const enriched = await Promise.all(rawPosts.map(async (post) => {
      const [imgRes, profileRes] = await Promise.all([
        supabase.from('post_images').select('image_url').eq('post_id', post.id).limit(1),
        supabase.from('profiles').select('username, avatar_url').eq('id', post.user_id).single(),
      ]);

      return {
        ...post,
        image_url: imgRes.data?.[0]?.image_url || null,
        username: profileRes.data?.username || 'unknown',
        avatar_url: profileRes.data?.avatar_url || null,
      };
    }));

    setPosts(enriched);
  }

  return { posts, loading, loadPopular };
}

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export interface MyPost {
  id: number;
  caption: string | null;
  image_url: string | null;
  video_playback_id: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
}

export function useMyPosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPosts = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from('posts')
      .select('id, caption, like_count, comment_count, created_at, video_playback_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!data) { setLoading(false); return; }

    // Get first image for each post (or Mux thumbnail for videos)
    const enriched = await Promise.all(data.map(async (post) => {
      let imageUrl: string | null = null;

      if (post.video_playback_id) {
        imageUrl = `https://image.mux.com/${post.video_playback_id}/thumbnail.jpg?width=400&height=400&fit_mode=crop`;
      } else {
        const { data: imgs } = await supabase
          .from('post_images')
          .select('image_url')
          .eq('post_id', post.id)
          .limit(1);
        imageUrl = imgs?.[0]?.image_url || null;
      }

      return {
        ...post,
        image_url: imageUrl,
      };
    }));

    setPosts(enriched);
    setLoading(false);
  }, [user]);

  return { posts, loading, loadPosts };
}

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const LIMIT = 20;

/**
 * Public posts filtered by drink category, enriched with image / profile /
 * tagged-wine in the same shape the home-feed PostCard expects. Pass a DB
 * key ('wine' | 'whiskey' | 'sake' | 'cognac' | 'other') or null to disable.
 *
 * Mirrors the fan-out pattern used in app/(tabs)/index.tsx so PostCard can
 * render either source without adapters.
 */
export function usePostsByCategory(category: string | null) {
  const [posts, setPosts] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!category) { setPosts(null); return; }
    setLoading(true);

    const { data: postsData, error } = await supabase
      .from('posts')
      .select('*')
      .eq('is_public', true)
      .eq('category', category)
      .order('created_at', { ascending: false })
      .limit(LIMIT);

    if (error || !postsData || postsData.length === 0) {
      setPosts([]); setLoading(false); return;
    }

    const postIds = postsData.map(p => p.id);
    const userIds = [...new Set(postsData.map(p => p.user_id))];

    const [imgRes, profileRes, wineTagRes] = await Promise.all([
      supabase.from('post_images').select('post_id, image_url').in('post_id', postIds),
      supabase.from('profiles').select('id, username, display_name, avatar_url, collection_count').in('id', userIds),
      supabase.from('post_wines').select('post_id, wine_id').in('post_id', postIds),
    ]);

    const wineIds = [...new Set((wineTagRes.data ?? []).map(w => w.wine_id))];
    let wineMap = new Map();
    if (wineIds.length > 0) {
      const { data: wines } = await supabase.from('wines').select('id, name, category').in('id', wineIds);
      wineMap = new Map(wines?.map(w => [w.id, w]) || []);
    }

    const imgMap = new Map();
    (imgRes.data ?? []).forEach(img => { if (!imgMap.has(img.post_id)) imgMap.set(img.post_id, img.image_url); });
    const profileMap = new Map((profileRes.data ?? []).map(p => [p.id, p]));
    const wineTagMap = new Map((wineTagRes.data ?? []).map(wt => [wt.post_id, wt.wine_id]));

    const enriched = postsData.map(post => ({
      ...post,
      image_url: imgMap.get(post.id) || null,
      profile: profileMap.get(post.user_id) || null,
      wine: wineTagMap.has(post.id) ? wineMap.get(wineTagMap.get(post.id)) || null : null,
    }));

    setPosts(enriched);
    setLoading(false);
  }, [category]);

  useEffect(() => { load(); }, [load]);

  return { posts, loading, refresh: load };
}

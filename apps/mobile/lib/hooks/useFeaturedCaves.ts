import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface FeaturedCave {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  collection_count: number;
  countries: number;
  top_category: string | null;
  badges: string[];
  activeGatherings: number;
  latestPostImage: string | null;
  latestVideoPlaybackId: string | null;
}

const labelMap: Record<string, string> = {
  wine: 'Wine', whiskey: 'Whisky', sake: 'Sake', cognac: 'Cognac', other: 'Other',
};

export function useFeaturedCaves() {
  const [caves, setCaves] = useState<FeaturedCave[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFeatured = useCallback(async () => {
    setLoading(true);

    // 1. Get top profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, collection_count, avatar_url')
      .gt('collection_count', 0)
      .order('collection_count', { ascending: false })
      .limit(10);

    if (!profiles || profiles.length === 0) { setLoading(false); return; }

    const userIds = profiles.map(p => p.id);

    // 2. Batch: collections with wine data
    const { data: allCollections } = await supabase
      .from('collections')
      .select('user_id, wine_id, wines(country, category)')
      .in('user_id', userIds);

    // 3. Batch: active gatherings
    const { data: hostedGatherings } = await supabase
      .from('gatherings')
      .select('host_id')
      .in('host_id', userIds)
      .eq('status', 'open');

    const { data: joinedGatherings } = await supabase
      .from('gathering_members')
      .select('user_id')
      .in('user_id', userIds)
      .eq('status', 'approved');

    // 4. Batch: latest posts
    const { data: latestPosts } = await supabase
      .from('posts')
      .select('id, user_id, video_playback_id')
      .in('user_id', userIds)
      .order('created_at', { ascending: false });

    // Get first post per user
    const latestPostMap = new Map<string, any>();
    (latestPosts || []).forEach(p => { if (!latestPostMap.has(p.user_id)) latestPostMap.set(p.user_id, p); });

    // 5. Batch: post images for latest posts
    const postIds = [...latestPostMap.values()].filter(p => !p.video_playback_id).map(p => p.id);
    let imgMap = new Map<number, string>();
    if (postIds.length > 0) {
      const { data: imgs } = await supabase.from('post_images').select('post_id, image_url').in('post_id', postIds);
      (imgs || []).forEach(img => { if (!imgMap.has(img.post_id)) imgMap.set(img.post_id, img.image_url); });
    }

    // Build results
    const enriched: FeaturedCave[] = profiles.map(p => {
      const collections = (allCollections || []).filter(c => c.user_id === p.id);
      const countries = new Set(collections.map((c: any) => c.wines?.country).filter(Boolean));
      const catCounts: Record<string, number> = {};
      collections.forEach((c: any) => { const cat = c.wines?.category; if (cat) catCounts[cat] = (catCounts[cat] || 0) + 1; });
      const topCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

      const badges: string[] = [];
      if (p.collection_count >= 100) badges.push('Master');
      else if (p.collection_count >= 50) badges.push('Expert');
      else if (p.collection_count >= 10) badges.push('Collector');
      if (countries.size >= 5) badges.push('World Traveler');

      const hosted = (hostedGatherings || []).filter(g => g.host_id === p.id).length;
      const joined = (joinedGatherings || []).filter(g => g.user_id === p.id).length;

      const latestPost = latestPostMap.get(p.id);
      let latestPostImage: string | null = null;
      let latestVideoPlaybackId: string | null = null;
      if (latestPost?.video_playback_id) {
        latestVideoPlaybackId = latestPost.video_playback_id;
        latestPostImage = `https://image.mux.com/${latestPost.video_playback_id}/thumbnail.jpg?width=400&height=500&fit_mode=crop`;
      } else if (latestPost) {
        latestPostImage = imgMap.get(latestPost.id) || null;
      }

      return {
        user_id: p.id,
        username: p.username,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        collection_count: p.collection_count,
        activeGatherings: hosted + joined,
        latestPostImage,
        latestVideoPlaybackId,
        countries: countries.size,
        top_category: topCategory,
        badges,
      };
    });

    setCaves(enriched);
    setLoading(false);
  }, []);

  return { caves, loading, refresh: loadFeatured };
}

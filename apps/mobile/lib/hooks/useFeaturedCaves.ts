import { useState, useEffect } from 'react';
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

export function useFeaturedCaves() {
  const [caves, setCaves] = useState<FeaturedCave[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadFeatured(); }, []);

  async function loadFeatured() {
    setLoading(true);

    // Get profiles with most collections
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, collection_count, avatar_url')
      .gt('collection_count', 0)
      .order('collection_count', { ascending: false })
      .limit(10);

    if (!profiles || profiles.length === 0) {
      setLoading(false);
      return;
    }

    // Enrich each profile
    const enriched = await Promise.all(profiles.map(async (p) => {
      // Count unique countries
      const { data: collections } = await supabase
        .from('collections')
        .select('wine_id, wines(country, category)')
        .eq('user_id', p.id);

      const countries = new Set(collections?.map((c: any) => c.wines?.country).filter(Boolean));

      // Find top category
      const catCounts: Record<string, number> = {};
      collections?.forEach((c: any) => {
        const cat = c.wines?.category;
        if (cat) catCounts[cat] = (catCounts[cat] || 0) + 1;
      });
      const topCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

      // Build badges
      const badges: string[] = [];
      if (p.collection_count >= 50) badges.push('Expert');
      else if (p.collection_count >= 10) badges.push('Collector');
      if (countries.size >= 5) badges.push('World Traveler');
      if (topCategory === 'whiskey') badges.push('Whisky Lover');
      if (topCategory === 'sake') badges.push('Sake Lover');
      if (topCategory === 'wine') badges.push('Wine Lover');

      // Count active gatherings (hosting or joined)
      const { count: hostCount } = await supabase
        .from('gatherings')
        .select('*', { count: 'exact', head: true })
        .eq('host_id', p.id)
        .eq('status', 'open');

      const { data: joinedData } = await supabase
        .from('gathering_members')
        .select('gathering_id')
        .eq('user_id', p.id)
        .eq('status', 'approved');

      const activeGatherings = (hostCount || 0) + (joinedData?.length || 0);

      // Latest post image (support video thumbnail)
      const { data: latestPost } = await supabase
        .from('posts')
        .select('id, video_playback_id')
        .eq('user_id', p.id)
        .order('created_at', { ascending: false })
        .limit(1);

      let latestPostImage: string | null = null;
      if (latestPost?.[0]) {
        if (latestPost[0].video_playback_id) {
          latestPostImage = `https://image.mux.com/${latestPost[0].video_playback_id}/thumbnail.jpg?width=400&height=500&fit_mode=crop`;
        } else {
          const { data: img } = await supabase
            .from('post_images')
            .select('image_url')
            .eq('post_id', latestPost[0].id)
            .limit(1);
          latestPostImage = img?.[0]?.image_url || null;
        }
      }

      return {
        user_id: p.id,
        username: p.username,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        collection_count: p.collection_count,
        activeGatherings,
        latestPostImage,
        latestVideoPlaybackId: latestPost?.[0]?.video_playback_id || null,
        countries: countries.size,
        top_category: topCategory,
        badges,
      };
    }));

    setCaves(enriched);
    setLoading(false);
  }

  return { caves, loading, refresh: loadFeatured };
}

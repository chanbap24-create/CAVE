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

export function useFeaturedCaves(category?: string | null) {
  const [caves, setCaves] = useState<FeaturedCave[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFeatured = useCallback(async () => {
    setLoading(true);

    let userIds: string[] = [];
    if (category) {
      // Category mode: rank by count of bottles in this category.
      const { data: rows } = await supabase
        .from('collections')
        .select('user_id, wines!inner(category)')
        .eq('wines.category', category)
        .limit(1000);
      const counts = new Map<string, number>();
      (rows ?? []).forEach((r: any) => counts.set(r.user_id, (counts.get(r.user_id) ?? 0) + 1));
      userIds = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([uid]) => uid);
    } else {
      // All mode: reward diversity. Score each user as the sum of
      // sqrt(count) across categories so (20,20,20,20,20) beats
      // (100,0,0,0,0) — someone with breadth edges out a single-type
      // hoarder even at lower total volume. Square-root gives diminishing
      // returns within each category so scale still matters somewhat.
      const { data: rows } = await supabase
        .from('collections')
        .select('user_id, wines!inner(category)')
        .limit(2000);
      const byUser = new Map<string, Map<string, number>>();
      (rows ?? []).forEach((r: any) => {
        const cat = r.wines?.category ?? 'other';
        const perCat = byUser.get(r.user_id) ?? new Map<string, number>();
        perCat.set(cat, (perCat.get(cat) ?? 0) + 1);
        byUser.set(r.user_id, perCat);
      });
      const scores: { uid: string; score: number }[] = [];
      byUser.forEach((perCat, uid) => {
        let score = 0;
        perCat.forEach(c => { score += Math.sqrt(c); });
        scores.push({ uid, score });
      });
      userIds = scores
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(s => s.uid);
    }

    if (userIds.length === 0) { setCaves([]); setLoading(false); return; }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, collection_count, avatar_url')
      .in('id', userIds);
    if (!profiles || profiles.length === 0) { setCaves([]); setLoading(false); return; }

    // Preserve the category-ordered userIds ranking.
    const profileMap = new Map(profiles.map(p => [p.id, p]));
    const orderedProfiles = userIds.map(id => profileMap.get(id)).filter(Boolean) as typeof profiles;

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

    // Pre-group by user_id — O(N+M) instead of O(N*M)
    const collectionsByUser = new Map<string, any[]>();
    (allCollections || []).forEach(c => {
      const list = collectionsByUser.get(c.user_id) || [];
      list.push(c);
      collectionsByUser.set(c.user_id, list);
    });
    const hostedCountByUser = new Map<string, number>();
    (hostedGatherings || []).forEach(g => {
      hostedCountByUser.set(g.host_id, (hostedCountByUser.get(g.host_id) || 0) + 1);
    });
    const joinedCountByUser = new Map<string, number>();
    (joinedGatherings || []).forEach(g => {
      joinedCountByUser.set(g.user_id, (joinedCountByUser.get(g.user_id) || 0) + 1);
    });

    // Build results (iterate orderedProfiles to preserve category ranking)
    const enriched: FeaturedCave[] = orderedProfiles.map(p => {
      const collections = collectionsByUser.get(p.id) || [];
      const countries = new Set(collections.map((c: any) => c.wines?.country).filter(Boolean));
      const catCounts: Record<string, number> = {};
      collections.forEach((c: any) => { const cat = c.wines?.category; if (cat) catCounts[cat] = (catCounts[cat] || 0) + 1; });
      const topCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

      const badges: string[] = [];
      if (p.collection_count >= 100) badges.push('Master');
      else if (p.collection_count >= 50) badges.push('Expert');
      else if (p.collection_count >= 10) badges.push('Collector');
      if (countries.size >= 5) badges.push('World Traveler');

      const hosted = hostedCountByUser.get(p.id) || 0;
      const joined = joinedCountByUser.get(p.id) || 0;

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
  }, [category]);

  return { caves, loading, refresh: loadFeatured };
}

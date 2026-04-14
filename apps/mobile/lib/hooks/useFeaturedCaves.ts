import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface FeaturedCave {
  user_id: string;
  username: string;
  display_name: string | null;
  collection_count: number;
  countries: number;
  top_category: string | null;
  badges: string[];
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
      .select('id, username, display_name, collection_count')
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

      return {
        user_id: p.id,
        username: p.username,
        display_name: p.display_name,
        collection_count: p.collection_count,
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

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface TasteProfile {
  categoryBreakdown: { label: string; percentage: number }[];
  topCountries: string[];
  totalBottles: number;
  badgeProgress: { name: string; current: number; target: number }[];
}

const labelMap: Record<string, string> = {
  wine: 'Wine', whiskey: 'Whisky', sake: 'Sake', cognac: 'Cognac', other: 'Other',
};

export function useTasteProfile(userId?: string) {
  const [taste, setTaste] = useState<TasteProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const loadTaste = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data: collections } = await supabase
      .from('collections')
      .select('wine_id, wines(category, country, region)')
      .eq('user_id', userId);

    if (!collections || collections.length === 0) {
      setTaste(null);
      setLoading(false);
      return;
    }

    // Category breakdown
    const catCounts: Record<string, number> = {};
    const countryCounts: Record<string, number> = {};

    collections.forEach((c: any) => {
      const cat = c.wines?.category;
      const country = c.wines?.country;
      if (cat) catCounts[cat] = (catCounts[cat] || 0) + 1;
      if (country) countryCounts[country] = (countryCounts[country] || 0) + 1;
    });

    const total = collections.length;
    const categoryBreakdown = Object.entries(catCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => ({
        label: labelMap[key] || key,
        percentage: Math.round((count / total) * 100),
      }));

    // Top countries
    const topCountries = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([country]) => country);

    // Badge progress
    const uniqueCountries = Object.keys(countryCounts).length;
    const badgeProgress: TasteProfile['badgeProgress'] = [];

    if (total < 10) badgeProgress.push({ name: 'Collector', current: total, target: 10 });
    else if (total < 50) badgeProgress.push({ name: 'Expert', current: total, target: 50 });
    else if (total < 100) badgeProgress.push({ name: 'Master', current: total, target: 100 });

    if (uniqueCountries < 5) badgeProgress.push({ name: 'World Traveler', current: uniqueCountries, target: 5 });
    else if (uniqueCountries < 10) badgeProgress.push({ name: 'Globe Trotter', current: uniqueCountries, target: 10 });

    setTaste({ categoryBreakdown, topCountries, totalBottles: total, badgeProgress });
    setLoading(false);
  }, [userId]);

  return { taste, loading, loadTaste };
}

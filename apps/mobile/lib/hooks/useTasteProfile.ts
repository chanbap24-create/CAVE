import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface TasteProfile {
  categoryBreakdown: { label: string; percentage: number }[];
  topCountries: string[];
  totalBottles: number;
  badgeProgress: { name: string; current: number; target: number }[];
  /** Top-scoring country/region/wine_type/category for the compact hero
   *  summary. Null when there's no non-null value to rank. */
  topCategory: string | null;
  topCountry: string | null;
  topRegion: string | null;
  topWineType: string | null;
}

const labelMap: Record<string, string> = {
  wine: 'Wine', spirit: 'Spirit', traditional: 'Traditional', other: 'Other',
};
const wineTypeLabels: Record<string, string> = {
  red: 'Red', white: 'White', rose: 'Rosé', sparkling: 'Sparkling',
  dessert: 'Dessert', fortified: 'Fortified', orange: 'Orange',
};

export function useTasteProfile(userId?: string) {
  const [taste, setTaste] = useState<TasteProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const loadTaste = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data: collections } = await supabase
      .from('collections')
      .select('wine_id, wines(category, country, region, wine_type)')
      .eq('user_id', userId);

    if (!collections || collections.length === 0) {
      setTaste(null);
      setLoading(false);
      return;
    }

    // Category breakdown
    const catCounts: Record<string, number> = {};
    const countryCounts: Record<string, number> = {};
    const regionCounts: Record<string, number> = {};
    const wineTypeCounts: Record<string, number> = {};

    collections.forEach((c: any) => {
      const cat = c.wines?.category;
      const country = c.wines?.country;
      const region = c.wines?.region;
      const wineType = c.wines?.wine_type;
      if (cat) catCounts[cat] = (catCounts[cat] || 0) + 1;
      if (country) countryCounts[country] = (countryCounts[country] || 0) + 1;
      if (region) regionCounts[region] = (regionCounts[region] || 0) + 1;
      if (wineType) wineTypeCounts[wineType] = (wineTypeCounts[wineType] || 0) + 1;
    });

    const topKey = (counts: Record<string, number>): string | null => {
      const entries = Object.entries(counts);
      if (entries.length === 0) return null;
      entries.sort((a, b) => b[1] - a[1]);
      return entries[0][0];
    };
    const topCategoryRaw = topKey(catCounts);
    const topCountry = topKey(countryCounts);
    const topRegion = topKey(regionCounts);
    const topWineTypeRaw = topKey(wineTypeCounts);

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
    else if (total < 30) badgeProgress.push({ name: 'Enthusiast', current: total, target: 30 });
    else if (total < 50) badgeProgress.push({ name: 'Expert', current: total, target: 50 });
    else if (total < 100) badgeProgress.push({ name: 'Connoisseur', current: total, target: 100 });
    else if (total < 300) badgeProgress.push({ name: 'Master', current: total, target: 300 });
    else if (total < 500) badgeProgress.push({ name: 'Grand Master', current: total, target: 500 });
    else if (total < 1000) badgeProgress.push({ name: 'Legend', current: total, target: 1000 });

    if (uniqueCountries < 3) badgeProgress.push({ name: 'Passport', current: uniqueCountries, target: 3 });
    else if (uniqueCountries < 5) badgeProgress.push({ name: 'Traveler', current: uniqueCountries, target: 5 });
    else if (uniqueCountries < 10) badgeProgress.push({ name: 'Globe Trotter', current: uniqueCountries, target: 10 });
    else if (uniqueCountries < 20) badgeProgress.push({ name: 'World Master', current: uniqueCountries, target: 20 });

    setTaste({
      categoryBreakdown,
      topCountries,
      totalBottles: total,
      badgeProgress,
      topCategory: topCategoryRaw ? (labelMap[topCategoryRaw] ?? topCategoryRaw) : null,
      topCountry,
      topRegion,
      topWineType: topWineTypeRaw ? (wineTypeLabels[topWineTypeRaw] ?? topWineTypeRaw) : null,
    });
    setLoading(false);
  }, [userId]);

  return { taste, loading, loadTaste };
}

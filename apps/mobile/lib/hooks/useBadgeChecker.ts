import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Alert } from 'react-native';

export function useBadgeChecker() {
  const { user } = useAuth();

  async function checkAndAwardBadges() {
    if (!user) return;

    // Get all badges
    const { data: allBadges } = await supabase.from('badges').select('*').eq('is_active', true);
    if (!allBadges) return;

    // Get already earned
    const { data: earned } = await supabase.from('user_badges').select('badge_id').eq('user_id', user.id);
    const earnedIds = new Set(earned?.map(e => e.badge_id) || []);

    // Get user stats
    const { data: collections } = await supabase
      .from('collections')
      .select('wine_id, wines(category, wine_type, country, region)')
      .eq('user_id', user.id);

    const { data: gatheringsHosted } = await supabase
      .from('gatherings')
      .select('id')
      .eq('host_id', user.id);

    const { data: gatheringsJoined } = await supabase
      .from('gathering_members')
      .select('gathering_id')
      .eq('user_id', user.id)
      .eq('status', 'approved');

    const totalCount = collections?.length || 0;
    const countries = new Set(collections?.map((c: any) => c.wines?.country).filter(Boolean));
    const countryCount = countries.size;

    // Count by wine_type
    const wineTypeCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    const regionCounts: Record<string, number> = {};

    collections?.forEach((c: any) => {
      const wt = c.wines?.wine_type;
      const cat = c.wines?.category;
      const reg = c.wines?.region;
      if (wt) wineTypeCounts[wt] = (wineTypeCounts[wt] || 0) + 1;
      if (cat) categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      if (reg) regionCounts[reg] = (regionCounts[reg] || 0) + 1;
    });

    const hostedCount = gatheringsHosted?.length || 0;
    const joinedCount = gatheringsJoined?.length || 0;

    // Check each badge
    const newBadges: typeof allBadges = [];

    for (const badge of allBadges) {
      if (earnedIds.has(badge.id)) continue;

      const cond = badge.condition as any;
      let met = false;

      switch (cond.type) {
        case 'collection_count':
          met = totalCount >= cond.threshold;
          break;
        case 'country_count':
          met = countryCount >= cond.threshold;
          break;
        case 'wine_type_count':
          met = (wineTypeCounts[cond.wine_type] || 0) >= cond.threshold;
          break;
        case 'category_count':
          met = (categoryCounts[cond.category] || 0) >= cond.threshold;
          break;
        case 'region_count':
          met = (regionCounts[cond.region] || 0) >= cond.threshold;
          break;
        case 'gathering_hosted':
          met = hostedCount >= cond.threshold;
          break;
        case 'gathering_joined':
          met = (hostedCount + joinedCount) >= cond.threshold;
          break;
      }

      if (met) newBadges.push(badge);
    }

    // Award new badges silently, no popup
    if (newBadges.length > 0) {
      const inserts = newBadges.map(b => ({ user_id: user.id, badge_id: b.id }));
      await supabase.from('user_badges').insert(inserts);
    }

    return newBadges;
  }

  return { checkAndAwardBadges };
}

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const tierColors: Record<number, { bg: string; border: string; color: string; label: string }> = {
  1: { bg: '#f7f0f3', border: '#7b2d4e', color: '#7b2d4e', label: 'Bronze' },
  2: { bg: '#f0f0f5', border: '#808090', color: '#808090', label: 'Silver' },
  3: { bg: '#faf0d0', border: '#a07818', color: '#a07818', label: 'Gold' },
  4: { bg: '#eef0f8', border: '#5b7fbf', color: '#5b7fbf', label: 'Platinum' },
  5: { bg: '#f0ecf8', border: '#7860a8', color: '#7860a8', label: 'Obsidian' },
};

const categoryLabels: Record<string, string> = {
  collection: 'Collection',
  region: 'Exploration',
  variety: 'Specialty',
  gathering: 'Social',
};

interface Props {
  allBadges: any[];
  earnedIds: Set<number>;
  compact?: boolean;
}

export function BadgeList({ allBadges, earnedIds, compact = false }: Props) {
  // Group by category
  const grouped: Record<string, any[]> = {};
  allBadges.forEach(b => {
    const cat = b.category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(b);
  });

  if (compact) {
    // Show only earned badges in a horizontal scroll
    const earned = allBadges.filter(b => earnedIds.has(b.id));
    if (earned.length === 0) return null;

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
        {earned.map(b => {
          const t = tierColors[b.tier] || tierColors[1];
          return (
            <View key={b.id} style={[styles.compactBadge, { backgroundColor: t.bg, borderColor: t.border }]}>
              <Text style={[styles.compactText, { color: t.color }]}>{b.name}</Text>
            </View>
          );
        })}
      </ScrollView>
    );
  }

  const earnedBadges = allBadges.filter(b => earnedIds.has(b.id));

  if (earnedBadges.length === 0) {
    return <Text style={styles.emptyText}>No badges yet</Text>;
  }

  // Keep only highest tier per condition type
  const bestByType = new Map<string, any>();
  earnedBadges.forEach(b => {
    const key = (b.condition as any).type + '_' + ((b.condition as any).wine_type || (b.condition as any).category || (b.condition as any).region || '');
    const existing = bestByType.get(key);
    if (!existing || b.tier > existing.tier || (b.tier === existing.tier && (b.condition as any).threshold > (existing.condition as any).threshold)) {
      bestByType.set(key, b);
    }
  });

  const topBadges = [...bestByType.values()];

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {topBadges.map(b => {
          const t = tierColors[b.tier] || tierColors[1];
          return (
            <View key={b.id} style={[styles.badge, { backgroundColor: t.bg, borderColor: t.border }]}>
              <Text style={[styles.badgeName, { color: t.color }]}>{b.name}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function formatCondition(cond: any): string {
  switch (cond.type) {
    case 'collection_count': return `${cond.threshold} bottles`;
    case 'country_count': return `${cond.threshold} countries`;
    case 'wine_type_count': return `${cond.threshold} ${cond.wine_type}`;
    case 'category_count': return `${cond.threshold} ${cond.category}`;
    case 'region_count': return `${cond.threshold} ${cond.region}`;
    case 'gathering_hosted': return `Host ${cond.threshold}`;
    case 'gathering_joined': return `Join ${cond.threshold}`;
    default: return '';
  }
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#999', marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    borderWidth: 1,
  },
  emptyText: { fontSize: 13, color: '#bbb', paddingHorizontal: 20 },
  badgeLocked: { backgroundColor: '#fafafa', borderColor: '#eee' },
  badgeName: { fontSize: 11, fontWeight: '600' },
  badgeDesc: { fontSize: 9, marginTop: 2 },
  lockIcon: { position: 'absolute', top: 4, right: 4, fontSize: 8 },

  compactBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1,
  },
  compactText: { fontSize: 11, fontWeight: '600' },
});

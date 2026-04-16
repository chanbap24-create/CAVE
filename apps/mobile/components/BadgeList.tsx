import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const tierColors: Record<number, { bg: string; border: string; color: string; ring: string }> = {
  1: { bg: '#f7f0f3', border: '#7b2d4e', color: '#7b2d4e', ring: '#d4a0b8' },
  2: { bg: '#f0f0f5', border: '#808090', color: '#808090', ring: '#b0b0c0' },
  3: { bg: '#faf0d0', border: '#a07818', color: '#a07818', ring: '#d4b860' },
  4: { bg: '#eef0f8', border: '#5b7fbf', color: '#5b7fbf', ring: '#88a8d8' },
  5: { bg: '#f0ecf8', border: '#7860a8', color: '#7860a8', ring: '#a890d0' },
};

// Badge icons by code prefix
function getBadgeIcon(code: string): string {
  if (code.includes('first')) return '🥂';
  if (code.includes('collector')) return '🍷';
  if (code.includes('enthusiast')) return '🔥';
  if (code.includes('expert')) return '⭐';
  if (code.includes('connoisseur')) return '👑';
  if (code.includes('master') && code.includes('grand')) return '💎';
  if (code.includes('master')) return '🏆';
  if (code.includes('legend')) return '⚡';
  if (code.includes('passport')) return '🛂';
  if (code.includes('traveler')) return '✈️';
  if (code.includes('globe')) return '🌍';
  if (code.includes('world')) return '🌏';
  if (code.includes('red')) return '🍷';
  if (code.includes('white')) return '🥂';
  if (code.includes('whisky')) return '🥃';
  if (code.includes('sake')) return '🍶';
  if (code.includes('bubble') || code.includes('champagne')) return '🫧';
  if (code.includes('bordeaux')) return '🏰';
  if (code.includes('burgundy')) return '🏔️';
  if (code.includes('napa')) return '🌉';
  if (code.includes('islay')) return '🏴';
  if (code.includes('social') || code.includes('party') || code.includes('gathering')) return '🤝';
  return '🏅';
}

interface Props {
  allBadges: any[];
  earnedIds: Set<number>;
  compact?: boolean;
}

export function BadgeList({ allBadges, earnedIds, compact = false }: Props) {
  if (compact) {
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

  const topBadges = [...bestByType.values()].sort((a, b) => b.tier - a.tier);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {topBadges.map(b => {
        const t = tierColors[b.tier] || tierColors[1];
        const icon = getBadgeIcon(b.code);
        return (
          <View key={b.id} style={styles.badgeItem}>
            <View style={[styles.badgeCircle, { borderColor: t.ring }]}>
              <View style={[styles.badgeInner, { backgroundColor: t.bg }]}>
                <Text style={styles.badgeIcon}>{icon}</Text>
              </View>
            </View>
            <Text style={[styles.badgeName, { color: t.color }]} numberOfLines={1}>{b.name}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 20, gap: 16 },

  badgeItem: { alignItems: 'center', width: 64 },
  badgeCircle: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 2, padding: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeInner: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeIcon: { fontSize: 22 },
  badgeName: { fontSize: 10, fontWeight: '600', marginTop: 4, textAlign: 'center' },

  emptyText: { fontSize: 13, color: '#bbb', paddingHorizontal: 20 },

  compactBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  compactText: { fontSize: 11, fontWeight: '600' },
});

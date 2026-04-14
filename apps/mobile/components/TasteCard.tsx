import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { TasteProfile } from '@/lib/hooks/useTasteProfile';

interface Props {
  taste: TasteProfile;
  compact?: boolean;
}

export function TasteCard({ taste, compact = false }: Props) {
  if (taste.totalBottles === 0) return null;

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Category Bars */}
      <View style={styles.barRow}>
        {taste.categoryBreakdown.map((cat, i) => (
          <View key={i} style={[styles.barSegment, { flex: cat.percentage, backgroundColor: barColors[i] || '#e0e0e0' }]} />
        ))}
      </View>
      <View style={styles.legendRow}>
        {taste.categoryBreakdown.map((cat, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: barColors[i] || '#e0e0e0' }]} />
            <Text style={styles.legendText}>{cat.label} {cat.percentage}%</Text>
          </View>
        ))}
      </View>

      {/* Top Countries */}
      {taste.topCountries.length > 0 && (
        <Text style={styles.countries}>
          {taste.topCountries.join(' · ')}
        </Text>
      )}

      {/* Badge Progress */}
      {taste.badgeProgress.length > 0 && (
        <View style={styles.progressSection}>
          {taste.badgeProgress.map((b, i) => (
            <View key={i} style={styles.progressItem}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressName}>{b.name}</Text>
                <Text style={styles.progressCount}>{b.current}/{b.target}</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${Math.min((b.current / b.target) * 100, 100)}%` }]} />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const barColors = ['#7b2d4e', '#8a6d3b', '#3b6d8a', '#8a5a3b', '#999'];

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20, marginVertical: 12,
    backgroundColor: '#fafafa', borderRadius: 12, padding: 16,
  },
  containerCompact: { marginHorizontal: 0, marginVertical: 8, padding: 12 },

  barRow: {
    flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2,
  },
  barSegment: { borderRadius: 4 },

  legendRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#666' },

  countries: {
    fontSize: 12, color: '#999', marginTop: 10, fontWeight: '500',
  },

  progressSection: { marginTop: 14, gap: 10 },
  progressItem: {},
  progressHeader: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4,
  },
  progressName: { fontSize: 12, fontWeight: '600', color: '#222' },
  progressCount: { fontSize: 11, color: '#999' },
  progressBarBg: {
    height: 6, borderRadius: 3, backgroundColor: '#efefef',
  },
  progressBarFill: {
    height: 6, borderRadius: 3, backgroundColor: '#7b2d4e',
  },
});

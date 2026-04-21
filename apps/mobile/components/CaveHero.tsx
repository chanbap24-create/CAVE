import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  bottles: number;
  /** Optional one-line taste summary. Falsy values are filtered so we
   *  don't render stray `· ·` separators. */
  summary?: (string | null | undefined)[];
}

/**
 * My Cave hero header. Kept intentionally minimal:
 *   - Big Bottles count on the left
 *   - Small one-line taste summary on the right
 *     (e.g. "Wine · France · Bordeaux · Red")
 *
 * Tier/progress bars and category percentage bars were removed per
 * product feedback — the space now signals *what* the user collects,
 * not *how far along* they are.
 */
export function CaveHero({ bottles, summary }: Props) {
  const parts = (summary ?? []).filter(Boolean) as string[];
  const hasSummary = parts.length > 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        <Text style={styles.bottles}>{bottles}</Text>
        <Text style={styles.bottlesLabel}>Bottles</Text>
      </View>

      {hasSummary ? (
        <View style={styles.right}>
          <Text style={styles.summaryLabel}>Taste</Text>
          <Text style={styles.summaryText}>{parts.join(' · ')}</Text>
        </View>
      ) : (
        <View style={styles.right}>
          <Text style={styles.summaryEmpty}>와인을 추가하면 취향이 표시됩니다.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 20,
    paddingVertical: 12, paddingHorizontal: 20,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#efefef',
    marginTop: 6,
  },
  left: { alignItems: 'center', minWidth: 72 },
  bottles: { fontSize: 32, fontWeight: '700', color: '#222', lineHeight: 36 },
  bottlesLabel: { fontSize: 11, color: '#999', marginTop: 2, fontWeight: '500' },

  right: { flex: 1 },
  summaryLabel: {
    fontSize: 10, fontWeight: '700', color: '#999',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
  },
  summaryText: { fontSize: 14, fontWeight: '600', color: '#222', lineHeight: 19 },
  summaryEmpty: { fontSize: 12, color: '#bbb' },
});

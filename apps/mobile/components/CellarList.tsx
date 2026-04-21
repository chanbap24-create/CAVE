import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { CATEGORY_LABELS } from '@/lib/constants/drinkCategories';
import type { CollectionSocial } from '@/lib/hooks/useCollectionSocial';

const labelMap = CATEGORY_LABELS;
const typeColors: Record<string, string> = {
  wine:        '#7b2d4e',
  spirit:      '#8a6d3b',
  traditional: '#3b6d8a',
  other:       '#999',
};

interface Props {
  collections: any[];
  onPressRow?: (collection: any) => void;
  onLongPressRow: (collectionId: number, hasPhoto: boolean) => void;
  /** Optional batched social counts for inline like/comment stats. */
  social?: CollectionSocial;
}

/**
 * Inline cellar list — renders rows directly (no wrapping ScrollView)
 * so the parent can place the list inside a larger ScrollView alongside
 * hero / row sections. Refresh control lives at the parent level now.
 */
export function CellarList({ collections, onPressRow, onLongPressRow, social }: Props) {
  if (collections.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Cave is empty</Text>
        <Text style={styles.emptyDesc}>Tap "+ Add" to start{'\n'}your collection</Text>
      </View>
    );
  }

  return (
    <View>
      {collections.map(c => {
        const w = c.wine;
        if (!w) return null;
        const typeColor = typeColors[w.category] || '#999';
        return (
          <Pressable
            key={c.id}
            style={styles.listItem}
            onPress={() => onPressRow?.(c)}
            onLongPress={() => onLongPressRow(c.id, !!c.photo_url)}
          >
            <View style={[styles.listDot, { backgroundColor: typeColor }]} />
            <View style={styles.listInfo}>
              <Text style={styles.listName} numberOfLines={1}>{w.name}</Text>
              <Text style={styles.listMeta}>
                {[w.region, w.country].filter(Boolean).join(', ')}
                {formatVintageSuffix(w)}
              </Text>
            </View>
            <View style={styles.listRight}>
              <Text style={[styles.listType, { color: typeColor }]}>{labelMap[w.category] || w.category}</Text>
              {w.alcohol_pct && <Text style={styles.listAlc}>{w.alcohol_pct}%</Text>}
              {social && <SocialCounts liked={social.get(c.id).liked} likes={social.get(c.id).likes} comments={social.get(c.id).comments} />}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function SocialCounts({
  liked, likes, comments,
}: { liked: boolean; likes: number; comments: number }) {
  // Zero-state is common when others haven't engaged yet; keep the row
  // visually calm by not showing counts that are both zero.
  if (likes === 0 && comments === 0) return null;
  return (
    <View style={styles.statsRow}>
      {likes > 0 && (
        <View style={styles.statItem}>
          <Svg width={12} height={12} viewBox="0 0 24 24">
            <Path
              d="M12 21s-7.5-4.35-9.5-9.5C1.3 8.3 3.5 5 7 5c2 0 3.5 1 5 3 1.5-2 3-3 5-3 3.5 0 5.7 3.3 4.5 6.5C19.5 16.65 12 21 12 21z"
              fill={liked ? '#ed4956' : 'none'}
              stroke={liked ? '#ed4956' : '#bbb'}
              strokeWidth={1.8}
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={[styles.statText, liked && { color: '#ed4956' }]}>{likes}</Text>
        </View>
      )}
      {comments > 0 && (
        <View style={styles.statItem}>
          <Svg width={12} height={12} fill="none" stroke="#bbb" strokeWidth={1.8} viewBox="0 0 24 24">
            <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </Svg>
          <Text style={styles.statText}>{comments}</Text>
        </View>
      )}
    </View>
  );
}

// "· 2015" for a vintage year, "· NV" / "· MV" for non/multi-vintage
// (stored in wines.metadata.vintage_type), empty when no vintage info.
function formatVintageSuffix(w: any): string {
  if (w?.vintage_year) return ` · ${w.vintage_year}`;
  const t = w?.metadata?.vintage_type;
  if (t === 'nv') return ' · NV';
  if (t === 'mv') return ' · MV';
  return '';
}

const styles = StyleSheet.create({
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#222', marginBottom: 6 },
  emptyDesc: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 22 },

  listItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
    gap: 12,
  },
  listDot: { width: 8, height: 8, borderRadius: 4 },
  listInfo: { flex: 1 },
  listName: { fontSize: 14, fontWeight: '600', color: '#222' },
  listMeta: { fontSize: 11, color: '#999', marginTop: 3 },
  listRight: { alignItems: 'flex-end' },
  listType: { fontSize: 11, fontWeight: '600' },
  listAlc: { fontSize: 10, color: '#bbb', marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { fontSize: 10, color: '#999', fontWeight: '500' },
});

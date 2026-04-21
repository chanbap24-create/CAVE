import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import type { Gathering } from '@/lib/hooks/useGatherings';
import { CATEGORY_TAG_STYLES, getCategoryLabel } from '@/lib/constants/drinkCategories';
import { getGatheringTypeLabel } from '@/lib/types/gathering';
import { formatDate } from '@/lib/utils/dateUtils';
import { WineThumbStrip } from './WineThumbStrip';

interface Props {
  gathering: Gathering;
  onPress: () => void;
}

/**
 * Dense list variant of GatheringCard. Fits ~6–8 rows per screen vs the
 * full card's 3. Shows:
 *   - Host avatar (small, left)
 *   - Title with [Type] prefix + tiny category pill
 *   - Meta line: date · location · members
 *   - Wine strip (right, smaller)
 *
 * Used when the gatherings list grows past a few entries and the user
 * needs to scan rather than browse.
 */
export function GatheringCompactRow({ gathering: g, onPress }: Props) {
  const host = g.host;
  const hostInitial = host?.display_name?.[0]?.toUpperCase() || host?.username?.[0]?.toUpperCase() || '?';
  const typeLabel = getGatheringTypeLabel(g.gathering_type);
  const memberCount = g.current_members + 1; // include host
  const isClosed = g.status === 'closed' || g.status === 'completed' || memberCount >= g.max_members;

  const tag = g.category ? CATEGORY_TAG_STYLES[g.category] ?? CATEGORY_TAG_STYLES.other : null;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed, isClosed && styles.rowClosed]}
      onPress={onPress}
      disabled={isClosed}
    >
      {host?.avatar_url ? (
        <Image
          source={host.avatar_url}
          style={styles.avatar}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarText}>{hostInitial}</Text>
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {typeLabel ? <Text style={styles.typePrefix}>[{typeLabel}] </Text> : null}
            {g.title}
          </Text>
          {tag && (
            <View style={[styles.catBadge, { backgroundColor: tag.bg }]}>
              <Text style={[styles.catBadgeText, { color: tag.color }]}>{getCategoryLabel(g.category!)}</Text>
            </View>
          )}
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          {formatDate(g.gathering_date)}
          {g.location ? ` · ${g.location}` : ''}
          {` · ${memberCount}/${g.max_members}`}
          {isClosed ? ' (Closed)' : ''}
        </Text>
      </View>

      {g.wine_total > 0 && (
        <WineThumbStrip wines={g.wine_previews} total={g.wine_total} size={30} compactOverflow />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  rowPressed: { backgroundColor: '#fafafa' },
  rowClosed: { opacity: 0.55 },

  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f0f0' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '700', color: '#888' },

  body: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { flex: 1, fontSize: 14, fontWeight: '600', color: '#222' },
  typePrefix: { color: '#7b2d4e', fontWeight: '700' },
  catBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  catBadgeText: { fontSize: 10, fontWeight: '600' },
  meta: { fontSize: 11, color: '#999', marginTop: 3 },
});

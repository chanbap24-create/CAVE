import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useCellarLike } from '@/lib/hooks/useCellarLike';
import { useCollectionLike } from '@/lib/hooks/useCollectionLike';
import { LikeButton } from '@/components/LikeButton';

interface Props {
  ownerId: string;
  wines: any[]; // public collection rows, already filtered server-side
}

/**
 * Read-only cellar view used on another user's profile. Surfaces a whole-
 * cellar ♥ in the section header and a per-bottle ♥ on each row so viewers
 * can engage without navigating away.
 *
 * Self-view still renders, but the cellar heart's toggle will no-op server-
 * side because `cellar_likes` enforces `owner_id <> user_id` via CHECK.
 */
export function UserCellarSection({ ownerId, wines }: Props) {
  const cellarLike = useCellarLike(ownerId);
  if (wines.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Cave ({wines.length})</Text>
        <LikeButton
          liked={cellarLike.liked}
          count={cellarLike.count}
          busy={cellarLike.busy}
          onPress={cellarLike.toggle}
          size="section"
        />
      </View>
      {wines.map(c => <WineLikeRow key={c.id} c={c} />)}
    </View>
  );
}

function WineLikeRow({ c }: { c: any }) {
  const { liked, count, busy, toggle } = useCollectionLike(c.id);
  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{c.wine?.name}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {[c.wine?.region, c.wine?.category].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <LikeButton liked={liked} count={count} busy={busy} onPress={toggle} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 20, paddingTop: 8 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: { fontSize: 15, fontWeight: '600', color: '#222' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '500', color: '#222' },
  meta: { fontSize: 11, color: '#999', marginTop: 2 },
});

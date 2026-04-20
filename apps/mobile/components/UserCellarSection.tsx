import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useCellarLike } from '@/lib/hooks/useCellarLike';
import { useCollectionLike } from '@/lib/hooks/useCollectionLike';
import { useCellarComments } from '@/lib/hooks/useCellarComments';
import { useCollectionComments } from '@/lib/hooks/useCollectionComments';
import { LikeButton, SocialStatsRow } from '@/components/LikeButton';
import { CommentButton } from '@/components/CommentButton';
import { CommentsSheet } from '@/components/CommentsSheet';

interface Props {
  ownerId: string;
  wines: any[]; // public collection rows, already filtered server-side
}

/**
 * Read-only cellar view for another user's profile. Shows whole-cellar
 * ♥ + 💬 in the section header and per-bottle ♥ + 💬 on each row. Tapping
 * a 💬 opens the shared CommentsSheet bound to that level.
 */
export function UserCellarSection({ ownerId, wines }: Props) {
  const cellarLike = useCellarLike(ownerId);
  const cellarComments = useCellarComments(ownerId);
  const [cellarSheet, setCellarSheet] = useState(false);

  if (wines.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Cave ({wines.length})</Text>
        <SocialStatsRow>
          <LikeButton
            liked={cellarLike.liked}
            count={cellarLike.count}
            busy={cellarLike.busy}
            onPress={cellarLike.toggle}
            size="section"
          />
          <CommentButton
            count={cellarComments.count}
            onPress={() => setCellarSheet(true)}
            size="section"
          />
        </SocialStatsRow>
      </View>

      {wines.map(c => <WineRow key={c.id} c={c} />)}

      <CommentsSheet
        visible={cellarSheet}
        onClose={() => setCellarSheet(false)}
        title="Comments on this cellar"
        comments={cellarComments.comments}
        loading={cellarComments.loading}
        onAdd={cellarComments.add}
        onDelete={cellarComments.remove}
      />
    </View>
  );
}

function WineRow({ c }: { c: any }) {
  const like = useCollectionLike(c.id);
  const comments = useCollectionComments(c.id);
  const [sheet, setSheet] = useState(false);

  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{c.wine?.name}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {[c.wine?.region, c.wine?.category].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <SocialStatsRow>
        <LikeButton liked={like.liked} count={like.count} busy={like.busy} onPress={like.toggle} />
        <CommentButton count={comments.count} onPress={() => setSheet(true)} />
      </SocialStatsRow>
      <CommentsSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        title={c.wine?.name ?? 'Comments'}
        comments={comments.comments}
        loading={comments.loading}
        onAdd={comments.add}
        onDelete={comments.remove}
      />
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

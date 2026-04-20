import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useCellarLike } from '@/lib/hooks/useCellarLike';
import { useCellarComments } from '@/lib/hooks/useCellarComments';
import { useCollectionComments } from '@/lib/hooks/useCollectionComments';
import { useCollectionSocial } from '@/lib/hooks/useCollectionSocial';
import { LikeButton, SocialStatsRow } from '@/components/LikeButton';
import { CommentButton } from '@/components/CommentButton';
import { CommentsSheet } from '@/components/CommentsSheet';

interface Props {
  ownerId: string;
  wines: any[]; // public collection rows, already filtered server-side
}

/**
 * Read-only cellar view for another user's profile.
 *
 * Performance: this used to mount one useCollectionLike + one
 * useCollectionComments per wine row, which fanned out to ~4N queries on
 * a 20-bottle cellar. useCollectionSocial batches the counts into exactly
 * 3 queries for the whole list, regardless of size. The comments *list* is
 * still fetched lazily when a specific sheet opens (useCollectionComments
 * inside CommentsSheetForWine) so we don't pay for threads nobody reads.
 */
export function UserCellarSection({ ownerId, wines }: Props) {
  const cellarLike = useCellarLike(ownerId);
  const cellarComments = useCellarComments(ownerId);
  const [cellarSheet, setCellarSheet] = useState(false);
  const [activeCommentWine, setActiveCommentWine] = useState<any>(null);

  const collectionIds = useMemo(() => wines.map(w => w.id), [wines]);
  const social = useCollectionSocial(collectionIds);

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

      {wines.map(c => {
        const stats = social.get(c.id);
        return (
          <View key={c.id} style={styles.row}>
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>{c.wine?.name}</Text>
              <Text style={styles.meta} numberOfLines={1}>
                {[c.wine?.region, c.wine?.category].filter(Boolean).join(' · ')}
              </Text>
            </View>
            <SocialStatsRow>
              <LikeButton
                liked={stats.liked}
                count={stats.likes}
                onPress={() => social.toggleLike(c.id)}
              />
              <CommentButton
                count={stats.comments}
                onPress={() => setActiveCommentWine(c)}
              />
            </SocialStatsRow>
          </View>
        );
      })}

      <CommentsSheet
        visible={cellarSheet}
        onClose={() => setCellarSheet(false)}
        title="Comments on this cellar"
        comments={cellarComments.comments}
        loading={cellarComments.loading}
        onAdd={cellarComments.add}
        onDelete={cellarComments.remove}
      />

      {activeCommentWine && (
        <CommentsSheetForWine
          wine={activeCommentWine}
          onClose={() => {
            setActiveCommentWine(null);
            social.refresh(); // pick up any newly-added comments into the count
          }}
        />
      )}
    </View>
  );
}

// Sheet variant that owns its own comments hook — mounted only when the
// user opens a specific bottle's thread, so we don't load N full comment
// lists upfront.
function CommentsSheetForWine({
  wine,
  onClose,
}: {
  wine: any;
  onClose: () => void;
}) {
  const c = useCollectionComments(wine.id);
  return (
    <CommentsSheet
      visible={true}
      onClose={onClose}
      title={wine.wine?.name ?? 'Comments'}
      comments={c.comments}
      loading={c.loading}
      onAdd={c.add}
      onDelete={c.remove}
    />
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

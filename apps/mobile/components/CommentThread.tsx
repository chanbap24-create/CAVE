import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { timeAgo } from '@/lib/utils/dateUtils';
import type { Comment } from '@/lib/hooks/useCommentsTarget';

interface Props {
  comments: Comment[];
  loading: boolean;
  /** Only comments authored by this id get a long-press delete affordance. */
  currentUserId: string | null | undefined;
  onDelete: (commentId: number) => void;
  emptyText?: string;
}

/**
 * Vertical comment list. Pulled out of CollectionDetailSheet so the
 * rendering can be reused (e.g. future post detail page) and the
 * detail-sheet orchestrator stays under the 200-line budget.
 */
export function CommentThread({
  comments, loading, currentUserId, onDelete, emptyText = '첫 댓글의 주인공이 되어보세요.',
}: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Comments ({comments.length})</Text>
      {loading && comments.length === 0 ? (
        <Text style={styles.empty}>Loading…</Text>
      ) : comments.length === 0 ? (
        <Text style={styles.empty}>{emptyText}</Text>
      ) : (
        comments.map(c => (
          <Pressable
            key={c.id}
            style={styles.row}
            onLongPress={() => c.user_id === currentUserId && onDelete(c.id)}
          >
            {c.profile?.avatar_url ? (
              <Image source={c.profile.avatar_url} style={styles.avatar} contentFit="cover" cachePolicy="memory-disk" />
            ) : (
              <View style={[styles.avatar, { backgroundColor: '#e0e0e0' }]} />
            )}
            <View style={styles.bubble}>
              <Text style={styles.name}>
                {c.profile?.display_name || c.profile?.username || 'Someone'}
                <Text style={styles.time}>  ·  {timeAgo(c.created_at)}</Text>
              </Text>
              <Text style={styles.body}>{c.body}</Text>
            </View>
          </Pressable>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 16, paddingTop: 14 },
  heading: { fontSize: 13, fontWeight: '700', color: '#222', marginBottom: 10 },
  empty: { textAlign: 'center', color: '#bbb', paddingVertical: 24, fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  bubble: { flex: 1, backgroundColor: '#f7f7f7', padding: 10, borderRadius: 12 },
  name: { fontSize: 12, fontWeight: '600', color: '#222' },
  time: { fontWeight: '400', color: '#999' },
  body: { fontSize: 14, color: '#222', marginTop: 3, lineHeight: 19 },
});

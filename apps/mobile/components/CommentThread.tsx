import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { timeAgo } from '@/lib/utils/dateUtils';
import type { Comment } from '@/lib/hooks/useCommentsTarget';

interface Props {
  comments: Comment[];
  loading: boolean;
  currentUserId: string | null | undefined;
  onDelete: (commentId: number) => void;
  /** If provided, enables the Reply button + passes the parent target. */
  onReply?: (parent: { id: number; username: string | null }) => void;
  /** Avatar tap → typically opens the commenter's cellar sheet. */
  onAvatarPress?: (userId: string) => void;
  emptyText?: string;
}

/**
 * Vertical comment list with 1-level threaded replies. Each top-level
 * comment shows its replies indented below it; a "Reply" affordance
 * lets the parent screen capture the target for the input row.
 */
export function CommentThread({
  comments, loading, currentUserId, onDelete, onReply, onAvatarPress,
  emptyText = '첫 댓글의 주인공이 되어보세요.',
}: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Comments ({totalCount(comments)})</Text>
      {loading && comments.length === 0 ? (
        <Text style={styles.empty}>Loading…</Text>
      ) : comments.length === 0 ? (
        <Text style={styles.empty}>{emptyText}</Text>
      ) : (
        comments.map(c => (
          <View key={c.id}>
            <CommentRow
              comment={c}
              currentUserId={currentUserId}
              onDelete={onDelete}
              onReply={onReply}
              onAvatarPress={onAvatarPress}
            />
            {(c.replies ?? []).map(r => (
              <CommentRow
                key={r.id}
                comment={r}
                currentUserId={currentUserId}
                onDelete={onDelete}
                onReply={onReply}
                onAvatarPress={onAvatarPress}
                indented
              />
            ))}
          </View>
        ))
      )}
    </View>
  );
}

function totalCount(comments: Comment[]): number {
  return comments.reduce((sum, c) => sum + 1 + (c.replies?.length ?? 0), 0);
}

function CommentRow({
  comment: c, currentUserId, onDelete, onReply, onAvatarPress, indented,
}: {
  comment: Comment;
  currentUserId: string | null | undefined;
  onDelete: (id: number) => void;
  onReply?: (parent: { id: number; username: string | null }) => void;
  onAvatarPress?: (userId: string) => void;
  indented?: boolean;
}) {
  return (
    <Pressable
      style={[styles.row, indented && styles.rowIndented]}
      onLongPress={() => c.user_id === currentUserId && onDelete(c.id)}
    >
      {/* Avatar has its own tap handler (opens the commenter's cellar)
          so it doesn't trigger the row's long-press delete handler. */}
      <Pressable
        hitSlop={4}
        onPress={() => onAvatarPress?.(c.user_id)}
        disabled={!onAvatarPress}
      >
        {c.profile?.avatar_url ? (
          <Image source={c.profile.avatar_url} style={styles.avatar} contentFit="cover" cachePolicy="memory-disk" />
        ) : (
          <View style={[styles.avatar, { backgroundColor: '#e0e0e0' }]} />
        )}
      </Pressable>
      <View style={styles.bubble}>
        <View style={styles.bubbleHeader}>
          <Text style={styles.name} numberOfLines={1}>
            {c.profile?.display_name || c.profile?.username || 'Someone'}
            <Text style={styles.time}>  ·  {timeAgo(c.created_at)}</Text>
          </Text>
          {onReply && !indented && (
            <Pressable
              hitSlop={6}
              onPress={() => onReply({ id: c.id, username: c.profile?.username ?? null })}
            >
              <Text style={styles.replyBtn}>Reply</Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.body}>{c.body}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 16, paddingTop: 14 },
  heading: { fontSize: 13, fontWeight: '700', color: '#222', marginBottom: 10 },
  empty: { textAlign: 'center', color: '#bbb', paddingVertical: 24, fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
  rowIndented: { marginLeft: 36 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  bubble: { flex: 1, backgroundColor: '#f7f7f7', padding: 10, borderRadius: 12 },
  bubbleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, fontSize: 12, fontWeight: '600', color: '#222' },
  time: { fontWeight: '400', color: '#999' },
  body: { fontSize: 14, color: '#222', marginTop: 3, lineHeight: 19 },
  replyBtn: { fontSize: 11, fontWeight: '600', color: '#7b2d4e' },
});

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { timeAgo } from '@/lib/utils/dateUtils';
import type { TopComment } from '@/lib/hooks/useWineCatalog';

interface Props {
  comments: TopComment[];
}

/**
 * 와인 카탈로그 페이지의 "대표 댓글" — 좋아요 상위 3개 (>= 1 like).
 * 데이터 0개면 섹션 자체 숨김.
 */
export function TopComments({ comments }: Props) {
  const router = useRouter();
  if (comments.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>대표 댓글</Text>
      {comments.map(c => (
        <View key={c.id} style={styles.row}>
          <Pressable onPress={() => router.push(`/user/${c.user_id}`)}>
            {c.avatar_url ? (
              <Image source={c.avatar_url} style={styles.avatar} contentFit="cover" cachePolicy="memory-disk" />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]} />
            )}
          </Pressable>
          <View style={styles.bubble}>
            <View style={styles.headerRow}>
              <Text style={styles.name}>
                {c.display_name || c.username || '익명'}
              </Text>
              <Text style={styles.likeBadge}>♥ {c.like_count}</Text>
            </View>
            <Text style={styles.body}>{c.body}</Text>
            <Text style={styles.time}>{timeAgo(c.created_at)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  heading: {
    fontSize: 13, fontWeight: '700', color: '#222',
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  avatarPlaceholder: { backgroundColor: '#e0e0e0' },
  bubble: { flex: 1, backgroundColor: '#fafafa', padding: 10, borderRadius: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 12, fontWeight: '700', color: '#222' },
  likeBadge: { fontSize: 11, color: '#ed4956', fontWeight: '700' },
  body: { fontSize: 13, color: '#333', lineHeight: 18 },
  time: { fontSize: 10, color: '#bbb', marginTop: 6 },
});

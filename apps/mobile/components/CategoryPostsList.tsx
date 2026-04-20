import React from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { PostCard } from '@/components/PostCard';

const LIMIT = 20;

interface Props {
  posts: any[] | null;
  loading: boolean;
  categoryLabel: string; // e.g., "Wine", "Whisky" — for empty copy
  refreshing: boolean;
  onRefresh: () => void;
}

/**
 * Discover-tab list for category mode. Renders PostCard rows from
 * usePostsByCategory + an empty / loading state. Kept outside explore.tsx
 * so the screen file stays under the 200-line cap.
 */
export function CategoryPostsList({ posts, loading, categoryLabel, refreshing, onRefresh }: Props) {
  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7b2d4e" />}
      keyboardShouldPersistTaps="handled"
    >
      {posts === null || loading ? (
        <Text style={styles.count}>Loading...</Text>
      ) : posts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No {categoryLabel.toLowerCase()} posts yet</Text>
        </View>
      ) : (
        <>
          <Text style={styles.count}>
            {posts.length >= LIMIT ? `Showing top ${LIMIT}` : `${posts.length} post${posts.length > 1 ? 's' : ''}`}
          </Text>
          {posts.map(post => <PostCard key={post.id} post={post} />)}
        </>
      )}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  count: { fontSize: 12, color: '#bbb', paddingHorizontal: 16, paddingVertical: 8 },
  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#bbb' },
});

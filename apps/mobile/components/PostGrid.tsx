import React from 'react';
import { View, Image, StyleSheet, Pressable, Text, Dimensions } from 'react-native';
import type { MyPost } from '@/lib/hooks/useMyPosts';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 4) / 3;

interface Props {
  posts: MyPost[];
  onPress?: (post: MyPost) => void;
  onLongPress?: (post: MyPost) => void;
}

export function PostGrid({ posts, onPress, onLongPress }: Props) {
  if (posts.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No posts yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {posts.map(post => (
        <Pressable
          key={post.id}
          style={styles.item}
          onPress={() => onPress?.(post)}
          onLongPress={() => onLongPress?.(post)}
        >
          {post.image_url ? (
            <Image source={{ uri: post.image_url }} style={styles.image} />
          ) : (
            <View style={[styles.image, { backgroundColor: '#f0f0f0' }]} />
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 2,
    borderTopWidth: 1, borderTopColor: '#efefef',
  },
  item: { width: ITEM_SIZE, height: ITEM_SIZE },
  image: { width: '100%', height: '100%' },
  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#bbb' },
});

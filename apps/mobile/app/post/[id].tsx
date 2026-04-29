import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { PostCard } from '@/components/PostCard';
import { ScreenHeader, BackButton } from '@/components/ScreenHeader';
import { EditCategorySheet } from '@/components/EditCategorySheet';
import { useDrinkCategories } from '@/lib/hooks/useDrinkCategories';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [showEditCategory, setShowEditCategory] = useState(false);
  const { byKey } = useDrinkCategories();

  useEffect(() => {
    if (id) loadPost();
  }, [id]);

  async function loadPost() {
    const { data: fullPost } = await supabase.from('posts').select('*').eq('id', id).single();
    if (!fullPost) return;

    const [imgRes, profileRes, wineRes] = await Promise.all([
      supabase.from('post_images').select('image_url').eq('post_id', fullPost.id).limit(1),
      supabase.from('profiles').select('username, display_name, avatar_url').eq('id', fullPost.user_id).single(),
      supabase.from('post_wines').select('wine_id').eq('post_id', fullPost.id).limit(1),
    ]);

    let wine = null;
    if (wineRes.data?.[0]) {
      const { data: w } = await supabase.from('wines').select('id, name, category').eq('id', wineRes.data[0].wine_id).single();
      wine = w;
    }

    setPost({
      ...fullPost,
      image_url: imgRes.data?.[0]?.image_url || null,
      profile: profileRes.data,
      wine,
    });
  }

  const isOwner = !!(user && post && user.id === post.user_id);
  const catMeta = byKey(post?.category);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Post" left={<BackButton fallbackPath="/(tabs)/explore" />} />
      <ScrollView>
        {post && <PostCard post={post} />}

        {/* Owner-only: category row with edit affordance */}
        {post && isOwner && (
          <Pressable
            style={styles.categoryRow}
            onPress={() => setShowEditCategory(true)}
          >
            <Text style={styles.categoryLabel}>Category</Text>
            {catMeta ? (
              <View
                style={[
                  styles.categoryChip,
                  { backgroundColor: catMeta.bg_color ?? '#f0f0f0' },
                ]}
              >
                <Text style={[styles.categoryChipText, { color: catMeta.text_color ?? '#666' }]}>
                  {catMeta.label}
                </Text>
              </View>
            ) : (
              <Text style={styles.categoryPlaceholder}>Not set — tap to choose</Text>
            )}
            <Text style={styles.editHint}>Edit</Text>
          </Pressable>
        )}
      </ScrollView>

      {post && (
        <EditCategorySheet
          visible={showEditCategory}
          postId={post.id}
          initialCategory={post.category ?? null}
          onClose={() => setShowEditCategory(false)}
          onSaved={(cat) => setPost((p: any) => ({ ...p, category: cat }))}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  categoryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: '#f5f5f5',
  },
  categoryLabel: { fontSize: 13, color: '#999' },
  categoryChip: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  categoryChipText: { fontSize: 12, fontWeight: '600' },
  categoryPlaceholder: { fontSize: 13, color: '#bbb', fontStyle: 'italic', flex: 1 },
  editHint: { fontSize: 12, color: '#7b2d4e', fontWeight: '600', marginLeft: 'auto' },
});

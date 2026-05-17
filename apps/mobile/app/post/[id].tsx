import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { PostCard } from '@/components/PostCard';
import { ScreenHeader, BackButton } from '@/components/ScreenHeader';
import { EditCategorySheet } from '@/components/EditCategorySheet';
import { Body, Caption } from '@/components/Typography';
import { colors, spacing, borderRadius, fontFamily } from '@/constants/theme';
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
      <ScreenHeader title="" left={<BackButton fallbackPath="/(tabs)/explore" />} />
      <ScrollView>
        {post && <PostCard post={post} />}

        {/* Owner-only: category row with edit affordance */}
        {post && isOwner && (
          <Pressable
            style={styles.categoryRow}
            onPress={() => setShowEditCategory(true)}
          >
            <Caption tone="muted">카테고리</Caption>
            {catMeta ? (
              <View
                style={[
                  styles.categoryChip,
                  { backgroundColor: catMeta.bg_color ?? colors.surfaceLight },
                ]}
              >
                <Caption style={[styles.categoryChipText, { color: catMeta.text_color ?? colors.textSecondary }]}>
                  {catMeta.label}
                </Caption>
              </View>
            ) : (
              <Body tone="muted" style={styles.categoryPlaceholder}>미설정 — 탭하여 선택</Body>
            )}
            <Caption tone="primary" style={styles.editHint}>편집</Caption>
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
  container: { flex: 1, backgroundColor: colors.background },
  categoryRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.base,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  categoryChip: {
    paddingHorizontal: spacing.base, paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  categoryChipText: { fontFamily: fontFamily.semibold },
  categoryPlaceholder: { fontStyle: 'italic', flex: 1 },
  editHint: { fontFamily: fontFamily.semibold, marginLeft: 'auto' },
});

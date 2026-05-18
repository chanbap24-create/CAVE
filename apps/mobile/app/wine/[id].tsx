import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useWineMemory } from '@/lib/hooks/useWineMemory';
import { useCollectionLike } from '@/lib/hooks/useCollectionLike';
import { useCollectionComments } from '@/lib/hooks/useCollectionComments';
import { useCollectionPhotos } from '@/lib/hooks/useCollectionPhotos';
import { ScreenHeader, BackButton } from '@/components/ScreenHeader';
import { HeartIcon, CommentBubbleIcon } from '@/components/icons/PostIcons';
import { TastingNoteEditor } from '@/components/TastingNoteEditor';
import { PhotoPager, type PhotoPagerSlide } from '@/components/PhotoPager';
import { WineCommentSheet } from '@/components/WineCommentSheet';
import { UserAvatar } from '@/components/UserAvatar';
import { H2, Body, BodyBold, Caption, Eyebrow } from '@/components/Typography';
import { colors, spacing, borderRadius } from '@/constants/theme';

/**
 * Full page for a single cellar bottle.
 * 메인 사진 + 메모리 캐러셀 + 와인 정보 + 별점/맛 프로파일 + 노트 + 댓글 시트.
 */
export default function WineDetailScreen() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const collectionId = id ? parseInt(id, 10) : null;

  // 출처별 명시 fallback. canGoBack=true 면 router.back() 이 우선이라
  // 이건 deep link / RN tab+stack 회귀 케이스에 한 번 더 안전망.
  const backOnPress =
    from === 'reviews' ? () => router.replace('/(tabs)/reviews' as any) :
    from === 'profile' ? () => router.replace('/(tabs)/profile' as any) :
    from === 'explore' ? () => router.replace('/(tabs)/explore' as any) :
    undefined;
  const backFallback = from === 'reviews' ? '/(tabs)/reviews' : '/(tabs)/profile';
  const { data, loading, isOwner, saveTastingNote } = useWineMemory(collectionId);

  const { count: likeCount, liked, busy: likeBusy, toggle } = useCollectionLike(collectionId);
  const { comments, loading: commentsLoading, add, remove } = useCollectionComments(collectionId);
  const {
    photos: memoryPhotos, uploading: photoUploading, videoProgress,
    pickAndUpload, remove: removePhoto,
  } = useCollectionPhotos(collectionId);

  const [carouselIndex, setCarouselIndex] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);

  // 본인 셀러에 같은 와인이 몇 병 등록돼 있는지. 다른 사용자 화면(=isOwner false)에는 표시 X.
  const [bottleCount, setBottleCount] = useState<number | null>(null);
  useEffect(() => {
    const wineId = data?.wine?.id;
    if (!user || !wineId || !isOwner) {
      setBottleCount(null);
      return;
    }
    let active = true;
    (async () => {
      const { count } = await supabase
        .from('collections')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('wine_id', wineId);
      if (active) setBottleCount(count ?? 0);
    })();
    return () => { active = false; };
  }, [user?.id, data?.wine?.id, isOwner]);

  // Cover (wine 메인 사진) 가 슬라이드 0, memory 가 슬라이드 1..N.
  // 메인 사진이 없으면 카루셀에서도 빠짐 — memory 만으로도 페이저 가능.
  const slides = useMemo<PhotoPagerSlide[]>(() => {
    if (!data) return [];
    const cover = data.photo_url ?? data.wine?.image_url ?? null;
    const arr: PhotoPagerSlide[] = [];
    if (cover) arr.push({ id: 'cover', uri: cover });
    for (const p of memoryPhotos) {
      arr.push({
        id: p.id,
        uri: p.photo_url,
        videoPlaybackId: p.video_playback_id,
      });
    }
    return arr;
  }, [data, memoryPhotos]);

  function handleSlideLongPress(slide: PhotoPagerSlide) {
    // cover 슬라이드는 collections.photo_url 이라 여기서 삭제 X.
    // memory 슬라이드(id = number) 만 삭제 가능.
    if (typeof slide.id !== 'number' || !isOwner) return;
    Alert.alert('이 항목을 삭제할까요?', undefined, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          const ok = await removePhoto(slide.id as number);
          if (ok && carouselIndex >= slides.length - 1) {
            setCarouselIndex(Math.max(0, slides.length - 2));
          }
        },
      },
    ]);
  }

  function confirmDelete(commentId: number) {
    Alert.alert('Delete comment?', undefined, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => remove(commentId) },
    ]);
  }

  if (loading && !data) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="" left={<BackButton fallbackPath={backFallback} onPress={backOnPress} />} />
        <Caption tone="muted" style={styles.loading}>불러오는 중…</Caption>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="" left={<BackButton fallbackPath={backFallback} onPress={backOnPress} />} />
        <Caption tone="muted" style={styles.loading}>와인을 찾을 수 없습니다.</Caption>
      </View>
    );
  }

  const locale = [data.wine?.region, data.wine?.country].filter(Boolean).join(', ');

  return (
    <View style={styles.container}>
      <ScreenHeader
        title=""
        left={<BackButton fallbackPath={backFallback} onPress={backOnPress} />}
        right={isOwner ? (
          <Pressable
            onPress={pickAndUpload}
            disabled={photoUploading}
            hitSlop={8}
            style={styles.addBtn}
          >
            {photoUploading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.addBtnText}>＋</Text>
            )}
          </Pressable>
        ) : undefined}
      />

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
        {/* 작성자 헤더 — 누가 쓴 글인지 즉시 보이게. 탭하면 사용자 프로필.
            본인 글일 때도 일관성 위해 노출 ("이건 내 컬렉션" 인지). */}
        <Pressable
          style={styles.ownerRow}
          onPress={() => router.push(`/user/${data.user_id}` as any)}
          hitSlop={4}
        >
          <UserAvatar
            uri={data.owner?.avatar_url ?? undefined}
            fallbackChar={(data.owner?.display_name ?? data.owner?.username ?? '?')[0]?.toUpperCase()}
            size="sm"
          />
          <View style={styles.ownerText}>
            <BodyBold tone="warm" numberOfLines={1}>
              {data.owner?.display_name || data.owner?.username || '익명'}
            </BodyBold>
            {data.owner?.username && data.owner?.display_name ? (
              <Caption tone="warmMuted" numberOfLines={1}>@{data.owner.username}</Caption>
            ) : null}
          </View>
        </Pressable>

        {/* Cover photo + memory carousel — 메인 사진 뒤로 사진/비디오를
            슬라이드. 헤더 우상단의 "+" 버튼으로 추가, 메모리 슬라이드를
            길게 누르면 삭제. cover 슬라이드는 collections.photo_url 이라
            여기서 삭제 X. */}
        {slides.length > 0 ? (
          <PhotoPager
            slides={slides}
            index={carouselIndex}
            onIndexChange={setCarouselIndex}
            onSlideLongPress={handleSlideLongPress}
          />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]} />
        )}
        {/* 비디오 업로드 진행률 — 헤더 + 버튼이 spinner 만 보여서 % 는 여기서. */}
        {photoUploading && videoProgress != null && videoProgress > 0 && (
          <Text style={styles.uploadProgress}>업로드 {Math.floor(videoProgress)}%</Text>
        )}

        {/* Wine identity — Eyebrow producer + 큰 sans bold name + meta */}
        <View style={styles.identity}>
          {data.wine?.producer ? <Eyebrow tone="primary" style={styles.producer}>{data.wine.producer}</Eyebrow> : null}
          <H2 tone="warm" style={styles.wineName}>{data.wine?.name ?? 'Unknown wine'}</H2>
          {data.wine?.name_ko ? <Body tone="warmMuted" style={styles.nameKo}>{data.wine.name_ko}</Body> : null}
          <Caption tone="muted" style={styles.meta}>
            {locale || 'Region unknown'}
            {data.wine?.vintage_year ? ` · ${data.wine.vintage_year}` : ''}
          </Caption>
          {bottleCount != null && bottleCount > 0 && (
            <BodyBold tone="warm" style={styles.bottleCount}>
              {bottleCount} {bottleCount === 1 ? 'Bottle' : 'Bottles'}
            </BodyBold>
          )}
        </View>

        {/* Action icons — heart toggles like, bubble opens comment sheet. */}
        <View style={styles.actionBar}>
          <Pressable onPress={toggle} disabled={likeBusy} hitSlop={6}>
            <HeartIcon filled={liked} />
          </Pressable>
          <Pressable onPress={() => setCommentsOpen(true)} hitSlop={6}>
            <CommentBubbleIcon />
          </Pressable>
          <View style={{ flex: 1 }} />
        </View>
        {(likeCount > 0 || comments.length > 0) && (
          <View style={styles.countsRow}>
            {likeCount > 0 && (
              <BodyBold tone="warm">{likeCount} likes</BodyBold>
            )}
            {comments.length > 0 && (
              <Pressable onPress={() => setCommentsOpen(true)} hitSlop={4}>
                <BodyBold tone="warm">{comments.length} comments</BodyBold>
              </Pressable>
            )}
          </View>
        )}

        {/* Note. 댓글은 시트로 분리 — 본 화면엔 thread/input 없음. */}
        <TastingNoteEditor
          initialNote={data.tasting_note}
          initialRating={data.rating}
          initialProfile={data.taste_profile}
          updatedAt={data.tasting_note_updated_at}
          editable={isOwner}
          onSave={saveTastingNote}
        />
      </ScrollView>

      <WineCommentSheet
        visible={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        comments={comments}
        loading={commentsLoading}
        currentUserId={user?.id}
        onSend={add}
        onDelete={confirmDelete}
        onAvatarPress={(uid) => router.push(`/user/${uid}`)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { textAlign: 'center', padding: spacing.xl },
  scroll: { paddingBottom: spacing.lg },

  cover: { width: '100%', aspectRatio: 1, backgroundColor: colors.surfaceLight },
  coverPlaceholder: { backgroundColor: colors.surface },
  uploadProgress: { fontSize: 11, color: colors.primary, textAlign: 'center', paddingVertical: 6 },

  ownerRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.base,
    paddingHorizontal: spacing.md, paddingVertical: spacing.base,
    borderBottomWidth: 1, borderBottomColor: colors.borderStrong,
    backgroundColor: colors.cream,
  },
  ownerText: { flex: 1 },

  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: {
    fontSize: 26, color: colors.primary, fontWeight: '300',
    lineHeight: 30, marginTop: -2,
  },

  identity: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  producer: { letterSpacing: 1.5, marginBottom: spacing.xs },
  wineName: { fontSize: 22, lineHeight: 28, letterSpacing: -0.3 },
  nameKo: { marginTop: spacing.xs },
  meta: { marginTop: spacing.sm },
  bottleCount: { marginTop: spacing.sm, fontSize: 14 },

  actionBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.base,
    paddingHorizontal: spacing.md, paddingTop: spacing.base, paddingBottom: spacing.xs,
  },
  countsRow: {
    flexDirection: 'row', gap: spacing.base,
    paddingHorizontal: spacing.md, paddingBottom: spacing.base,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
});

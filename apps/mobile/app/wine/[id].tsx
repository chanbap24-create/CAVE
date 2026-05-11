import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useWineMemory } from '@/lib/hooks/useWineMemory';
import { useCollectionLike } from '@/lib/hooks/useCollectionLike';
import { useCollectionComments } from '@/lib/hooks/useCollectionComments';
import { useCollectionPhotos } from '@/lib/hooks/useCollectionPhotos';
import { ScreenHeader, BackButton } from '@/components/ScreenHeader';
import { HeartIcon, CommentBubbleIcon } from '@/components/icons/PostIcons';
import { TastingNoteEditor } from '@/components/TastingNoteEditor';
import { PhotoPager, type PhotoPagerSlide } from '@/components/PhotoPager';
import { WineCommentSheet } from '@/components/WineCommentSheet';

/**
 * Full page for a single cellar bottle.
 * 메인 사진 + 메모리 캐러셀 + 와인 정보 + 별점/맛 프로파일 + 노트 + 댓글 시트.
 */
export default function WineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const collectionId = id ? parseInt(id, 10) : null;
  const { data, loading, isOwner, saveTastingNote } = useWineMemory(collectionId);

  const { count: likeCount, liked, busy: likeBusy, toggle } = useCollectionLike(collectionId);
  const { comments, loading: commentsLoading, add, remove } = useCollectionComments(collectionId);
  const {
    photos: memoryPhotos, uploading: photoUploading, videoProgress,
    pickAndUpload, remove: removePhoto,
  } = useCollectionPhotos(collectionId);

  const [carouselIndex, setCarouselIndex] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);

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
        <ScreenHeader title="와인" left={<BackButton fallbackPath="/(tabs)/cellar" />} />
        <Text style={styles.loading}>불러오는 중…</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="와인" left={<BackButton fallbackPath="/(tabs)/cellar" />} />
        <Text style={styles.loading}>와인을 찾을 수 없습니다.</Text>
      </View>
    );
  }

  const locale = [data.wine?.region, data.wine?.country].filter(Boolean).join(', ');

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="와인"
        left={<BackButton fallbackPath="/(tabs)/cellar" />}
        right={isOwner ? (
          <Pressable
            onPress={pickAndUpload}
            disabled={photoUploading}
            hitSlop={8}
            style={styles.addBtn}
          >
            {photoUploading ? (
              <ActivityIndicator size="small" color="#7b2d4e" />
            ) : (
              <Text style={styles.addBtnText}>＋</Text>
            )}
          </Pressable>
        ) : undefined}
      />

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
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

        {/* Wine identity */}
        <View style={styles.identity}>
          {data.wine?.producer ? <Text style={styles.producer}>{data.wine.producer}</Text> : null}
          <Text style={styles.wineName}>{data.wine?.name ?? 'Unknown wine'}</Text>
          {data.wine?.name_ko ? <Text style={styles.nameKo}>{data.wine.name_ko}</Text> : null}
          <Text style={styles.meta}>
            {locale || 'Region unknown'}
            {data.wine?.vintage_year ? ` · ${data.wine.vintage_year}` : ''}
          </Text>
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
              <Text style={styles.countsText}>{likeCount} likes</Text>
            )}
            {comments.length > 0 && (
              <Pressable onPress={() => setCommentsOpen(true)} hitSlop={4}>
                <Text style={styles.countsText}>{comments.length} comments</Text>
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
  container: { flex: 1, backgroundColor: '#fff' },
  loading: { textAlign: 'center', color: '#999', padding: 40, fontSize: 13 },
  scroll: { paddingBottom: 20 },

  cover: { width: '100%', aspectRatio: 1, backgroundColor: '#f5f5f5' },
  coverPlaceholder: { backgroundColor: '#f0f0f0' },
  uploadProgress: { fontSize: 11, color: '#7b2d4e', textAlign: 'center', paddingVertical: 6 },

  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: {
    fontSize: 26, color: '#7b2d4e', fontWeight: '300',
    lineHeight: 30, marginTop: -2,
  },

  identity: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  producer: { fontSize: 12, fontWeight: '700', color: '#7b2d4e', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  wineName: { fontSize: 20, fontWeight: '700', color: '#222', lineHeight: 26 },
  nameKo: { fontSize: 14, color: '#666', marginTop: 4 },
  meta: { fontSize: 12, color: '#999', marginTop: 6 },

  actionBar: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6,
  },
  countsRow: {
    flexDirection: 'row', gap: 14,
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  countsText: { fontSize: 13, fontWeight: '600', color: '#222' },
});

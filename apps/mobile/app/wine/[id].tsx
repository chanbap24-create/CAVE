import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Modal,
  Animated, Dimensions, Easing,
} from 'react-native';

// 시트 시작 위치 (오프스크린). 화면 height 보다 살짝 큼.
const SCREEN_H = Dimensions.get('window').height;
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useWineMemory } from '@/lib/hooks/useWineMemory';
import { useCollectionLike } from '@/lib/hooks/useCollectionLike';
import { useCollectionComments } from '@/lib/hooks/useCollectionComments';
import { useCollectionPhotos } from '@/lib/hooks/useCollectionPhotos';
import { ScreenHeader, BackButton } from '@/components/ScreenHeader';
import { HeartIcon, CommentBubbleIcon } from '@/components/icons/PostIcons';
import { CommentThread } from '@/components/CommentThread';
import { TastingNoteEditor } from '@/components/TastingNoteEditor';
import { PhotoPager, type PhotoPagerSlide } from '@/components/PhotoPager';

/**
 * Full page for a single cellar bottle — shows wine info, owner-editable
 * tasting note, like/comment thread. Phase 1 of the wine memory page.
 * Memory photos + friend tagging land in Phase 2/3.
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

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [replyTo, setReplyTo] = useState<{ id: number; username: string | null } | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // 댓글 시트 애니메이션 — backdrop 은 즉시 fade-in (화면 전체 덮음),
  // sheet 는 별도로 slide-up. Modal animationType=slide 를 쓰면 둘이
  // 함께 움직여 backdrop 도 같이 올라오는 문제가 생김.
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_H)).current;

  function openComments(focus?: { id: number; username: string | null }) {
    if (focus) setReplyTo(focus);
    setCommentsOpen(true);
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1, duration: 200, useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 0, duration: 280,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start(() => {
      // 슬라이드 끝난 직후 input 포커스 (애니메이션 중 포커스하면 keyboard 가
      // 슬라이드와 충돌해 어색함).
      inputRef.current?.focus();
    });
  }

  function closeComments() {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0, duration: 180, useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: SCREEN_H, duration: 220,
        easing: Easing.in(Easing.cubic), useNativeDriver: true,
      }),
    ]).start(() => {
      setCommentsOpen(false);
      setReplyTo(null);
    });
  }

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

  async function handleSend() {
    if (!draft.trim() || sending) return;
    setSending(true);
    const ok = await add(draft, replyTo?.id);
    setSending(false);
    if (ok) {
      setDraft('');
      setReplyTo(null);
    } else {
      Alert.alert('Failed', '댓글 전송에 실패했습니다.');
    }
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={44}
      >
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
            <Pressable onPress={() => openComments()} hitSlop={6}>
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
                <Pressable onPress={() => openComments()} hitSlop={4}>
                  <Text style={styles.countsText}>{comments.length} comments</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Note. 댓글은 이제 시트로 분리 — 본 화면엔 thread/input 없음. */}
          <TastingNoteEditor
            initialNote={data.tasting_note}
            initialRating={data.rating}
            updatedAt={data.tasting_note_updated_at}
            editable={isOwner}
            onSave={saveTastingNote}
          />

        </ScrollView>
      </KeyboardAvoidingView>

      {/* 댓글 시트 — backdrop 은 화면 전체 즉시 fade-in, sheet 만 slide-up.
          Modal animationType="none" + Animated 로 둘을 분리. */}
      <Modal visible={commentsOpen} animationType="none" transparent onRequestClose={closeComments}>
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.sheetBackdrop, { opacity: backdropOpacity }]}
          pointerEvents={commentsOpen ? 'auto' : 'none'}
        >
          <Pressable style={{ flex: 1 }} onPress={closeComments} />
        </Animated.View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrap}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              댓글{comments.length > 0 ? ` ${comments.length}` : ''}
            </Text>

            <ScrollView style={styles.sheetList} keyboardShouldPersistTaps="handled">
              <CommentThread
                comments={comments}
                loading={commentsLoading}
                currentUserId={user?.id}
                onDelete={confirmDelete}
                onReply={setReplyTo}
                onAvatarPress={(uid) => { closeComments(); router.push(`/user/${uid}`); }}
              />
            </ScrollView>

            {replyTo && (
              <View style={styles.replyChip}>
                <Text style={styles.replyChipText}>
                  @{replyTo.username ?? 'user'} 에게 답글
                </Text>
                <Pressable onPress={() => setReplyTo(null)} hitSlop={6}>
                  <Text style={styles.replyChipCancel}>✕</Text>
                </Pressable>
              </View>
            )}

            <View style={styles.inputRow}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={draft}
                onChangeText={setDraft}
                placeholder={replyTo ? '답글 남기기…' : '댓글을 남겨보세요'}
                placeholderTextColor="#bbb"
                maxLength={300}
                multiline
              />
              <Pressable
                style={[styles.sendBtn, (!draft.trim() || sending) && { opacity: 0.4 }]}
                onPress={handleSend}
                disabled={!draft.trim() || sending}
              >
                <Text style={styles.sendText}>{sending ? '...' : 'Post'}</Text>
              </Pressable>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
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

  // 댓글 시트
  sheetBackdrop: { backgroundColor: 'rgba(0,0,0,0.4)' },
  sheetWrap: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    maxHeight: '85%',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 12,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#ddd', alignSelf: 'center', marginTop: 10,
  },
  sheetTitle: {
    fontSize: 15, fontWeight: '700', color: '#222',
    textAlign: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#efefef',
  },
  sheetList: { maxHeight: 400 },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16,
    borderTopWidth: 1, borderTopColor: '#efefef', backgroundColor: '#fff',
  },
  input: {
    flex: 1, borderWidth: 1, borderColor: '#eee', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, backgroundColor: '#fafafa',
    maxHeight: 100,
  },
  sendBtn: { backgroundColor: '#7b2d4e', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  sendText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  replyChip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#fafaf8',
    borderTopWidth: 1, borderTopColor: '#efefef',
  },
  replyChipText: { fontSize: 12, color: '#7b2d4e', fontWeight: '600' },
  replyChipCancel: { fontSize: 14, color: '#999', paddingHorizontal: 6 },
});

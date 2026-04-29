import React, { useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useWineMemory } from '@/lib/hooks/useWineMemory';
import { useCollectionLike } from '@/lib/hooks/useCollectionLike';
import { useCollectionComments } from '@/lib/hooks/useCollectionComments';
import { useCollectionPhotos, type CollectionPhoto } from '@/lib/hooks/useCollectionPhotos';
import { ScreenHeader, BackButton } from '@/components/ScreenHeader';
import { HeartIcon, CommentBubbleIcon } from '@/components/icons/PostIcons';
import { CommentThread } from '@/components/CommentThread';
import { TastingNoteEditor } from '@/components/TastingNoteEditor';
import { MemoryPhotoGrid } from '@/components/MemoryPhotoGrid';
import { MemoryPhotoSheet } from '@/components/MemoryPhotoSheet';

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
    photos: memoryPhotos, uploading: photoUploading,
    pickAndUpload, remove: removePhoto,
  } = useCollectionPhotos(collectionId);

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [activePhoto, setActivePhoto] = useState<CollectionPhoto | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: number; username: string | null } | null>(null);
  const inputRef = useRef<TextInput>(null);

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

  const photo = data.photo_url ?? data.wine?.image_url ?? null;
  const locale = [data.wine?.region, data.wine?.country].filter(Boolean).join(', ');

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="와인"
        left={<BackButton fallbackPath="/(tabs)/cellar" />}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={44}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          {/* Cover photo */}
          {photo ? (
            <Image source={photo} style={styles.cover} contentFit="cover" cachePolicy="memory-disk" />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]} />
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

          {/* Action icons — matches the home-feed PostCard look:
              bare icons on top, counts below as text. Heart toggles the
              like, bubble focuses the comment input. */}
          <View style={styles.actionBar}>
            <Pressable onPress={toggle} disabled={likeBusy} hitSlop={6}>
              <HeartIcon filled={liked} />
            </Pressable>
            <Pressable onPress={() => inputRef.current?.focus()} hitSlop={6}>
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
                <Text style={styles.countsText}>{comments.length} comments</Text>
              )}
            </View>
          )}

          {/* Comment preview at top — 2 latest comments + "Show all". Keeps
              social activity visible without pushing content out of frame.
              Full thread lives at the bottom. */}
          {comments.length > 0 && (
            <View style={styles.commentPreview}>
              {comments.slice(0, 2).map(c => (
                <Text key={c.id} style={styles.previewLine} numberOfLines={2}>
                  <Text style={styles.previewName}>
                    @{c.profile?.username ?? 'someone'}
                  </Text>
                  <Text>{'  '}{c.body}</Text>
                </Text>
              ))}
              {comments.length > 2 && (
                <Text style={styles.previewMore}>
                  댓글 {comments.length}개 모두 보기 ↓
                </Text>
              )}
            </View>
          )}

          {/* Visual-first section order: Memories → Note → Comments.
              Photos invite engagement, note rewards deeper scroll, the
              full comment thread closes the page. */}
          <MemoryPhotoGrid
            photos={memoryPhotos}
            canEdit={isOwner}
            uploading={photoUploading}
            onAdd={pickAndUpload}
            onDelete={removePhoto}
            onOpen={setActivePhoto}
          />

          <TastingNoteEditor
            initialNote={data.tasting_note}
            updatedAt={data.tasting_note_updated_at}
            editable={isOwner}
            onSave={saveTastingNote}
          />

          <CommentThread
            comments={comments}
            loading={commentsLoading}
            currentUserId={user?.id}
            onDelete={confirmDelete}
            onReply={setReplyTo}
            onAvatarPress={(uid) => router.push(`/user/${uid}`)}
          />
        </ScrollView>

        <MemoryPhotoSheet
          visible={activePhoto != null}
          photo={activePhoto}
          canEdit={isOwner}
          onClose={() => setActivePhoto(null)}
        />

        {/* Reply-target chip, visible only while composing a reply. */}
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

        {/* Comment input */}
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
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loading: { textAlign: 'center', color: '#999', padding: 40, fontSize: 13 },
  scroll: { paddingBottom: 20 },

  cover: { width: '100%', aspectRatio: 1, backgroundColor: '#f5f5f5' },
  coverPlaceholder: { backgroundColor: '#f0f0f0' },

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

  commentPreview: {
    paddingHorizontal: 20, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
    gap: 4,
  },
  previewLine: { fontSize: 13, color: '#333', lineHeight: 19 },
  previewName: { fontWeight: '700', color: '#222' },
  previewMore: { fontSize: 11, color: '#999', marginTop: 4 },

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

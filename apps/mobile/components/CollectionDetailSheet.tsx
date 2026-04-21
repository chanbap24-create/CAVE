import React from 'react';
import {
  View, Text, Pressable, Modal, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, TextInput, Alert, PanResponder,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useCollectionLike } from '@/lib/hooks/useCollectionLike';
import { useCollectionComments } from '@/lib/hooks/useCollectionComments';
import { LikeButton } from '@/components/LikeButton';
import { PhotoPager, type PhotoPagerSlide } from '@/components/PhotoPager';
import { CommentThread } from '@/components/CommentThread';
import { timeAgo } from '@/lib/utils/dateUtils';
import type { CellarActivityItem } from '@/lib/hooks/useCellarActivity';

interface Props {
  visible: boolean;
  /** All of this user's recent additions, newest first. Sheet walks
   *  through them via prev/next controls. */
  entries: CellarActivityItem[];
  onClose: () => void;
  /** Hide the owner row at the top — used when the viewer is the owner
   *  (e.g. My Cave). */
  hideOwner?: boolean;
}

/**
 * Instagram-style detail sheet for a single cellar bottle. Top half is a
 * paged photo carousel (PhotoPager), middle is wine meta + like, bottom
 * is comments (CommentThread) + a pinned input.
 *
 * Dismissal: drag handle down, over-pull the body at the top, or tap the
 * backdrop. Navigation between entries: native horizontal swipe, or tap
 * the left/right half of the photo.
 */
export function CollectionDetailSheet({ visible, entries, onClose, hideOwner }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [index, setIndex] = React.useState(0);

  // Reset to the newest entry whenever the sheet re-opens or the group
  // changes (different user tapped).
  React.useEffect(() => {
    if (visible) setIndex(0);
  }, [visible, entries]);

  const item = entries[index] ?? null;
  const collectionId = item?.id ?? null;

  const { count: likeCount, liked, busy: likeBusy, toggle } = useCollectionLike(collectionId);
  const { comments, loading: commentsLoading, add, remove } = useCollectionComments(collectionId);

  const [draft, setDraft] = React.useState('');
  const [sending, setSending] = React.useState(false);

  // Clear the draft when switching entries so a half-typed comment on one
  // wine doesn't spill onto another.
  React.useEffect(() => { setDraft(''); }, [collectionId]);

  // Drag handle down to dismiss. Only claims vertical-dominant down-pulls
  // so comment scrolling + photo paging aren't disturbed.
  const dismissPan = React.useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_e, g) => g.dy > 8 && g.dy > Math.abs(g.dx) * 1.5,
    onPanResponderRelease: (_e, g) => {
      if (g.dy > 80 || g.vy > 0.8) onClose();
    },
  }), [onClose]);

  async function handleSend() {
    if (!draft.trim() || sending) return;
    setSending(true);
    const ok = await add(draft);
    setSending(false);
    if (ok) setDraft('');
    else Alert.alert('Failed', 'Could not post comment. Try again.');
  }

  function confirmDelete(commentId: number) {
    Alert.alert('Delete comment?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove(commentId) },
    ]);
  }

  if (!item) return null;

  const slides: PhotoPagerSlide[] = entries.map(e => ({
    id: e.id,
    uri: e.photo_url ?? e.wine?.image_url ?? null,
  }));
  const locale = [item.wine?.region, item.wine?.country].filter(Boolean).join(', ');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrap}
      >
        <View style={styles.sheet}>
          <View style={styles.handleZone} {...dismissPan.panHandlers}>
            <View style={styles.handle} />
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scroll}
            // Overscroll at the top closes the sheet (iOS-native pattern).
            onScrollEndDrag={(e) => {
              if (e.nativeEvent.contentOffset.y < -80) onClose();
            }}
            scrollEventThrottle={16}
          >
            {!hideOwner && (
              <Pressable
                style={styles.ownerRow}
                onPress={() => { onClose(); router.push(`/user/${item.user_id}`); }}
              >
                {item.owner?.avatar_url ? (
                  <Image source={item.owner.avatar_url} style={styles.ownerAvatar} contentFit="cover" cachePolicy="memory-disk" />
                ) : (
                  <View style={[styles.ownerAvatar, { backgroundColor: '#e0e0e0' }]} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.ownerName} numberOfLines={1}>
                    {item.owner?.display_name || item.owner?.username || '—'}
                  </Text>
                  <Text style={styles.addedAt}>{timeAgo(item.created_at)}에 추가</Text>
                </View>
              </Pressable>
            )}

            <PhotoPager slides={slides} index={index} onIndexChange={setIndex} />

            <View style={styles.actionBar}>
              <LikeButton liked={liked} count={likeCount} busy={likeBusy} onPress={toggle} size="section" />
            </View>

            <View style={styles.wineInfo}>
              {item.wine?.producer ? <Text style={styles.producer}>{item.wine.producer}</Text> : null}
              <Text style={styles.wineName}>{item.wine?.name ?? 'Unknown'}</Text>
              <Text style={styles.wineMeta}>
                {locale || 'Region unknown'}
                {item.wine?.vintage_year ? ` · ${item.wine.vintage_year}` : ''}
              </Text>
            </View>

            <CommentThread
              comments={comments}
              loading={commentsLoading}
              currentUserId={user?.id}
              onDelete={confirmDelete}
            />
          </ScrollView>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder="Add a comment…"
              placeholderTextColor="#bbb"
              maxLength={300}
              multiline
            />
            <Pressable
              style={[styles.sendBtn, (!draft.trim() || sending) && { opacity: 0.4 }]}
              onPress={handleSend}
              disabled={!draft.trim() || sending}
            >
              <Text style={styles.sendBtnText}>{sending ? '...' : 'Post'}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheetWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, top: '10%' },
  sheet: {
    flex: 1, backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
  },
  handleZone: {
    paddingVertical: 12, paddingHorizontal: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ddd' },
  scroll: { paddingBottom: 20 },

  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10 },
  ownerAvatar: { width: 36, height: 36, borderRadius: 18 },
  ownerName: { fontSize: 14, fontWeight: '600', color: '#222' },
  addedAt: { fontSize: 11, color: '#999', marginTop: 2 },

  actionBar: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 12 },

  wineInfo: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  producer: { fontSize: 12, fontWeight: '700', color: '#7b2d4e', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  wineName: { fontSize: 18, fontWeight: '700', color: '#222', lineHeight: 24 },
  wineMeta: { fontSize: 12, color: '#999', marginTop: 4 },

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
  sendBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});

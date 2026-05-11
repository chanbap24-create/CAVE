import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, TextInput, Modal, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, Animated, Dimensions, Easing,
} from 'react-native';
import { CommentThread } from '@/components/CommentThread';
import type { Comment } from '@/lib/hooks/useCommentsTarget';

const SCREEN_H = Dimensions.get('window').height;

interface Props {
  visible: boolean;
  onClose: () => void;
  comments: Comment[];
  loading: boolean;
  currentUserId: string | null | undefined;
  onSend: (body: string, replyToId?: number) => Promise<boolean>;
  onDelete: (commentId: number) => void;
  onAvatarPress: (userId: string) => void;
}

/**
 * 와인 상세 페이지의 댓글 시트 — 화면 전체 fade-in backdrop + slide-up sheet.
 *
 * Modal animationType=slide 를 쓰면 backdrop 도 함께 올라오는 문제가 있어
 * Modal animationType="none" + Animated 로 둘을 분리. 답글/입력/포커스
 * 등 UI-local state 는 모두 시트 내부에서 관리.
 */
export function WineCommentSheet({
  visible, onClose, comments, loading, currentUserId,
  onSend, onDelete, onAvatarPress,
}: Props) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: number; username: string | null } | null>(null);
  const inputRef = useRef<TextInput>(null);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_H)).current;

  // visible 변화에 따른 enter/exit 애니메이션
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1, duration: 200, useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 0, duration: 280,
          easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
      ]).start(() => {
        // 슬라이드 끝나고 input focus (애니메이션 중 keyboard 충돌 방지)
        inputRef.current?.focus();
      });
    } else {
      // 부모가 visible=false 로 바꿨을 때 즉시 reset (애니메이션은 closeAndAnimate 에서)
      backdropOpacity.setValue(0);
      sheetTranslateY.setValue(SCREEN_H);
      setReplyTo(null);
    }
  }, [visible, backdropOpacity, sheetTranslateY]);

  function closeAndAnimate() {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0, duration: 180, useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: SCREEN_H, duration: 220,
        easing: Easing.in(Easing.cubic), useNativeDriver: true,
      }),
    ]).start(() => {
      setReplyTo(null);
      onClose();
    });
  }

  async function handleSend() {
    if (!draft.trim() || sending) return;
    setSending(true);
    const ok = await onSend(draft, replyTo?.id);
    setSending(false);
    if (ok) {
      setDraft('');
      setReplyTo(null);
    }
  }

  function handleAvatarPress(uid: string) {
    closeAndAnimate();
    onAvatarPress(uid);
  }

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={closeAndAnimate}>
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <Pressable style={{ flex: 1 }} onPress={closeAndAnimate} />
      </Animated.View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrap}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>
            댓글{comments.length > 0 ? ` ${comments.length}` : ''}
          </Text>

          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            <CommentThread
              comments={comments}
              loading={loading}
              currentUserId={currentUserId}
              onDelete={onDelete}
              onReply={setReplyTo}
              onAvatarPress={handleAvatarPress}
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
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0,0,0,0.4)' },
  sheetWrap: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    maxHeight: '85%',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 12,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#ddd', alignSelf: 'center', marginTop: 10,
  },
  title: {
    fontSize: 15, fontWeight: '700', color: '#222',
    textAlign: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#efefef',
  },
  list: { maxHeight: 400 },

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

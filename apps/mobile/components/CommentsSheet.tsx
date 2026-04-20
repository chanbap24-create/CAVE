import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, Modal, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useAuth } from '@/lib/auth';
import { timeAgo } from '@/lib/utils/dateUtils';
import type { Comment } from '@/lib/hooks/useCommentsTarget';

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  comments: Comment[];
  loading: boolean;
  onAdd: (body: string) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
}

/**
 * Generic comments sheet used for both cellar-level and bottle-level
 * threads. Receives data/handlers from whichever hook tracks the target so
 * the same sheet works everywhere.
 */
export function CommentsSheet({
  visible, onClose, title, comments, loading, onAdd, onDelete,
}: Props) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!text.trim() || sending) return;
    setSending(true);
    const ok = await onAdd(text);
    setSending(false);
    if (ok) setText('');
    else Alert.alert('Failed', 'Could not post comment. Try again.');
  }

  function confirmDelete(id: number) {
    Alert.alert('Delete comment?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(id) },
    ]);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrap}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>{title}</Text>

          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {loading && comments.length === 0 ? (
              <Text style={styles.empty}>Loading…</Text>
            ) : comments.length === 0 ? (
              <Text style={styles.empty}>No comments yet — be the first.</Text>
            ) : (
              comments.map(c => (
                <Pressable
                  key={c.id}
                  style={styles.row}
                  onLongPress={() => c.user_id === user?.id && confirmDelete(c.id)}
                >
                  {c.profile?.avatar_url ? (
                    <Image
                      source={c.profile.avatar_url}
                      style={styles.avatar}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  ) : (
                    <View style={[styles.avatar, { backgroundColor: '#e0e0e0' }]} />
                  )}
                  <View style={styles.bubble}>
                    <Text style={styles.name}>
                      {c.profile?.display_name || c.profile?.username || 'Someone'}
                      <Text style={styles.time}>  ·  {timeAgo(c.created_at)}</Text>
                    </Text>
                    <Text style={styles.body}>{c.body}</Text>
                  </View>
                </Pressable>
              ))
            )}
            <View style={{ height: 8 }} />
          </ScrollView>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Add a comment…"
              placeholderTextColor="#bbb"
              maxLength={300}
              multiline
            />
            <Pressable
              style={[styles.sendBtn, (!text.trim() || sending) && { opacity: 0.4 }]}
              onPress={handleSend}
              disabled={!text.trim() || sending}
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
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheetWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '80%' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 12,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ddd', alignSelf: 'center', marginTop: 10 },
  sheetTitle: {
    fontSize: 15, fontWeight: '700', color: '#222',
    textAlign: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#efefef',
  },
  list: { maxHeight: 400, paddingHorizontal: 16, paddingTop: 8 },
  empty: { textAlign: 'center', color: '#bbb', paddingVertical: 32, fontSize: 13 },

  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  bubble: { flex: 1, backgroundColor: '#f7f7f7', padding: 10, borderRadius: 12 },
  name: { fontSize: 12, fontWeight: '600', color: '#222' },
  time: { fontWeight: '400', color: '#999' },
  body: { fontSize: 14, color: '#222', marginTop: 3, lineHeight: 19 },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12,
    borderTopWidth: 1, borderTopColor: '#efefef',
  },
  input: {
    flex: 1, borderWidth: 1, borderColor: '#eee', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, backgroundColor: '#fafafa',
    maxHeight: 100,
  },
  sendBtn: { backgroundColor: '#7b2d4e', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  sendBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useComments } from '@/lib/hooks/useComments';
import { useAuth } from '@/lib/auth';
import { useMention } from '@/lib/hooks/useMention';
import { MentionSuggestions } from './MentionSuggestions';
import { MentionText } from './MentionText';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  postId: number;
}

export function CommentSheet({ visible, onClose, postId }: Props) {
  const { user } = useAuth();
  const { comments, loading, addComment, deleteComment } = useComments(postId);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: number; username: string } | null>(null);
  const { suggestions, detectMention, applyMention } = useMention();

  async function handleSubmit() {
    if (!text.trim()) return;
    await addComment(text, replyTo?.id);
    setText('');
    setReplyTo(null);
  }

  function handleLongPress(commentId: number, commentUserId: string) {
    if (user?.id !== commentUserId) return;
    Alert.alert('Delete', 'Delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteComment(commentId) },
    ]);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Comments</Text>

          <ScrollView style={styles.list}>
            {comments.length === 0 && !loading && (
              <Text style={styles.empty}>No comments yet</Text>
            )}
            {comments.map(c => (
              <View key={c.id}>
                {/* Top-level comment */}
                <Pressable
                  style={styles.comment}
                  onLongPress={() => handleLongPress(c.id, c.user_id)}
                >
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>
                      {c.profile?.display_name?.[0]?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View style={styles.commentBody}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                      <Text style={styles.commentUser}>{c.profile?.username} </Text>
                      <MentionText text={c.content} style={styles.commentText} />
                    </View>
                    <View style={styles.commentMeta}>
                      <Text style={styles.commentTime}>{timeAgo(c.created_at)}</Text>
                      <Pressable onPress={() => setReplyTo({ id: c.id, username: c.profile?.username || '' })}>
                        <Text style={styles.replyBtn}>Reply</Text>
                      </Pressable>
                    </View>
                  </View>
                </Pressable>

                {/* Replies */}
                {c.replies?.map(r => (
                  <Pressable
                    key={r.id}
                    style={[styles.comment, styles.reply]}
                    onLongPress={() => handleLongPress(r.id, r.user_id)}
                  >
                    <View style={[styles.commentAvatar, styles.replyAvatar]}>
                      <Text style={[styles.commentAvatarText, { fontSize: 9 }]}>
                        {r.profile?.display_name?.[0]?.toUpperCase() || '?'}
                      </Text>
                    </View>
                    <View style={styles.commentBody}>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        <Text style={styles.commentUser}>{r.profile?.username} </Text>
                        <MentionText text={r.content} style={styles.commentText} />
                      </View>
                      <Text style={styles.commentTime}>{timeAgo(r.created_at)}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            ))}
          </ScrollView>

          {/* Input */}
          <View style={styles.inputWrap}>
            {replyTo && (
              <View style={styles.replyBar}>
                <Text style={styles.replyBarText}>Replying to {replyTo.username}</Text>
                <Pressable onPress={() => setReplyTo(null)}>
                  <Text style={styles.replyBarCancel}>Cancel</Text>
                </Pressable>
              </View>
            )}
            <MentionSuggestions suggestions={suggestions} onSelect={(user) => {
              setText(applyMention(text, user));
            }} />
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder={replyTo ? `Reply to ${replyTo.username}...` : 'Add a comment... use @ to tag'}
                placeholderTextColor="#bbb"
                value={text}
                onChangeText={(t) => { setText(t); detectMention(t); }}
                multiline
                maxLength={300}
              />
              <Pressable onPress={handleSubmit} disabled={!text.trim()}>
                <Text style={[styles.sendBtn, !text.trim() && { opacity: 0.3 }]}>Post</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1 },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '75%', minHeight: '50%',
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
  list: { flex: 1, paddingTop: 8 },
  empty: { textAlign: 'center', color: '#bbb', paddingVertical: 40, fontSize: 14 },

  comment: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  reply: { paddingLeft: 52 },
  commentAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0f0f0',
    alignItems: 'center', justifyContent: 'center',
  },
  replyAvatar: { width: 26, height: 26, borderRadius: 13 },
  commentAvatarText: { fontSize: 11, fontWeight: '600', color: '#999' },
  commentBody: { flex: 1 },
  commentText: { fontSize: 13, color: '#222', lineHeight: 18 },
  commentUser: { fontWeight: '600' },
  commentMeta: { flexDirection: 'row', gap: 16, marginTop: 4 },
  commentTime: { fontSize: 11, color: '#bbb', marginTop: 2 },
  replyBtn: { fontSize: 11, color: '#999', fontWeight: '600', marginTop: 2 },

  inputWrap: { borderTopWidth: 1, borderTopColor: '#efefef' },
  replyBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#fafafa',
  },
  replyBarText: { fontSize: 12, color: '#999' },
  replyBarCancel: { fontSize: 12, color: '#7b2d4e', fontWeight: '600' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 16, paddingVertical: 10, paddingBottom: 34,
    gap: 10,
  },
  input: {
    flex: 1, fontSize: 14, maxHeight: 80,
    backgroundColor: '#f5f5f5', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  sendBtn: { fontSize: 14, fontWeight: '600', color: '#7b2d4e', paddingBottom: 4 },
});

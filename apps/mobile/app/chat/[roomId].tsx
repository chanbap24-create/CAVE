import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useChat } from '@/lib/hooks/useChat';
import { CardImage } from '@/components/CardImage';
import { ScreenHeader, BackButton } from '@/components/ScreenHeader';
import { colors, spacing, borderRadius, fontFamily } from '@/constants/theme';
import { formatTime } from '@/lib/utils/dateUtils';

export default function ChatScreen() {
  const { roomId, title } = useLocalSearchParams<{ roomId: string; title?: string }>();
  const { user } = useAuth();
  const { messages, sendMessage } = useChat(roomId ? parseInt(roomId) : null);
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  async function handleSend() {
    if (!text.trim()) return;
    await sendMessage(text);
    setText('');
  }

  const isMe = (userId: string) => user?.id === userId;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader
        title={<Text style={styles.headerTitle} numberOfLines={1}>{title || 'Chat'}</Text>}
        left={<BackButton fallbackPath="/(tabs)/messages" />}
      />

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item, index }) => {
          const mine = isMe(item.user_id);
          const showAvatar = !mine && (index === 0 || messages[index - 1].user_id !== item.user_id);
          const initial = item.profile?.display_name?.[0]?.toUpperCase() || item.profile?.username?.[0]?.toUpperCase() || '?';

          return (
            <View style={[styles.messageRow, mine && styles.messageRowMine]}>
              {!mine && (
                <View style={styles.avatarCol}>
                  {showAvatar ? (
                    item.profile?.avatar_url ? (
                      <CardImage source={item.profile.avatar_url} style={styles.msgAvatar} />
                    ) : (
                      <View style={styles.msgAvatarPlaceholder}>
                        <Text style={styles.msgAvatarText}>{initial}</Text>
                      </View>
                    )
                  ) : <View style={{ width: 28 }} />}
                </View>
              )}
              <View style={{ maxWidth: '75%' }}>
                {showAvatar && !mine && (
                  <Text style={styles.msgUsername}>{item.profile?.username}</Text>
                )}
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                  <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.content}</Text>
                </View>
                <Text style={[styles.msgTime, mine && styles.msgTimeMine]}>{formatTime(item.created_at)}</Text>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="메시지 입력…"
          placeholderTextColor={colors.textLight}
          multiline
          maxLength={500}
        />
        <Pressable onPress={handleSend} disabled={!text.trim()}>
          <Text style={[styles.sendBtn, !text.trim() && { opacity: 0.3 }]}>전송</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerTitle: {
    fontSize: 16, fontFamily: fontFamily.bold,
    color: colors.text, textAlign: 'center',
  },

  messageList: { padding: spacing.md, paddingBottom: spacing.sm },

  messageRow: { flexDirection: 'row', marginBottom: 6, alignItems: 'flex-end' },
  messageRowMine: { flexDirection: 'row-reverse' },

  avatarCol: { width: 28, marginRight: spacing.sm },
  msgAvatar: { width: 28, height: 28, borderRadius: 14 },
  msgAvatarPlaceholder: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surfaceLight,
    alignItems: 'center', justifyContent: 'center',
  },
  msgAvatarText: { fontSize: 10, fontFamily: fontFamily.semibold, color: colors.textMuted },
  msgUsername: { fontSize: 10, fontFamily: fontFamily.body, color: colors.textMuted, marginBottom: 2, marginLeft: 4 },

  bubble: {
    paddingHorizontal: spacing.base + 2, paddingVertical: spacing.sm + 2,
    borderRadius: 18, maxWidth: '100%',
  },
  bubbleOther: { backgroundColor: colors.surfaceLight, borderBottomLeftRadius: 4 },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleText: {
    fontSize: 14, fontFamily: fontFamily.body,
    color: colors.text, lineHeight: 20,
  },
  bubbleTextMine: { color: '#fff' },

  msgTime: {
    fontSize: 10, fontFamily: fontFamily.body,
    color: colors.textLight, marginTop: 2, marginLeft: 4,
  },
  msgTimeMine: { textAlign: 'right', marginRight: 4 },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.base,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, paddingBottom: 34,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  input: {
    flex: 1, backgroundColor: colors.surfaceLight, borderRadius: 20,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    fontSize: 14, fontFamily: fontFamily.body, maxHeight: 100,
    color: colors.text,
  },
  sendBtn: {
    fontSize: 14, fontFamily: fontFamily.semibold,
    color: colors.primary, paddingBottom: 6,
  },
});

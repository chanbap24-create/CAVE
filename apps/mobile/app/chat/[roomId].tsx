import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useChat } from '@/lib/hooks/useChat';
import { ScreenHeader, BackButton } from '@/components/ScreenHeader';
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
                      <Image source={item.profile.avatar_url} style={styles.msgAvatar} contentFit="cover" cachePolicy="memory-disk" transition={150} />
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
          placeholder="Message..."
          placeholderTextColor="#bbb"
          multiline
          maxLength={500}
        />
        <Pressable onPress={handleSend} disabled={!text.trim()}>
          <Text style={[styles.sendBtn, !text.trim() && { opacity: 0.3 }]}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#222', textAlign: 'center' },

  messageList: { padding: 16, paddingBottom: 8 },

  messageRow: { flexDirection: 'row', marginBottom: 6, alignItems: 'flex-end' },
  messageRowMine: { flexDirection: 'row-reverse' },

  avatarCol: { width: 28, marginRight: 8 },
  msgAvatar: { width: 28, height: 28, borderRadius: 14 },
  msgAvatarPlaceholder: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#f0f0f0',
    alignItems: 'center', justifyContent: 'center',
  },
  msgAvatarText: { fontSize: 10, fontWeight: '600', color: '#999' },
  msgUsername: { fontSize: 10, color: '#999', marginBottom: 2, marginLeft: 4 },

  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, maxWidth: '100%' },
  bubbleOther: { backgroundColor: '#f0f0f0', borderBottomLeftRadius: 4 },
  bubbleMine: { backgroundColor: '#7b2d4e', borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14, color: '#222', lineHeight: 20 },
  bubbleTextMine: { color: '#fff' },

  msgTime: { fontSize: 10, color: '#bbb', marginTop: 2, marginLeft: 4 },
  msgTimeMine: { textAlign: 'right', marginRight: 4 },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10, paddingBottom: 34,
    borderTopWidth: 1, borderTopColor: '#efefef',
  },
  input: {
    flex: 1, backgroundColor: '#f5f5f5', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, maxHeight: 100,
  },
  sendBtn: { fontSize: 14, fontWeight: '600', color: '#7b2d4e', paddingBottom: 6 },
});

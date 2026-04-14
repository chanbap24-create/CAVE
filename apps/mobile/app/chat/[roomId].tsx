import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, FlatList, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useChat } from '@/lib/hooks/useChat';
import Svg, { Polyline } from 'react-native-svg';

function timeStr(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export default function ChatScreen() {
  const { roomId, title } = useLocalSearchParams<{ roomId: string; title?: string }>();
  const router = useRouter();
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
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Svg width={24} height={24} fill="none" stroke="#222" strokeWidth={1.8} viewBox="0 0 24 24">
            <Polyline points="15 18 9 12 15 6" />
          </Svg>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{title || 'Chat'}</Text>
        <View style={{ width: 24 }} />
      </View>

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
                      <Image source={{ uri: item.profile.avatar_url }} style={styles.msgAvatar} />
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
                <Text style={[styles.msgTime, mine && styles.msgTimeMine]}>{timeStr(item.created_at)}</Text>
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
  header: {
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#efefef',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#222', flex: 1, textAlign: 'center' },

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

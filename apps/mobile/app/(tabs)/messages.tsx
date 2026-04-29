import React, { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { useDMList } from '@/lib/hooks/useDMList';
import { timeAgo } from '@/lib/utils/dateUtils';
import { ScreenHeader } from '@/components/ScreenHeader';

export default function MessagesScreen() {
  const router = useRouter();
  const { rooms, loading, loadRooms } = useDMList();
  const [refreshing, setRefreshing] = React.useState(false);

  useFocusEffect(
    useCallback(() => { loadRooms(); }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRooms();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader variant="centered" title="메시지" />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7b2d4e" />}
      >
        {rooms.length === 0 && !loading && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>아직 메시지가 없어요</Text>
            <Text style={styles.emptyDesc}>다른 사람의 프로필에서{'\n'}메시지 버튼으로 대화를 시작해보세요</Text>
          </View>
        )}

        {rooms.map(room => {
          const u = room.other_user;
          const initial = u.display_name?.[0]?.toUpperCase() || u.username[0]?.toUpperCase() || '?';

          return (
            <Pressable
              key={room.room_id}
              style={[styles.item, room.unread && styles.itemUnread]}
              onPress={() => router.push(`/chat/${room.room_id}?title=${encodeURIComponent(u.username)}`)}
            >
              {u.avatar_url ? (
                <Image source={u.avatar_url} style={styles.avatar} contentFit="cover" cachePolicy="memory-disk" transition={150} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
              )}
              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={[styles.name, room.unread && styles.nameUnread]}>{u.username}</Text>
                  <Text style={styles.time}>{timeAgo(room.last_message_at)}</Text>
                </View>
                <Text style={[styles.lastMsg, room.unread && styles.lastMsgUnread]} numberOfLines={1}>
                  {room.last_message || 'No messages yet'}
                </Text>
              </View>
              {room.unread && <View style={styles.unreadDot} />}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  empty: { alignItems: 'center', paddingTop: 120 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#222', marginBottom: 6 },
  emptyDesc: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 22 },

  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f8f8f8',
  },
  itemUnread: { backgroundColor: '#fafaf8' },

  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarPlaceholder: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#f0f0f0',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '600', color: '#999' },

  info: { flex: 1 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '500', color: '#222' },
  nameUnread: { fontWeight: '700' },
  time: { fontSize: 11, color: '#bbb' },
  lastMsg: { fontSize: 13, color: '#999', marginTop: 3 },
  lastMsgUnread: { color: '#222', fontWeight: '500' },

  unreadDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#7b2d4e',
  },
});

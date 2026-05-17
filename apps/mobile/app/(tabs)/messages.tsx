import React, { useCallback } from 'react';
import { View, ScrollView, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { CardImage } from '@/components/CardImage';
import { useDMList } from '@/lib/hooks/useDMList';
import { timeAgo } from '@/lib/utils/dateUtils';
import { ScreenHeader, BackButton } from '@/components/ScreenHeader';
import { Body, BodyBold, Caption } from '@/components/Typography';
import { colors, spacing, borderRadius, fontFamily } from '@/constants/theme';

export default function MessagesScreen() {
  const router = useRouter();
  const { rooms, loading, loadRooms } = useDMList();
  const [refreshing, setRefreshing] = React.useState(false);

  useFocusEffect(useCallback(() => { loadRooms(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRooms();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="메시지"
        left={<BackButton fallbackPath="/(tabs)/profile" />}
      />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {rooms.length === 0 && !loading && (
          <View style={styles.empty}>
            <BodyBold>아직 메시지가 없어요</BodyBold>
            <Body tone="muted" style={styles.emptyDesc}>
              다른 사람의 프로필에서{'\n'}메시지 버튼으로 대화를 시작해보세요
            </Body>
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
                <CardImage source={u.avatar_url} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Body style={styles.avatarText}>{initial}</Body>
                </View>
              )}
              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Body style={[styles.name, room.unread && styles.nameUnread]}>{u.username}</Body>
                  <Caption tone="muted">{timeAgo(room.last_message_at)}</Caption>
                </View>
                <Body tone="muted" style={[styles.lastMsg, room.unread && styles.lastMsgUnread]} numberOfLines={1}>
                  {room.last_message || '아직 메시지 없음'}
                </Body>
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
  container: { flex: 1, backgroundColor: colors.background },
  empty: { alignItems: 'center', paddingTop: 120, gap: spacing.sm },
  emptyDesc: { textAlign: 'center', lineHeight: 21 },

  item: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.base,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  itemUnread: { backgroundColor: colors.surface },

  avatar: { width: 50, height: 50, borderRadius: borderRadius.full },
  avatarPlaceholder: {
    width: 50, height: 50, borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: fontFamily.semibold, color: colors.textMuted },

  info: { flex: 1, gap: spacing.xs },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontFamily: fontFamily.medium, fontSize: 15 },
  nameUnread: { fontFamily: fontFamily.bold },
  lastMsg: { fontSize: 13 },
  lastMsgUnread: { color: colors.text, fontFamily: fontFamily.medium },

  unreadDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary,
  },
});

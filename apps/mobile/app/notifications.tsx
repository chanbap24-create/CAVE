import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useNotifications } from '@/lib/hooks/useNotifications';
import Svg, { Path, Polyline } from 'react-native-svg';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const typeMessages: Record<string, string> = {
  like: 'liked your post',
  comment: 'commented on your post',
  follow: 'started following you',
  badge_earned: 'You earned a badge!',
  mention: 'mentioned you',
  gathering_invite: 'wants to join your gathering',
  gathering_approved: 'approved your request',
  gathering_rejected: 'declined your request',
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, loading, loadNotifications, markAllRead } = useNotifications();

  useEffect(() => {
    loadNotifications();
    markAllRead();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Svg width={24} height={24} fill="none" stroke="#222" strokeWidth={1.8} viewBox="0 0 24 24">
            <Polyline points="15 18 9 12 15 6" />
          </Svg>
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView>
        {notifications.length === 0 && !loading && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        )}
        {notifications.map(n => {
          const initial = n.actor?.display_name?.[0]?.toUpperCase() || n.actor?.username?.[0]?.toUpperCase() || '?';
          const message = typeMessages[n.type] || n.body || '';

          return (
            <Pressable
              key={n.id}
              style={[styles.item, !n.is_read && styles.itemUnread]}
              onPress={() => {
                if (n.type === 'follow' && n.actor_id) {
                  router.push(`/user/${n.actor_id}`);
                } else if (['like', 'comment', 'mention'].includes(n.type) && n.reference_id && n.reference_type === 'post') {
                  router.push(`/post/${n.reference_id}`);
                } else if (['gathering_invite', 'gathering_approved', 'gathering_rejected'].includes(n.type) && n.reference_id) {
                  router.push(`/gathering/${n.reference_id}`);
                }
              }}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.text}>
                  <Text style={styles.bold}>{n.actor?.username || 'Someone'}</Text>
                  {' '}{message}
                </Text>
                <Text style={styles.time}>{timeAgo(n.created_at)}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
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
  title: { fontSize: 17, fontWeight: '700', color: '#222' },
  empty: { paddingVertical: 80, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#bbb' },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f8f8f8',
  },
  itemUnread: { backgroundColor: '#fafaf8' },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f0f0',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '600', color: '#999' },
  info: { flex: 1 },
  text: { fontSize: 13, color: '#222', lineHeight: 18 },
  bold: { fontWeight: '600' },
  time: { fontSize: 11, color: '#bbb', marginTop: 4 },
});

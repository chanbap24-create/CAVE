import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { ScreenHeader, BackButton } from '@/components/ScreenHeader';
import { timeAgo } from '@/lib/utils/dateUtils';

const typeMessages: Record<string, string> = {
  like: 'liked your post',
  comment: 'commented on your post',
  follow: 'started following you',
  badge_earned: 'You earned a badge!',
  mention: 'mentioned you',
  gathering_invite: 'wants to join your gathering',
  gathering_approved: 'approved your request',
  gathering_rejected: 'declined your request',
  gathering_vote_request: 'requested a wine change — your vote is needed',
  gathering_vote_cast: 'voted on your wine-change request',
  gathering_vote_approved: 'Your wine-change request was approved',
  gathering_vote_rejected: 'Your wine-change request was rejected',
  collection_like: 'liked your wine',
  collection_comment: 'commented on your wine',
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
      <ScreenHeader title="Notifications" left={<BackButton />} />

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
                } else if (['collection_like', 'collection_comment'].includes(n.type) && n.reference_id) {
                  // Deep-link into My Cave and auto-open the detail sheet
                  // for the engaged wine. cellar.tsx reads the query param
                  // via useLocalSearchParams.
                  router.push(`/(tabs)/cellar?openCollection=${n.reference_id}`);
                } else if (['gathering_invite', 'gathering_approved', 'gathering_rejected', 'gathering_vote_request', 'gathering_vote_cast', 'gathering_vote_approved', 'gathering_vote_rejected'].includes(n.type) && n.reference_id) {
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

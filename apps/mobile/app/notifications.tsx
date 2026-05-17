import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { ScreenHeader, BackButton } from '@/components/ScreenHeader';
import { Body, BodyBold, Caption } from '@/components/Typography';
import { colors, spacing, borderRadius, fontFamily } from '@/constants/theme';
import { timeAgo } from '@/lib/utils/dateUtils';

const typeMessages: Record<string, string> = {
  like: '님이 회원님 게시물을 좋아합니다',
  comment: '님이 회원님 게시물에 댓글을 남겼어요',
  follow: '님이 회원님을 팔로우하기 시작했어요',
  badge_earned: '배지를 획득했어요',
  mention: '님이 회원님을 멘션했어요',
  gathering_invite: '님이 모임 참여를 요청했어요',
  gathering_approved: '님이 회원님 요청을 승인했어요',
  gathering_rejected: '님이 회원님 요청을 거절했어요',
  gathering_vote_request: '님이 와인 변경을 요청했어요 — 투표 필요',
  gathering_vote_cast: '님이 회원님 요청에 투표했어요',
  gathering_vote_approved: '회원님 와인 변경 요청이 승인됐어요',
  gathering_vote_rejected: '회원님 와인 변경 요청이 거절됐어요',
  collection_like: '님이 회원님 와인을 좋아합니다',
  collection_comment: '님이 회원님 와인에 댓글을 남겼어요',
  collection_photo_tag: '님이 와인 메모리에 회원님을 태그했어요',
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
      <ScreenHeader title="알림" left={<BackButton fallbackPath="/(tabs)/profile" />} />

      <ScrollView>
        {notifications.length === 0 && !loading && (
          <View style={styles.empty}>
            <Body tone="muted">아직 알림이 없어요</Body>
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
                } else if (['collection_like', 'collection_comment', 'collection_photo_tag'].includes(n.type) && n.reference_id) {
                  router.push(`/wine/${n.reference_id}`);
                } else if (['gathering_invite', 'gathering_approved', 'gathering_rejected', 'gathering_vote_request', 'gathering_vote_cast', 'gathering_vote_approved', 'gathering_vote_rejected'].includes(n.type) && n.reference_id) {
                  router.push(`/gathering/${n.reference_id}`);
                }
              }}
            >
              <View style={styles.avatar}>
                <Caption style={styles.avatarText}>{initial}</Caption>
              </View>
              <View style={styles.info}>
                <Body numberOfLines={2} style={styles.text}>
                  <BodyBold>{n.actor?.username || '누군가'}</BodyBold>
                  {message}
                </Body>
                <Caption tone="muted" style={styles.time}>{timeAgo(n.created_at)}</Caption>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  empty: { paddingVertical: 80, alignItems: 'center' },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.base,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  // 안 읽은 알림 — 살짝 옅은 회색 (cream 톤은 minimal 에서 사용 X)
  itemUnread: { backgroundColor: colors.surface },
  avatar: {
    width: 40, height: 40, borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: fontFamily.semibold },
  info: { flex: 1, gap: spacing.xs },
  text: { lineHeight: 19 },
  time: { marginTop: 2 },
});

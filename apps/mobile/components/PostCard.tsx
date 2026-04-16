import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { VideoPlayer } from './VideoPlayer';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useLike } from '@/lib/hooks/useLike';
import { FollowButton } from './FollowButton';
import { CommentSheet } from './CommentSheet';
import { getDMRoom } from '@/lib/hooks/useChat';
import { useAuth } from '@/lib/auth';
import { MentionText } from './MentionText';

const tagColors: Record<string, { bg: string; color: string }> = {
  wine: { bg: '#f7f0f3', color: '#7b2d4e' },
  whiskey: { bg: '#f5f0e8', color: '#8a6d3b' },
  sake: { bg: '#eef2f7', color: '#3b6d8a' },
  cognac: { bg: '#f5efe8', color: '#8a5a3b' },
  other: { bg: '#f0f0f0', color: '#666' },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

interface Props {
  post: any;
}

export function PostCard({ post }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const profile = post.profile;
  const initial = profile?.display_name?.[0]?.toUpperCase() || profile?.username?.[0]?.toUpperCase() || '?';
  const wine = post.wine;
  const tc = wine ? (tagColors[wine.category] || tagColors.other) : null;
  const { liked, count, toggleLike } = useLike(post.id, post.like_count || 0);
  const [showComments, setShowComments] = useState(false);

  // Determine highest badge
  const collectionCount = profile?.collection_count || 0;
  let topBadge: { name: string; bg: string; color: string } | null = null;
  if (collectionCount >= 100) topBadge = { name: 'Master', bg: '#f0ecf8', color: '#7860a8' };
  else if (collectionCount >= 50) topBadge = { name: 'Expert', bg: '#fdf8ec', color: '#b8933a' };
  else if (collectionCount >= 10) topBadge = { name: 'Collector', bg: '#f7f0f3', color: '#7b2d4e' };

  return (
    <View style={styles.post}>
      <View style={styles.postHeader}>
        <Pressable onPress={() => router.push(`/user/${post.user_id}`)}>
          {profile?.avatar_url ? (
            <View style={collectionCount >= 50 ? styles.avatarGlow : undefined}>
              <Image source={{ uri: profile.avatar_url }} style={[styles.avatarImg, collectionCount >= 50 && styles.avatarGoldBorder]} />
            </View>
          ) : (
            <View style={[styles.avatar, collectionCount >= 50 && styles.avatarGoldBorder]}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          )}
        </Pressable>
        <Pressable style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }} onPress={() => router.push(`/user/${post.user_id}`)}>
          <Text style={styles.userName}>{profile?.username || 'unknown'}</Text>
          {topBadge && (
            <View style={[styles.userBadge, { backgroundColor: topBadge.bg }]}>
              <Text style={[styles.userBadgeText, { color: topBadge.color }]}>{topBadge.name}</Text>
            </View>
          )}
        </Pressable>
        <FollowButton targetUserId={post.user_id} size="small" />
        <Text style={styles.more}>...</Text>
      </View>

      {post.video_playback_id ? (
        <View style={{ width: '100%', height: 390 }}>
          <VideoPlayer playbackId={post.video_playback_id} controls />
        </View>
      ) : post.image_url ? (
        <Image source={{ uri: post.image_url }} style={styles.postImage} resizeMode="cover" />
      ) : (
        <View style={[styles.postImage, { backgroundColor: '#f5f5f5' }]} />
      )}

      <View style={styles.actions}>
        <Pressable onPress={toggleLike}>
          <Svg
            width={24} height={24}
            fill={liked ? '#ed4956' : 'none'}
            stroke={liked ? '#ed4956' : '#222'}
            strokeWidth={liked ? 0 : 1.8}
            viewBox="0 0 24 24"
          >
            <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </Svg>
        </Pressable>
        <Pressable onPress={() => setShowComments(true)}>
          <Svg width={24} height={24} fill="none" stroke="#222" strokeWidth={1.8} viewBox="0 0 24 24">
            <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </Svg>
        </Pressable>
        <Pressable onPress={async () => {
          if (!user || user.id === post.user_id) return;
          const roomId = await getDMRoom(user.id, post.user_id);
          if (roomId) router.push(`/chat/${roomId}?title=${encodeURIComponent(profile?.username || 'Chat')}`);
        }}>
          <Svg width={24} height={24} fill="none" stroke="#222" strokeWidth={1.8} viewBox="0 0 24 24">
            <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </Svg>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Svg width={24} height={24} fill="none" stroke="#222" strokeWidth={1.8} viewBox="0 0 24 24">
          <Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </Svg>
      </View>

      <View style={styles.postBody}>
        {count > 0 && <Text style={styles.likes}>{count} likes</Text>}
        {(post.comment_count || 0) > 0 && (
          <Pressable onPress={() => setShowComments(true)}>
            <Text style={styles.viewComments}>View {post.comment_count} comments</Text>
          </Pressable>
        )}
        {post.caption ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingVertical: 4 }}>
            <Text style={styles.bold}>{profile?.username} </Text>
            <MentionText text={post.caption} style={styles.caption} />
          </View>
        ) : null}
        {wine && tc && (
          <View style={[styles.drinkTag, { backgroundColor: tc.bg }]}>
            <Text style={[styles.drinkTagText, { color: tc.color }]}>{wine.name}</Text>
          </View>
        )}
        <Text style={styles.time}>{timeAgo(post.created_at)}</Text>
      </View>

      <CommentSheet
        visible={showComments}
        onClose={() => setShowComments(false)}
        postId={post.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  post: { borderBottomWidth: 1, borderBottomColor: '#efefef' },
  postHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, paddingHorizontal: 16, gap: 10,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0f0f0',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 12, fontWeight: '600', color: '#666' },
  avatarImg: { width: 36, height: 36, borderRadius: 18 },
  avatarGlow: {
    borderRadius: 22, padding: 2,
    shadowColor: '#c9a84c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 8,
  },
  avatarGoldBorder: {
    borderWidth: 2, borderColor: '#c9a84c',
  },
  userName: { fontSize: 14, fontWeight: '600', color: '#222' },
  userBadge: { backgroundColor: '#f7f0f3', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  userBadgeText: { fontSize: 9, fontWeight: '600', color: '#7b2d4e' },
  more: { fontSize: 18, color: '#999', letterSpacing: 2 },
  postImage: { width: '100%', height: 390 },
  actions: {
    flexDirection: 'row', alignItems: 'center',
    gap: 16, paddingHorizontal: 14, paddingVertical: 10,
  },
  postBody: { paddingHorizontal: 16, paddingBottom: 12 },
  likes: { fontSize: 13, fontWeight: '600', color: '#222', marginBottom: 4 },
  viewComments: { fontSize: 13, color: '#999', marginBottom: 4 },
  caption: { fontSize: 13, color: '#222', lineHeight: 18 },
  bold: { fontWeight: '600' },
  drinkTag: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 6, marginTop: 6,
  },
  drinkTagText: { fontSize: 12, fontWeight: '500' },
  time: { fontSize: 11, color: '#bbb', marginTop: 6 },
});

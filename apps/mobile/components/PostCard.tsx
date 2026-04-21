import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Image } from 'expo-image';
import { VideoPlayer } from './VideoPlayer';
import { useRouter } from 'expo-router';
import { HeartIcon, CommentBubbleIcon, SendIcon, TagUserIcon } from './icons/PostIcons';
import { useLike } from '@/lib/hooks/useLike';
import { FollowButton } from './FollowButton';
import { CommentSheet } from './CommentSheet';
import { getDMRoom } from '@/lib/hooks/useChat';
import { useAuth } from '@/lib/auth';
import { getTopBadge } from '@/lib/tierUtils';
import { MentionText } from './MentionText';
import { PhotoTagOverlay } from './PhotoTagOverlay';
import { PhotoTagEditor } from './PhotoTagEditor';
import { usePhotoTags } from '@/lib/hooks/usePhotoTags';
import { UserAvatar } from './UserAvatar';

import { CATEGORY_TAG_STYLES } from '@/lib/constants/drinkCategories';
import { timeAgo } from '@/lib/utils/dateUtils';

const tagColors = CATEGORY_TAG_STYLES;

interface Props {
  post: any;
}

function PostCardImpl({ post }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const profile = post.profile;
  const fallbackChar = profile?.display_name?.[0] || profile?.username?.[0] || '?';
  const wine = post.wine;
  const tc = wine ? (tagColors[wine.category] || tagColors.other) : null;
  const { liked, count, toggleLike } = useLike(post.id, post.like_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [showTagEditor, setShowTagEditor] = useState(false);
  const { tags, loadTags } = usePhotoTags(post.id);

  React.useEffect(() => { loadTags(); }, [post.id]);

  const collectionCount = profile?.collection_count || 0;
  const topBadge = getTopBadge(collectionCount);

  return (
    <View style={styles.post}>
      <View style={styles.postHeader}>
        <Pressable onPress={() => router.push(`/user/${post.user_id}`)}>
          <UserAvatar
            uri={profile?.avatar_url}
            fallbackChar={fallbackChar}
            collectionCount={collectionCount}
            size="md"
          />
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
      </View>

      {post.video_playback_id ? (
        <View style={{ width: '100%', height: 390 }}>
          <VideoPlayer playbackId={post.video_playback_id} controls />
        </View>
      ) : post.image_url ? (
        <Pressable style={{ position: 'relative' }} onPress={() => tags.length > 0 && setShowTags(!showTags)}>
          <Image source={post.image_url} style={styles.postImage} contentFit="cover" cachePolicy="memory-disk" transition={200} />
          <PhotoTagOverlay tags={tags} visible={showTags} />
          {tags.length > 0 && !showTags && (
            <View style={styles.tagIndicator}>
              <Text style={styles.tagIndicatorText}>{tags.length}</Text>
            </View>
          )}
        </Pressable>
      ) : (
        <View style={[styles.postImage, { backgroundColor: '#f5f5f5' }]} />
      )}

      <View style={styles.actions}>
        <Pressable onPress={toggleLike}>
          <HeartIcon filled={liked} />
        </Pressable>
        <Pressable onPress={() => setShowComments(true)}>
          <CommentBubbleIcon />
        </Pressable>
        <Pressable onPress={async () => {
          if (!user) return;
          if (user.id === post.user_id) return; // no self-DM
          const res = await getDMRoom(user.id, post.user_id);
          if ('error' in res) {
            Alert.alert('DM 열기 실패', res.error);
            return;
          }
          router.push(`/chat/${res.roomId}?title=${encodeURIComponent(profile?.username || 'Chat')}`);
        }}>
          <SendIcon />
        </Pressable>
        <View style={{ flex: 1 }} />
        {user?.id === post.user_id && post.image_url && !post.video_playback_id && (
          <Pressable onPress={() => setShowTagEditor(true)}>
            <TagUserIcon />
          </Pressable>
        )}
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

      {showTagEditor && post.image_url && (
        <PhotoTagEditor
          visible={showTagEditor}
          onClose={() => setShowTagEditor(false)}
          postId={post.id}
          imageUrl={post.image_url}
          onTagAdded={loadTags}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  post: { borderBottomWidth: 1, borderBottomColor: '#efefef' },
  postHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, paddingHorizontal: 16, gap: 10,
  },
  userName: { fontSize: 14, fontWeight: '600', color: '#222' },
  userBadge: { backgroundColor: '#f7f0f3', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  userBadgeText: { fontSize: 9, fontWeight: '600', color: '#7b2d4e' },
  more: { fontSize: 18, color: '#999', letterSpacing: 2 },
  postImage: { width: '100%', height: 390 },
  tagIndicator: {
    position: 'absolute', bottom: 10, left: 10,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12,
    width: 24, height: 24, alignItems: 'center', justifyContent: 'center',
  },
  tagIndicatorText: { color: '#fff', fontSize: 10, fontWeight: '700' },
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

// Memoized: feed re-renders don't re-render each card unless its post changes
export const PostCard = React.memo(PostCardImpl);

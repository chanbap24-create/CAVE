import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/lib/auth';
import { useFollowContext } from '@/lib/followContext';

interface Props {
  targetUserId: string;
  size?: 'small' | 'normal';
}

export function FollowButton({ targetUserId, size = 'normal' }: Props) {
  const { user } = useAuth();
  const { isFollowing, toggleFollow } = useFollowContext();

  if (!user || user.id === targetUserId) return null;

  const following = isFollowing(targetUserId);
  const isSmall = size === 'small';

  return (
    <Pressable
      style={[
        styles.btn,
        following ? styles.btnFollowing : styles.btnFollow,
        isSmall && styles.btnSmall,
      ]}
      onPress={() => toggleFollow(targetUserId)}
    >
      <Text style={[
        styles.text,
        following ? styles.textFollowing : styles.textFollow,
        isSmall && styles.textSmall,
      ]}>
        {following ? 'Following' : 'Follow'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 8, alignItems: 'center',
  },
  btnSmall: { paddingHorizontal: 12, paddingVertical: 5 },
  btnFollow: { backgroundColor: '#7b2d4e' },
  btnFollowing: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
  text: { fontSize: 13, fontWeight: '600' },
  textSmall: { fontSize: 11 },
  textFollow: { color: '#fff' },
  textFollowing: { color: '#222' },
});

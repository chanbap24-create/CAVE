import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UserAvatar } from '@/components/UserAvatar';
import { PartnerBadge } from '@/components/PartnerBadge';
import { getTopBadge } from '@/lib/tierUtils';
import type { Profile } from '@/lib/hooks/useProfile';

interface Props {
  profile: Profile | null;
  fallbackChar: string;
}

export function ProfileHeader({ profile, fallbackChar }: Props) {
  const cc = profile?.collection_count ?? 0;
  const topBadge = getTopBadge(cc);

  return (
    <View style={styles.profileTop}>
      <View style={{ alignItems: 'center' }}>
        <UserAvatar
          uri={profile?.avatar_url}
          fallbackChar={fallbackChar}
          collectionCount={cc}
          size="xl"
        />
        {topBadge && (
          <View style={[styles.avatarBadge, { backgroundColor: topBadge.bg }]}>
            <Text style={[styles.avatarBadgeText, { color: topBadge.color }]}>
              {topBadge.name}
            </Text>
          </View>
        )}
        {profile?.is_partner ? (
          <View style={{ marginTop: 6 }}>
            <PartnerBadge label={profile.partner_label} size="md" />
          </View>
        ) : null}
      </View>
      <View style={styles.profileStats}>
        <Stat num={profile?.post_count ?? 0} label="Posts" />
        <Stat num={profile?.follower_count ?? 0} label="Followers" />
        <Stat num={profile?.following_count ?? 0} label="Following" />
      </View>
    </View>
  );
}

function Stat({ num, label }: { num: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statNum}>{num}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  profileTop: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, gap: 20,
  },
  avatarBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  avatarBadgeText: { fontSize: 10, fontWeight: '600' },
  profileStats: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 20 },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 17, fontWeight: '700', color: '#222' },
  statLabel: { fontSize: 11, color: '#999', marginTop: 2 },
});

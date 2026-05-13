import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UserAvatar } from '@/components/UserAvatar';
import { PartnerBadge } from '@/components/PartnerBadge';
import { getTopBadge } from '@/lib/tierUtils';
import type { Profile } from '@/lib/hooks/useProfile';

interface Props {
  profile: Profile | null;
  fallbackChar: string;
  /** 참여한 모임 수 (CaveHero 흡수) */
  gatherings?: number;
  /** shop_purchase 로 등록된 와인 수 (CaveHero 흡수) */
  purchases?: number;
}

/**
 * 프로필 상단 — 아바타 + 5개 stat (병/모임/구매/팔로워/팔로잉) 한 줄.
 *
 * 2026-05-13: CaveHero 의 stats 를 흡수하여 중복 (109병 두 번 노출) 제거.
 * 폰트는 시스템 (PlayfairDisplay 와 결을 분리) — 일관된 깔끔한 톤.
 */
export function ProfileHeader({ profile, fallbackChar, gatherings = 0, purchases = 0 }: Props) {
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
        {/* primary — 셀러 활동 지표 */}
        <View style={styles.statsRow}>
          <Stat num={cc} label="병" />
          <Stat num={gatherings} label="모임" />
          <Stat num={purchases} label="구매" />
        </View>
        {/* secondary — 소셜 지표 (셀러 앱 본질이 아니라 강등) */}
        <Text style={styles.socialLine}>
          팔로워 <Text style={styles.socialNum}>{profile?.follower_count ?? 0}</Text>
          {'  ·  '}
          팔로잉 <Text style={styles.socialNum}>{profile?.following_count ?? 0}</Text>
        </Text>
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
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 12,
  },
  avatarBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  avatarBadgeText: { fontSize: 10, fontWeight: '600' },
  // primary stat (병/모임/구매) + secondary 텍스트 (팔로워/팔로잉)
  profileStats: { flex: 1, justifyContent: 'center', gap: 10 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 17, fontWeight: '700', color: '#222' },
  statLabel: { fontSize: 11, color: '#999', marginTop: 2 },
  socialLine: {
    fontSize: 11, color: '#999', textAlign: 'center',
  },
  socialNum: { color: '#222', fontWeight: '600' },
});

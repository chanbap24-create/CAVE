import React from 'react';
import { View, StyleSheet } from 'react-native';
import { UserAvatar } from '@/components/UserAvatar';
import { PartnerBadge } from '@/components/PartnerBadge';
import { Caption, BodyBold, Label } from '@/components/Typography';
import { getTopBadge } from '@/lib/tierUtils';
import { colors, spacing, borderRadius } from '@/constants/theme';
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
 * 프로필 상단 — 아바타 + 셀러 활동 stats 3개 (병/모임/구매) + 소셜 텍스트.
 * 2026-05-14: Typography + token 마이그레이션 (editorial 톤).
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
            <Caption style={{ color: topBadge.color }}>{topBadge.name}</Caption>
          </View>
        )}
        {profile?.is_partner ? (
          <View style={{ marginTop: spacing.xs }}>
            <PartnerBadge label={profile.partner_label} size="md" />
          </View>
        ) : null}
      </View>
      <View style={styles.profileStats}>
        <View style={styles.statsRow}>
          <Stat num={cc} label="병" />
          <Stat num={gatherings} label="모임" />
          <Stat num={purchases} label="구매" />
        </View>
        <Caption tone="muted" style={styles.socialLine}>
          팔로워 <Caption tone="default" style={styles.socialNum}>{profile?.follower_count ?? 0}</Caption>
          {'  ·  '}
          팔로잉 <Caption tone="default" style={styles.socialNum}>{profile?.following_count ?? 0}</Caption>
        </Caption>
      </View>
    </View>
  );
}

function Stat({ num, label }: { num: number; label: string }) {
  return (
    <View style={styles.stat}>
      <BodyBold style={styles.statNum}>{num}</BodyBold>
      <Label tone="muted">{label}</Label>
    </View>
  );
}

const styles = StyleSheet.create({
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.base,
  },
  avatarBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  profileStats: { flex: 1, justifyContent: 'center', gap: spacing.base },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center', flex: 1 },
  // 큰 stat — 매거진 톤 살짝, 시스템 폰트지만 letter-spacing 으로 무게감.
  statNum: { fontSize: 18, letterSpacing: -0.4, color: colors.text },
  socialLine: { textAlign: 'center' },
  socialNum: { fontWeight: '600' },
});

import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polyline } from 'react-native-svg';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/lib/hooks/useProfile';
import { useUserBadges } from '@/lib/hooks/useUserBadges';
import { BadgeList } from '@/components/BadgeList';
import { EditPartnerProfileSheet } from '@/components/EditPartnerProfileSheet';
import { CardTemplateDefaultSheet } from '@/components/CardTemplateDefaultSheet';
import { Body, Caption, Eyebrow } from '@/components/Typography';
import { Button } from '@/components/Button';
import { colors, spacing, borderRadius } from '@/constants/theme';

/**
 * 설정 페이지 — 매거진 톤 redesign A.
 * 표지 (Display 타이틀) + hairline divider 메뉴 + sepia 배지 섹션.
 */
export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { profile } = useProfile(user?.id, user?.email);
  const { badges: userBadges, allBadges, loadBadges } = useUserBadges(user?.id);
  const [showCardTemplate, setShowCardTemplate] = useState(false);
  const [showPartnerEdit, setShowPartnerEdit] = useState(false);

  useEffect(() => { loadBadges(); }, [loadBadges]);

  function confirmSignOut() {
    Alert.alert('로그아웃', '정말 로그아웃하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: signOut },
    ]);
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingBottom: spacing.xxl }}>
        {/* back 버튼만 (표지 제거) */}
        <View style={styles.cover}>
          <Pressable
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile' as any)}
            hitSlop={8}
            style={styles.backBtn}
          >
            <Svg width={22} height={22} fill="none" stroke={colors.textWarm} strokeWidth={1.8} viewBox="0 0 24 24">
              <Polyline points="15 18 9 12 15 6" />
            </Svg>
          </Pressable>
        </View>

        <MenuRow
          icon="receipt-outline"
          label="내 주문"
          onPress={() => router.push('/order/list' as any)}
        />

        <MenuRow
          icon="color-palette-outline"
          label="내 카드 디자인"
          onPress={() => setShowCardTemplate(true)}
        />

        {profile?.is_partner ? (
          <MenuRow
            icon="ribbon-outline"
            label="파트너 소개 편집"
            tone="primary"
            onPress={() => setShowPartnerEdit(true)}
          />
        ) : null}

        {/* 배지 섹션 — eyebrow + 큰 serif 카운트 */}
        <View style={styles.section}>
          <Eyebrow tone="warmMuted" style={styles.sectionEyebrow}>
            BADGES · {userBadges.length}/{allBadges.length}
          </Eyebrow>
          <BadgeList
            allBadges={allBadges}
            earnedIds={new Set(userBadges.map((b: any) => b.badge_id))}
          />
        </View>

        <View style={styles.divider} />

        <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.lg }}>
          <Button label="로그아웃" variant="ghost" size="md" onPress={confirmSignOut} fullWidth />
        </View>
      </ScrollView>

      <EditPartnerProfileSheet
        visible={showPartnerEdit}
        profile={profile}
        onClose={() => setShowPartnerEdit(false)}
        onSaved={() => setShowPartnerEdit(false)}
      />
      <CardTemplateDefaultSheet
        visible={showCardTemplate}
        onClose={() => setShowCardTemplate(false)}
      />
    </View>
  );
}

function MenuRow({
  icon, label, tone = 'default', onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone?: 'default' | 'primary';
  onPress: () => void;
}) {
  const color = tone === 'primary' ? colors.primary : colors.textWarm;
  return (
    <Pressable style={styles.menuRow} onPress={onPress}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={20} color={color} />
        <Body style={{ color }}>{label}</Body>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // ─── Cover ───
  cover: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  backBtn: { width: 32, height: 32, justifyContent: 'center', marginLeft: -spacing.xs, marginBottom: spacing.base },
  eyebrow: { letterSpacing: 2, marginBottom: spacing.sm },
  coverTitle: { fontSize: 30, lineHeight: 36, letterSpacing: -0.6 },

  divider: {
    height: 1, backgroundColor: colors.borderStrong,
    marginHorizontal: spacing.md,
  },

  // ─── 메뉴 행 — 박스 X, hairline divider 만 ───
  menuRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.borderStrong,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.base },

  // ─── 배지 섹션 ───
  section: { paddingHorizontal: spacing.md, paddingVertical: spacing.lg },
  sectionEyebrow: { letterSpacing: 1.5, marginBottom: spacing.base },

  signOutBtn: {
    alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.base,
    paddingVertical: spacing.base,
  },
});

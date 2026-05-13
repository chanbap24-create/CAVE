import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/lib/hooks/useProfile';
import { useUserBadges } from '@/lib/hooks/useUserBadges';
import { ScreenHeader, BackButton } from '@/components/ScreenHeader';
import { BadgeList } from '@/components/BadgeList';
import { EditPartnerProfileSheet } from '@/components/EditPartnerProfileSheet';
import { CardTemplateDefaultSheet } from '@/components/CardTemplateDefaultSheet';

/**
 * 설정 페이지 — 2026-05-13 통합.
 * 이전 profile.tsx 의 segmented "설정" 탭과 우상단 톱니의 중복 진입점 정리.
 * 우상단 톱니 → 이 페이지 단일 진입.
 */
export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile(user?.id, user?.email);
  const { badges: userBadges, allBadges, loadBadges } = useUserBadges(user?.id);
  const [showCardTemplate, setShowCardTemplate] = useState(false);
  const [showPartnerEdit, setShowPartnerEdit] = useState(false);

  // useUserBadges 는 자동 로드 안 함 — 마운트 시 명시적 호출.
  useEffect(() => { loadBadges(); }, [loadBadges]);

  function confirmSignOut() {
    Alert.alert('로그아웃', '정말 로그아웃하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: signOut },
    ]);
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        variant="centered"
        title="설정"
        left={<BackButton fallbackPath="/(tabs)/profile" />}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Pressable style={styles.menuRow} onPress={() => setShowCardTemplate(true)}>
          <View style={styles.menuLeft}>
            <Ionicons name="color-palette-outline" size={20} color="#222" />
            <Text style={styles.menuLabel}>내 카드 디자인</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#bbb" />
        </Pressable>

        {profile?.is_partner ? (
          <Pressable style={styles.menuRow} onPress={() => setShowPartnerEdit(true)}>
            <View style={styles.menuLeft}>
              <Ionicons name="ribbon-outline" size={20} color="#7b2d4e" />
              <Text style={[styles.menuLabel, { color: '#7b2d4e' }]}>파트너 소개 편집</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#bbb" />
          </Pressable>
        ) : null}

        <View style={styles.badgeSection}>
          <Text style={styles.sectionTitle}>배지 ({userBadges.length}/{allBadges.length})</Text>
          <BadgeList
            allBadges={allBadges}
            earnedIds={new Set(userBadges.map((b: any) => b.badge_id))}
          />
        </View>

        <Pressable style={styles.signOutBtn} onPress={confirmSignOut}>
          <Text style={styles.signOutText}>로그아웃</Text>
        </Pressable>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuLabel: { fontSize: 14, color: '#222' },
  badgeSection: { paddingHorizontal: 20, paddingVertical: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#222', marginBottom: 10 },
  signOutBtn: {
    marginHorizontal: 20, marginTop: 24, marginBottom: 12,
    paddingVertical: 12, borderRadius: 8,
    alignItems: 'center', borderWidth: 1, borderColor: '#eee',
  },
  signOutText: { fontSize: 13, color: '#999' },
});

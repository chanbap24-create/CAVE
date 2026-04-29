import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/lib/hooks/useProfile';
import { useTasteProfile } from '@/lib/hooks/useTasteProfile';
import { useUserBadges } from '@/lib/hooks/useUserBadges';
import { useUnreadDM } from '@/lib/hooks/useUnreadDM';
import { BadgeList } from '@/components/BadgeList';
import { TasteCard } from '@/components/TasteCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ProfileHeader } from '@/components/ProfileHeader';
import { EditProfileModal } from '@/components/EditProfileModal';
import { EditPartnerProfileSheet } from '@/components/EditPartnerProfileSheet';
import { CardTemplateDefaultSheet } from '@/components/CardTemplateDefaultSheet';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [showPartnerEdit, setShowPartnerEdit] = useState(false);
  const [showCardTemplate, setShowCardTemplate] = useState(false);

  // Posts deprecated (i cave 방향성 변경). 셀러가 콘텐츠 단위.
  const { taste, loadTaste } = useTasteProfile(user?.id);
  const { badges: userBadges, allBadges, loadBadges } = useUserBadges(user?.id);
  const { profile, save } = useProfile(user?.id, user?.email, [loadTaste, loadBadges]);
  const { hasUnread } = useUnreadDM();

  const fallbackChar = profile?.display_name?.[0] || user?.email?.[0] || '?';

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
        title={profile?.display_name || profile?.username || 'Profile'}
      />

      <ScrollView>
        <ProfileHeader profile={profile} fallbackChar={fallbackChar} />

        <View style={styles.profileInfo}>
          <Text style={styles.profileUsername}>@{profile?.username}</Text>
          {profile?.bio ? <Text style={styles.profileBio}>{profile.bio}</Text> : null}
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.editBtn} onPress={() => setShowEdit(true)}>
            <Text style={styles.editBtnText}>프로필 편집</Text>
          </Pressable>
          <Pressable style={styles.editBtn}>
            <Text style={styles.editBtnText}>셀러 공유</Text>
          </Pressable>
        </View>

        {/* 메시지 — 탭 바에서 제거되고 프로필로 이동. unread 도트로 새 메시지 알림 */}
        <Pressable style={styles.menuRow} onPress={() => router.push('/(tabs)/messages' as any)}>
          <View style={styles.menuLeft}>
            <Ionicons name="chatbubble-outline" size={20} color="#222" />
            <Text style={styles.menuLabel}>메시지</Text>
            {hasUnread && <View style={styles.menuDot} />}
          </View>
          <Ionicons name="chevron-forward" size={18} color="#bbb" />
        </Pressable>

        {/* 모임 카드 디자인 default — 모든 호스트 대상. 모임 만들 때 자동 채워짐. */}
        <Pressable style={styles.menuRow} onPress={() => setShowCardTemplate(true)}>
          <View style={styles.menuLeft}>
            <Ionicons name="color-palette-outline" size={20} color="#222" />
            <Text style={styles.menuLabel}>내 카드 디자인</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#bbb" />
        </Pressable>

        {/* 파트너 소개 편집 — is_partner=true 인 계정만 노출. 모임 만들 때 자동 첨부될 인트로. */}
        {profile?.is_partner ? (
          <Pressable style={styles.menuRow} onPress={() => setShowPartnerEdit(true)}>
            <View style={styles.menuLeft}>
              <Ionicons name="ribbon-outline" size={20} color="#7b2d4e" />
              <Text style={[styles.menuLabel, { color: '#7b2d4e' }]}>파트너 소개 편집</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#bbb" />
          </Pressable>
        ) : null}

        {taste && <TasteCard taste={taste} compact />}

        <View style={styles.badgeSection}>
          <Text style={styles.sectionTitle}>
            배지 ({userBadges.length}/{allBadges.length})
          </Text>
          <BadgeList
            allBadges={allBadges}
            earnedIds={new Set(userBadges.map(b => b.badge_id))}
          />
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>셀러</Text>
            <Text style={styles.infoValue}>{profile?.collection_count || 0}병</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>이메일</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
        </View>

        {/* 시음 후기 피드는 (tabs)/reviews 탭으로 이동 — 프로필에서 제거됨 */}

        <Pressable style={styles.signOutBtn} onPress={confirmSignOut}>
          <Text style={styles.signOutText}>로그아웃</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>

      <EditProfileModal
        visible={showEdit}
        profile={profile}
        onClose={() => setShowEdit(false)}
        onSave={save}
      />

      <EditPartnerProfileSheet
        visible={showPartnerEdit}
        profile={profile}
        onClose={() => setShowPartnerEdit(false)}
        onSaved={() => { /* useProfile 이 focus 시 reload */ }}
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

  profileInfo: { paddingHorizontal: 20, paddingBottom: 16 },
  profileUsername: { fontSize: 13, color: '#999' },
  profileBio: { fontSize: 13, color: '#666', marginTop: 4, lineHeight: 18 },

  actions: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 16, gap: 8 },
  editBtn: {
    flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    paddingVertical: 8, alignItems: 'center',
  },
  editBtnText: { fontSize: 13, fontWeight: '600', color: '#222' },

  badgeSection: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#222', marginBottom: 12 },

  infoSection: {
    marginHorizontal: 20, backgroundColor: '#fafafa', borderRadius: 12, padding: 16,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: { fontSize: 13, color: '#999' },
  infoValue: { fontSize: 13, fontWeight: '500', color: '#222' },

  postsSection: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },

  // 메시지 메뉴 행
  menuRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, marginHorizontal: 0,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f0f0f0',
    marginBottom: 16,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuLabel: { fontSize: 14, fontWeight: '500', color: '#222' },
  menuDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ed4956', marginLeft: 4 },

  signOutBtn: {
    marginHorizontal: 20, marginTop: 24,
    paddingVertical: 14, borderRadius: 10,
    borderWidth: 1, borderColor: '#ed4956', alignItems: 'center',
  },
  signOutText: { color: '#ed4956', fontSize: 14, fontWeight: '600' },
});

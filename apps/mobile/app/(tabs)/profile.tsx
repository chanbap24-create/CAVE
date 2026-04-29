import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/lib/hooks/useProfile';
import { useTasteProfile } from '@/lib/hooks/useTasteProfile';
import { useUserBadges } from '@/lib/hooks/useUserBadges';
import { BadgeList } from '@/components/BadgeList';
import { TasteCard } from '@/components/TasteCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ProfileHeader } from '@/components/ProfileHeader';
import { EditProfileModal } from '@/components/EditProfileModal';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [showEdit, setShowEdit] = useState(false);

  // Posts deprecated (i cave 방향성 변경). 셀러가 콘텐츠 단위.
  const { taste, loadTaste } = useTasteProfile(user?.id);
  const { badges: userBadges, allBadges, loadBadges } = useUserBadges(user?.id);
  const { profile, save } = useProfile(user?.id, user?.email, [loadTaste, loadBadges]);

  const fallbackChar = profile?.display_name?.[0] || user?.email?.[0] || '?';

  function confirmSignOut() {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
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
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </Pressable>
          <Pressable style={styles.editBtn}>
            <Text style={styles.editBtnText}>Share Cave</Text>
          </Pressable>
        </View>

        {taste && <TasteCard taste={taste} compact />}

        <View style={styles.badgeSection}>
          <Text style={styles.sectionTitle}>
            Badges ({userBadges.length}/{allBadges.length})
          </Text>
          <BadgeList
            allBadges={allBadges}
            earnedIds={new Set(userBadges.map(b => b.badge_id))}
          />
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cave</Text>
            <Text style={styles.infoValue}>{profile?.collection_count || 0} bottles</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
        </View>

        <Pressable style={styles.signOutBtn} onPress={confirmSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>

      <EditProfileModal
        visible={showEdit}
        profile={profile}
        onClose={() => setShowEdit(false)}
        onSave={save}
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

  signOutBtn: {
    marginHorizontal: 20, marginTop: 24,
    paddingVertical: 14, borderRadius: 10,
    borderWidth: 1, borderColor: '#ed4956', alignItems: 'center',
  },
  signOutText: { color: '#ed4956', fontSize: 14, fontWeight: '600' },
});

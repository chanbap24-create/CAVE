import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Modal, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getAvatarRingColor, getTopBadge } from '@/lib/tierUtils';
import { useFocusEffect } from 'expo-router';
import { useMyPosts } from '@/lib/hooks/useMyPosts';
import { useDeletePost } from '@/lib/hooks/useDeletePost';
import { useTasteProfile } from '@/lib/hooks/useTasteProfile';
import { useUserBadges } from '@/lib/hooks/useUserBadges';
import { BadgeList } from '@/components/BadgeList';
import { PostGrid } from '@/components/PostGrid';
import { TasteCard } from '@/components/TasteCard';

interface Profile {
  username: string;
  display_name: string | null;
  bio: string | null;
  follower_count: number;
  following_count: number;
  post_count: number;
  collection_count: number;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const { posts: myPosts, loadPosts } = useMyPosts();
  const { deletePost } = useDeletePost(loadPosts);
  const { taste, loadTaste } = useTasteProfile(user?.id);
  const { badges: userBadges, allBadges, loadBadges } = useUserBadges(user?.id);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadProfile();
        loadPosts();
        loadTaste();
        loadBadges();
      }
    }, [user])
  );

  async function loadProfile() {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) {
      setProfile(data);
    } else {
      // Profile doesn't exist yet, create one
      const username = user.email?.split('@')[0] + '_' + Math.floor(Math.random() * 1000);
      await supabase.from('profiles').insert({
        id: user.id,
        username,
        display_name: user.email?.split('@')[0] || 'User',
      });
      loadProfile();
    }
  }

  function openEdit() {
    if (!profile) return;
    setEditName(profile.display_name || '');
    setEditUsername(profile.username);
    setEditBio(profile.bio || '');
    setAvatarUri(profile.avatar_url || null);
    setShowEdit(true);
  }

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission needed', 'Allow photo access');

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  }

  async function saveProfile() {
    if (!user || !editUsername.trim()) return Alert.alert('', 'Username is required');
    setSaving(true);

    let avatarUrl = profile?.avatar_url || null;

    // Upload new avatar if changed
    if (avatarUri && avatarUri !== profile?.avatar_url) {
      try {
        const ext = avatarUri.split('.').pop()?.split('?')[0] || 'jpg';
        const fileName = `${user.id}/avatar.${ext}`;
        const response = await fetch(avatarUri);
        const arrayBuffer = await response.arrayBuffer();

        await supabase.storage.from('post-images').upload(fileName, arrayBuffer, {
          contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
          upsert: true,
        });

        const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(fileName);
        avatarUrl = urlData.publicUrl;
      } catch {
        // Upload failed, keep existing avatar
      }
    }

    const { error } = await supabase.from('profiles').update({
      display_name: editName.trim() || null,
      username: editUsername.trim(),
      bio: editBio.trim() || null,
      avatar_url: avatarUrl,
    }).eq('id', user.id);
    setSaving(false);

    if (error) {
      if (error.message.includes('unique')) {
        Alert.alert('Error', 'This username is already taken');
      } else {
        Alert.alert('Error', error.message);
      }
      return;
    }

    setShowEdit(false);
    loadProfile();
  }

  const initial = profile?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';
  const cc = profile?.collection_count || 0;
  const myBadge = getTopBadge(cc);
  const ringColor = getAvatarRingColor(cc);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={styles.headerUsername}>{profile?.username || 'Profile'}</Text>
          {myBadge && (
            <View style={[styles.headerBadge, { backgroundColor: myBadge.bg }]}>
              <Text style={[styles.headerBadgeText, { color: myBadge.color }]}>{myBadge.name}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView>
        <View style={styles.profileTop}>
          {profile?.avatar_url ? (
            <View style={ringColor ? [styles.avatarGlow, { shadowColor: ringColor }] : undefined}>
              <Image source={{ uri: profile.avatar_url }} style={[styles.avatarLgImg, ringColor && { borderWidth: 2, borderColor: ringColor }]} />
            </View>
          ) : (
            <View style={[styles.avatarLg, ringColor && { borderWidth: 2, borderColor: ringColor }]}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          )}
          <View style={styles.profileStats}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{profile?.post_count || 0}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{profile?.follower_count || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{profile?.following_count || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile?.display_name || 'Set your name'}</Text>
          {profile?.bio ? <Text style={styles.profileBio}>{profile.bio}</Text> : null}
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.editBtn} onPress={openEdit}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </Pressable>
          <Pressable style={styles.editBtn}>
            <Text style={styles.editBtnText}>Share Cave</Text>
          </Pressable>
        </View>

        {taste && <TasteCard taste={taste} compact />}

      <View style={styles.badgeSection}>
          <Text style={styles.sectionTitle}>Badges ({userBadges.length}/{allBadges.length})</Text>
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

        <View style={styles.postsSection}>
          <Text style={styles.sectionTitle}>Posts</Text>
        </View>
        <PostGrid posts={myPosts} onLongPress={(post) => deletePost(post.id)} />

        <Pressable style={styles.signOutBtn} onPress={() => {
          Alert.alert('Sign Out', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: signOut },
          ]);
        }}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={showEdit} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowEdit(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </Pressable>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <Pressable onPress={saveProfile} disabled={saving}>
                <Text style={[styles.modalSave, saving && { opacity: 0.5 }]}>
                  {saving ? '...' : 'Save'}
                </Text>
              </Pressable>
            </View>

            <Pressable style={styles.modalAvatarRow} onPress={pickAvatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.modalAvatarImg} />
              ) : (
                <View style={styles.modalAvatar}>
                  <Text style={styles.modalAvatarText}>{editName?.[0]?.toUpperCase() || '?'}</Text>
                </View>
              )}
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </Pressable>

            <View style={styles.modalForm}>
              <Text style={styles.fieldLabel}>Display Name</Text>
              <TextInput
                style={styles.fieldInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your display name"
                placeholderTextColor="#ccc"
              />

              <Text style={styles.fieldLabel}>Username</Text>
              <TextInput
                style={styles.fieldInput}
                value={editUsername}
                onChangeText={setEditUsername}
                placeholder="username"
                placeholderTextColor="#ccc"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.fieldLabel}>Bio</Text>
              <TextInput
                style={[styles.fieldInput, { height: 80, textAlignVertical: 'top' }]}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Tell us about your taste..."
                placeholderTextColor="#ccc"
                multiline
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#efefef',
    alignItems: 'center',
  },
  headerUsername: { fontSize: 17, fontWeight: '700', color: '#222' },
  headerBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  headerBadgeText: { fontSize: 10, fontWeight: '600' },

  profileTop: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 20 },
  avatarLg: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#f0f0f0',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '600', color: '#999' },
  avatarLgImg: { width: 80, height: 80, borderRadius: 40 },
  avatarGlow: {
    borderRadius: 44, padding: 2,
    shadowColor: '#c9a84c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 8,
  },
  avatarGoldBorder: { borderWidth: 2, borderColor: '#c9a84c' },
  profileStats: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 20 },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 17, fontWeight: '700', color: '#222' },
  statLabel: { fontSize: 11, color: '#999', marginTop: 2 },

  profileInfo: { paddingHorizontal: 20, paddingBottom: 16 },
  profileName: { fontSize: 14, fontWeight: '600', color: '#222' },
  profileBio: { fontSize: 13, color: '#666', marginTop: 4, lineHeight: 18 },

  actions: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 16, gap: 8 },
  editBtn: {
    flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    paddingVertical: 8, alignItems: 'center',
  },
  editBtnText: { fontSize: 13, fontWeight: '600', color: '#222' },

  badgeSection: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#222', marginBottom: 12 },
  badgeItem: { alignItems: 'center', gap: 4 },
  badgeCircle: {
    width: 60, height: 60, borderRadius: 30,
    borderWidth: 2, borderColor: '#e0e0e0', backgroundColor: '#fafafa',
    alignItems: 'center', justifyContent: 'center',
  },
  badgeEarned: { borderColor: '#7b2d4e', backgroundColor: '#f7f0f3' },
  badgeNum: { fontSize: 14, fontWeight: '600', color: '#999' },
  badgeNumEarned: { color: '#7b2d4e' },
  badgeLabel: { fontSize: 10, color: '#999', fontWeight: '500' },

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

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    minHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#efefef',
  },
  modalCancel: { fontSize: 15, color: '#999' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  modalSave: { fontSize: 15, fontWeight: '600', color: '#7b2d4e' },

  modalAvatarRow: { alignItems: 'center', paddingVertical: 24 },
  modalAvatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#f0f0f0',
    alignItems: 'center', justifyContent: 'center',
  },
  modalAvatarText: { fontSize: 28, fontWeight: '600', color: '#999' },
  modalAvatarImg: { width: 80, height: 80, borderRadius: 40 },
  changePhotoText: { fontSize: 13, fontWeight: '600', color: '#7b2d4e', marginTop: 8 },

  modalForm: { paddingHorizontal: 20 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#999', marginBottom: 6, marginTop: 16 },
  fieldInput: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    padding: 12, fontSize: 15, backgroundColor: '#fafafa',
  },
});

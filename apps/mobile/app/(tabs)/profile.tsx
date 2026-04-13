import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Modal, Alert } from 'react-native';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useFocusEffect } from 'expo-router';

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

  useFocusEffect(
    useCallback(() => {
      if (user) loadProfile();
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
    setShowEdit(true);
  }

  async function saveProfile() {
    if (!user || !editUsername.trim()) return Alert.alert('', 'Username is required');
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      display_name: editName.trim() || null,
      username: editUsername.trim(),
      bio: editBio.trim() || null,
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerUsername}>{profile?.username || 'Profile'}</Text>
      </View>

      <ScrollView>
        <View style={styles.profileTop}>
          <View style={styles.avatarLg}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
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

        <View style={styles.badgeSection}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            <View style={styles.badgeItem}>
              <View style={[styles.badgeCircle, profile && profile.collection_count >= 10 && styles.badgeEarned]}>
                <Text style={[styles.badgeNum, profile && profile.collection_count >= 10 && styles.badgeNumEarned]}>10</Text>
              </View>
              <Text style={styles.badgeLabel}>Collector</Text>
            </View>
            <View style={styles.badgeItem}>
              <View style={styles.badgeCircle}><Text style={styles.badgeNum}>5</Text></View>
              <Text style={styles.badgeLabel}>Countries</Text>
            </View>
            <View style={styles.badgeItem}>
              <View style={styles.badgeCircle}><Text style={styles.badgeNum}>50</Text></View>
              <Text style={styles.badgeLabel}>Expert</Text>
            </View>
          </ScrollView>
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

            <View style={styles.modalAvatarRow}>
              <View style={styles.modalAvatar}>
                <Text style={styles.modalAvatarText}>{editName?.[0]?.toUpperCase() || '?'}</Text>
              </View>
            </View>

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

  profileTop: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 20 },
  avatarLg: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#f0f0f0',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '600', color: '#999' },
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

  modalForm: { paddingHorizontal: 20 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#999', marginBottom: 6, marginTop: 16 },
  fieldInput: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    padding: 12, fontSize: 15, backgroundColor: '#fafafa',
  },
});

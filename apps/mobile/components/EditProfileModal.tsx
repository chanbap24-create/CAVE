import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, StyleSheet, Alert } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import type { Profile } from '@/lib/hooks/useProfile';

interface Props {
  visible: boolean;
  profile: Profile | null;
  onClose: () => void;
  onSave: (input: {
    displayName: string;
    username: string;
    bio: string;
    avatarUri: string | null;
  }) => Promise<{ ok: boolean; error?: 'username_taken' | 'other'; message?: string }>;
}

export function EditProfileModal({ visible, profile, onClose, onSave }: Props) {
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && profile) {
      setEditName(profile.display_name ?? '');
      setEditUsername(profile.username);
      setEditBio(profile.bio ?? '');
      setAvatarUri(profile.avatar_url);
    }
  }, [visible, profile]);

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access');
      return;
    }

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

  async function handleSave() {
    setSaving(true);
    const result = await onSave({
      displayName: editName,
      username: editUsername,
      bio: editBio,
      avatarUri,
    });
    setSaving(false);

    if (!result.ok) {
      if (result.error === 'username_taken') {
        Alert.alert('Error', 'This username is already taken');
      } else {
        Alert.alert('Error', result.message ?? 'Failed to save');
      }
      return;
    }
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Pressable onPress={onClose}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <Pressable onPress={handleSave} disabled={saving}>
              <Text style={[styles.modalSave, saving && { opacity: 0.5 }]}>
                {saving ? '...' : 'Save'}
              </Text>
            </Pressable>
          </View>

          <Pressable style={styles.modalAvatarRow} onPress={pickAvatar}>
            {avatarUri ? (
              <Image
                source={avatarUri}
                style={styles.modalAvatarImg}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={150}
              />
            ) : (
              <View style={styles.modalAvatar}>
                <Text style={styles.modalAvatarText}>
                  {editName?.[0]?.toUpperCase() || '?'}
                </Text>
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
  );
}

const styles = StyleSheet.create({
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

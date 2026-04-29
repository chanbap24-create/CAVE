import React, { useEffect, useState } from 'react';
import {
  View, Text, Modal, ScrollView, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useUpdatePartnerProfile } from '@/lib/hooks/useUpdatePartnerProfile';
import type { Profile } from '@/lib/hooks/useProfile';

interface Props {
  visible: boolean;
  profile: Profile | null;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * 파트너 소개 편집 시트. 트레바리 클럽 리더 등록 폼을 참고.
 * 필드: 대표 사진 / 자기소개 / 경력·이력 / 전문분야 태그.
 *
 * is_partner / partner_label 은 관리자 권한이라 여기서 미노출 (lock_partner_columns).
 */
export function EditPartnerProfileSheet({ visible, profile, onClose, onSaved }: Props) {
  const { save, saving } = useUpdatePartnerProfile();
  const [bio, setBio] = useState('');
  const [career, setCareer] = useState('');
  const [specInput, setSpecInput] = useState('');
  const [specs, setSpecs] = useState<string[]>([]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setBio(profile?.partner_bio || '');
      setCareer(profile?.partner_career || '');
      setSpecs(profile?.partner_specialties || []);
      setSpecInput('');
      setPhotoUri(profile?.partner_photo_url || null);
    }
  }, [visible, profile]);

  async function pickPhoto() {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8, allowsEditing: true, aspect: [16, 9],
    });
    if (!r.canceled && r.assets[0]?.uri) setPhotoUri(r.assets[0].uri);
  }

  function addSpec() {
    const v = specInput.trim();
    if (!v) return;
    if (v.length > 30) { Alert.alert('', '전문분야 태그는 30자 이하'); return; }
    if (specs.length >= 8) { Alert.alert('', '최대 8개까지'); return; }
    if (specs.includes(v)) return;
    setSpecs([...specs, v]);
    setSpecInput('');
  }

  function removeSpec(s: string) { setSpecs(specs.filter(x => x !== s)); }

  async function onSave() {
    const r = await save({
      bio, career, specialties: specs,
      photoUri,
      currentPhotoUrl: profile?.partner_photo_url || null,
    });
    if (r.ok) { onSaved(); onClose(); }
    else if (r.error) Alert.alert('', r.error);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Pressable onPress={onClose}><Text style={styles.cancel}>취소</Text></Pressable>
            <Text style={styles.title}>파트너 소개 편집</Text>
            <Pressable onPress={onSave} disabled={saving}>
              <Text style={[styles.submit, saving && { opacity: 0.5 }]}>{saving ? '...' : '저장'}</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.hint}>
              모임을 만들 때 이 소개가 자동으로 함께 노출됩니다.
            </Text>

            <Text style={styles.label}>대표 사진</Text>
            <Pressable style={styles.photoBox} onPress={pickPhoto}>
              {photoUri ? (
                <Image source={photoUri} style={styles.photo} contentFit="cover" />
              ) : (
                <Text style={styles.photoEmpty}>+ 사진 추가</Text>
              )}
            </Pressable>

            <Text style={styles.label}>자기소개</Text>
            <TextInput
              style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
              value={bio} onChangeText={setBio}
              placeholder="와인과 어떤 관계인지, 어떤 모임을 만들고 싶은지 자유롭게 적어주세요."
              placeholderTextColor="#bbb" multiline maxLength={2000}
            />

            <Text style={styles.label}>경력·이력</Text>
            <TextInput
              style={[styles.input, { height: 140, textAlignVertical: 'top' }]}
              value={career} onChangeText={setCareer}
              placeholder={'예시:\n- 한국소믈리에협회 정회원\n- WSET Diploma\n- ABC 와인 디렉터 (2020-)'}
              placeholderTextColor="#bbb" multiline maxLength={3000}
            />

            <Text style={styles.label}>전문분야 (최대 8개)</Text>
            <View style={styles.tagInputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={specInput} onChangeText={setSpecInput}
                placeholder="예: 부르고뉴, 내추럴 와인"
                placeholderTextColor="#bbb" maxLength={30}
                onSubmitEditing={addSpec} returnKeyType="done"
              />
              <Pressable style={styles.addBtn} onPress={addSpec}>
                <Text style={styles.addBtnText}>추가</Text>
              </Pressable>
            </View>
            <View style={styles.tagsWrap}>
              {specs.map(s => (
                <Pressable key={s} style={styles.tag} onPress={() => removeSpec(s)}>
                  <Text style={styles.tagText}>{s}</Text>
                  <Text style={styles.tagX}> ×</Text>
                </Pressable>
              ))}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1 },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '92%' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ddd', alignSelf: 'center', marginTop: 10 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#efefef',
  },
  cancel: { fontSize: 15, color: '#999' },
  title: { fontSize: 16, fontWeight: '700', color: '#222' },
  submit: { fontSize: 15, fontWeight: '600', color: '#7b2d4e' },
  body: { padding: 20 },
  hint: { fontSize: 12, color: '#7b2d4e', marginBottom: 16, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '600', color: '#999', marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    padding: 12, fontSize: 14, backgroundColor: '#fafafa',
  },
  photoBox: {
    width: '100%', height: 160, borderRadius: 12,
    backgroundColor: '#f5f0f2', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#eee', overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },
  photoEmpty: { fontSize: 13, color: '#9c5b73' },
  tagInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addBtn: { paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#7b2d4e', borderRadius: 10 },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fdf6f8', borderWidth: 1, borderColor: '#f0d8e0',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14,
  },
  tagText: { fontSize: 12, color: '#7b2d4e', fontWeight: '500' },
  tagX: { fontSize: 12, color: '#9c5b73', fontWeight: '700' },
});

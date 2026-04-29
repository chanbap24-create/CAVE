import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface Props {
  /** 현재 선택된 이미지 URI (로컬 파일 또는 이미 업로드된 원격 URL) */
  value: string | null;
  onChange: (uri: string | null) => void;
}

/**
 * 모임 카드 hero 에 들어갈 커버 이미지 입력. 정사각 비율 (트레바리 카드 hero 가
 * 1:1 정사각이라 동일 ratio 로 미리 자르면 미리보기와 결과가 일치).
 *
 * 갤러리에서 선택 → 부모가 onChange 로 URI 받음. 업로드는 submit 시 일괄.
 */
export function GatheringCoverImageField({ value, onChange }: Props) {
  async function pick() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 접근 권한을 허용해주세요');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      onChange(result.assets[0].uri);
    }
  }

  return (
    <View>
      <Pressable style={styles.tile} onPress={pick}>
        {value ? (
          <Image source={value} style={styles.image} contentFit="cover" cachePolicy="memory-disk" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="image-outline" size={26} color="#bbb" />
            <Text style={styles.placeholderText}>커버 이미지 선택</Text>
          </View>
        )}
      </Pressable>
      {value ? (
        <Pressable style={styles.removeBtn} onPress={() => onChange(null)}>
          <Ionicons name="close-circle" size={18} color="#999" />
          <Text style={styles.removeText}>이미지 삭제</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 120, height: 120, borderRadius: 12,
    backgroundColor: '#fafafa', borderWidth: 1, borderColor: '#eee',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  placeholderText: { fontSize: 11, color: '#999', fontWeight: '500' },

  removeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  removeText: { fontSize: 11, color: '#999' },
});

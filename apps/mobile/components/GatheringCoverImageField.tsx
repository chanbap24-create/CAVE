import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useCutoutImage } from '@/lib/hooks/useCutoutImage';
import { CutoutToggle } from '@/components/CutoutToggle';
import type { CardLayoutVariant } from '@/lib/constants/cardTemplates';

interface Props {
  /** 부모가 보유한 최종 URI (원본 또는 누끼 결과). storage 업로드 대상. */
  value: string | null;
  onChange: (uri: string | null) => void;
  /**
   * 카드 layout. 'cover' 는 풀블리드 배경이라 누끼하면 빈 배경이 노출돼
   * 토글을 disabled 로 처리하고 원본을 강제 사용한다.
   */
  cardLayout: CardLayoutVariant;
}

/**
 * 모임 카드 hero 에 들어갈 커버 이미지 입력. 정사각 비율 (트레바리 카드 hero 가
 * 1:1 정사각이라 동일 ratio 로 미리 자르면 미리보기와 결과가 일치).
 *
 * 선택 직후 native subject-extractor 로 누끼 PNG 를 미리 만들어두고,
 * 토글 ON + layout 호환이면 누끼 결과를 부모에게 emit. layout 변경/토글 변경 시
 * 즉시 다시 emit 해 미리보기와 업로드 모두 일관 유지.
 */
export function GatheringCoverImageField({ value, onChange, cardLayout }: Props) {
  // 부모가 들고 있는 value 는 "현재 노출/업로드용" URI 이므로
  // 누끼 처리에 필요한 원본은 별도 state 로 보관한다.
  const [originalUri, setOriginalUri] = useState<string | null>(value);
  const [toggleOn, setToggleOn] = useState(true);

  // 부모가 외부에서 value 를 비우면 (예: 폼 reset) originalUri 도 동기화.
  useEffect(() => {
    if (value == null) setOriginalUri(null);
  }, [value]);

  const layoutAllows = cardLayout !== 'cover';
  const { state, current } = useCutoutImage(originalUri, toggleOn && layoutAllows);

  // current(=노출/업로드용) 값이 바뀔 때마다 부모에 동기화. 무한루프 방지를 위해
  // 직전에 emit 한 값을 ref 로 비교한다.
  const lastEmittedRef = useRef<string | null>(value);
  useEffect(() => {
    if (current !== lastEmittedRef.current) {
      lastEmittedRef.current = current;
      onChange(current);
    }
  }, [current, onChange]);

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
      setOriginalUri(result.assets[0].uri);
      setToggleOn(true);
    }
  }

  function clear() {
    setOriginalUri(null);
    // useEffect 에서 current=null 로 onChange 가 자연스럽게 호출됨
  }

  // 미리보기는 항상 current(누끼 ready+enabled 면 누끼, 아니면 원본) 사용.
  // processing 중이면 originalUri 를 잠깐 보여줘 깜빡임 방지.
  const previewUri = current ?? originalUri;

  return (
    <View>
      <Pressable style={styles.tile} onPress={pick}>
        {previewUri ? (
          <Image source={previewUri} style={styles.image} contentFit="cover" cachePolicy="memory-disk" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="image-outline" size={26} color="#bbb" />
            <Text style={styles.placeholderText}>커버 이미지 선택</Text>
          </View>
        )}
      </Pressable>

      <CutoutToggle
        state={state}
        layoutAllows={layoutAllows}
        enabled={toggleOn}
        onChange={setToggleOn}
      />

      {previewUri ? (
        <Pressable style={styles.removeBtn} onPress={clear}>
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

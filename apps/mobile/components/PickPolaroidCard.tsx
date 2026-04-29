import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';

interface Props {
  /** 행 위치 (0-based) — 회전각/넘버 라벨 결정에 사용 */
  index: number;
  imageUrl?: string | null;
  wineName: string;
  memo?: string | null;
  vintageYear?: number | null;
  onPress?: () => void;
  onLongPress?: () => void;
}

/**
 * 인생 와인(픽) 카드 — 폴라로이드 일기 톤.
 *
 * 모임 카드(이벤트 톤, 정렬된 hero)와 시각언어를 명확히 분리하기 위해 픽은
 * 사진을 흰 프레임에 끼운 폴라로이드 형태 + idx 별 살짝 회전(-2°, 1.5°, -1°,
 * 2°, -1.5°)로 wabi-sabi 한 정서를 만든다. 메모는 사진 아래 흰 여백에
 * Italic Serif 로 손글씨 톤.
 *
 * 회전이 행 높이를 흔들지 않도록 outer wrap 의 size 는 유지하고, 내부
 * frame 만 회전.
 */
const ROTATIONS = [-2, 1.5, -1, 2, -1.5];
const FRAME_W = 150;
const FRAME_H = 200;
const PHOTO_SIZE = 130;

export function PickPolaroidCard({
  index, imageUrl, wineName, memo, vintageYear, onPress, onLongPress,
}: Props) {
  const rotate = ROTATIONS[index % ROTATIONS.length];
  const frameStyle: ViewStyle = { transform: [{ rotate: `${rotate}deg` }] };
  return (
    // 회전한 frame 이 인접 카드/스크롤 영역과 너무 부딪히지 않도록 outer 에 충분한
    // 좌우 margin 을 둠 (회전 시 모서리가 살짝 튀어나옴).
    <View style={styles.outer}>
      <Pressable
        style={[styles.frame, frameStyle]}
        onPress={onPress}
        onLongPress={onLongPress}
      >
        <View style={styles.photoWrap}>
          {imageUrl ? (
            <Image
              source={imageUrl}
              style={styles.photo}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
            />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <Text style={styles.photoPlaceholderChar}>♡</Text>
            </View>
          )}
          {vintageYear ? (
            <View style={styles.vintageStamp}>
              <Text style={styles.vintageText}>'{String(vintageYear).slice(-2)}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.caption}>
          <Text style={styles.wineName} numberOfLines={1}>{wineName || '?'}</Text>
          {memo ? (
            <Text style={styles.memo} numberOfLines={2}>"{memo}"</Text>
          ) : (
            <Text style={styles.memoPlaceholder}>—</Text>
          )}
        </View>
      </Pressable>
    </View>
  );
}

/**
 * Empty placeholder + Add tile — 폴라로이드 톤으로 통일.
 * dashed 흰 프레임 + 중앙에 "+ 인생 와인" 카피.
 */
export function PickPolaroidAddTile({ onPress, label = '+ 인생 와인' }: { onPress: () => void; label?: string }) {
  return (
    <View style={styles.outer}>
      <Pressable style={[styles.frame, styles.addFrame]} onPress={onPress}>
        <Text style={styles.addPlus}>+</Text>
        <Text style={styles.addLabel}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // 회전 카드들이 살짝 겹치며 album 같은 정서가 나도록 outer width 는 frame
  // width 보다 좁게 (gap 자체가 음수처럼 작용) — 너무 좁으면 터치 영역이 줄어듦.
  outer: { width: FRAME_W - 8, height: FRAME_H + 14, alignItems: 'center', justifyContent: 'center' },

  frame: {
    width: FRAME_W, height: FRAME_H,
    backgroundColor: '#fafaf6', // 살짝 따뜻한 white (순백보다 종이 톤)
    paddingTop: 10, paddingHorizontal: 10, paddingBottom: 8,
    borderRadius: 2,
    // 그림자 — 폴라로이드가 종이에 떠 있는 듯한 인상
    shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 3 }, shadowRadius: 6,
    elevation: 4,
  },

  photoWrap: { width: PHOTO_SIZE, height: PHOTO_SIZE, position: 'relative', alignSelf: 'center' },
  photo: { width: '100%', height: '100%', backgroundColor: '#eae4d8' },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  photoPlaceholderChar: { fontSize: 28, color: '#c4b8a3' },

  // 빈티지 도장 — 사진 우상단에 살짝 회전된 작은 라벨
  vintageStamp: {
    position: 'absolute', right: -6, top: -6,
    backgroundColor: '#2c1810',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 2,
    transform: [{ rotate: '6deg' }],
  },
  vintageText: { color: '#fdebd0', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  caption: { marginTop: 8, alignItems: 'center' },
  wineName: {
    fontSize: 12, color: '#2c1810',
    fontFamily: 'PlayfairDisplay_700Bold_Italic',
    textAlign: 'center',
  },
  memo: {
    fontSize: 10, color: '#7a6a55', fontStyle: 'italic',
    marginTop: 3, textAlign: 'center', lineHeight: 13,
  },
  memoPlaceholder: { fontSize: 10, color: '#c4b8a3', marginTop: 3 },

  // Add tile
  addFrame: {
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#d4c8b3',
    backgroundColor: '#fffef8',
    alignItems: 'center', justifyContent: 'center',
  },
  addPlus: { fontSize: 32, color: '#c4b8a3', fontWeight: '300' },
  addLabel: { fontSize: 11, color: '#a89880', marginTop: 4, fontWeight: '600' },
});

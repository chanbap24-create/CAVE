import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle, type ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Path, Line } from 'react-native-svg';
import type { CardTemplate, CardLayoutVariant } from '@/lib/constants/cardTemplates';

interface Props {
  template: CardTemplate;
  /** 카드 폭. hero 는 1:1 정사각형. */
  width: number;
  /** 행 위치 번호 (1, 2, 3 …). picker 썸네일 미지정 → template.numberLabel 사용. */
  numberOverride?: string | number;
  /** 모임 제목 — variant 별 위치/크기로 hero 안에 노출. */
  title?: string;
  /** 부제목 — title 아래 작게 노출. */
  subtitle?: string;
  /** 커버 이미지 URL — variant 별 위치/크기. signature=corner, magazine=right-band, cover=full-bleed bg. */
  imageUrl?: string | null;
}

/**
 * 트레바리식 카드 hero — 컬러 배경 + 큰 숫자 + 모티프 + 제목/부제 + (선택) 커버 이미지.
 *
 * 정사각형 1:1. template.layout (signature / magazine / cover) 별로 모든 요소가
 * 다른 위치/크기로 렌더 → 같은 행에서도 카드들이 동일하게 안 보임.
 *
 *  - signature : num 좌하 / motif 우하 / title·sub 좌상 / image 우상 코너 액자
 *  - magazine  : num 좌상 / motif 우하 / title·sub 우중 / image 우측 풀-밴드
 *  - cover     : num 배경 워터마크 / motif 좌하 / title·sub 중앙 / image 전체 배경
 */
export function CardTemplateHero({
  template, width, numberOverride, title, subtitle, imageUrl,
}: Props) {
  const size = width;
  const numberText = numberOverride != null ? String(numberOverride) : template.numberLabel;
  const layout: CardLayoutVariant = template.layout || 'signature';
  const hasImage = !!imageUrl;

  return (
    <View style={[styles.hero, { backgroundColor: template.bg, width: size, height: size }]}>
      {/* cover 변형의 풀-블리드 배경 이미지 + 컬러 오버레이 */}
      {hasImage && layout === 'cover' && (
        <>
          <Image source={imageUrl!} style={styles.coverBg} contentFit="cover" cachePolicy="memory-disk" />
          <View style={[styles.coverTint, { backgroundColor: template.bg, opacity: 0.55 }]} />
        </>
      )}

      {/* magazine 변형의 우측 풀-밴드 이미지 */}
      {hasImage && layout === 'magazine' && (
        <Image
          source={imageUrl!}
          style={[styles.magazineBand, { width: size * 0.42 }]}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      )}

      {/* 우측 상단 북마크 — image 가 그 자리 차지하는 signature 에서는 숨김 */}
      {!(hasImage && layout === 'signature') && (
        <View style={styles.bookmark}>
          <Svg width={14} height={18} viewBox="0 0 24 24" fill={template.fg}>
            <Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </Svg>
        </View>
      )}

      {/* signature 변형의 우상단 코너 액자 이미지 */}
      {hasImage && layout === 'signature' && (
        <Image
          source={imageUrl!}
          style={styles.signatureFrame}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      )}

      {/* 큰 숫자 — cover + image 일 때는 워터마크 노출 시 사진과 겹쳐 지저분해서 숨김 */}
      {!(hasImage && layout === 'cover') && (
        <Text
          style={[styles.numberBase, numberStyleByLayout(layout, size), { color: template.fg }]}
        >
          {numberText}
        </Text>
      )}

      {/* 와인 글라스 — image 가 그 영역을 차지하면 숨김 */}
      {!hasImage && (
        <View style={glassStyleByLayout(layout)}>
          <Svg width={36} height={56} viewBox="0 0 24 36" fill="none" stroke={template.glassColor} strokeWidth={1.5}>
            <Path d="M5 2 Q5 14 12 16 Q19 14 19 2 Z" />
            <Line x1={12} y1={16} x2={12} y2={28} />
            <Line x1={6} y1={28} x2={18} y2={28} />
          </Svg>
        </View>
      )}

      {/* 모티프 카피 */}
      <View style={motifWrapByLayout(layout)}>
        <View style={[styles.motifBracket, { borderColor: template.fg }]} />
        <View style={styles.motifText}>
          <Text style={[styles.motifLine, { color: template.fg }]}>{template.motif[0]}</Text>
          <Text style={[styles.motifLine, { color: template.fg }]}>{template.motif[1]}</Text>
        </View>
        <View style={[styles.motifBracket, styles.motifBracketRight, { borderColor: template.fg }]} />
      </View>

      {/* 제목 + 부제 오버레이 */}
      {(title || subtitle) ? (
        <View style={titleWrapByLayout(layout, size)}>
          {title ? (
            <Text
              style={[titleTextByLayout(layout), { color: template.fg }]}
              numberOfLines={layout === 'cover' ? 3 : 2}
            >
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text
              style={[subtitleTextByLayout(layout), { color: template.fg }]}
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

// ─────────── variant 별 스타일 helper ───────────

function numberStyleByLayout(layout: CardLayoutVariant, size: number): TextStyle {
  if (layout === 'magazine') {
    return { left: 14, top: -16, fontSize: Math.round(size * 0.6), lineHeight: Math.round(size * 0.6), opacity: 0.95 };
  }
  if (layout === 'cover') {
    return {
      left: -10, top: -size * 0.15,
      fontSize: Math.round(size * 1.1), lineHeight: Math.round(size * 1.1),
      opacity: 0.18,
    };
  }
  return { left: 14, bottom: -6, fontSize: Math.round(size * 0.6), lineHeight: Math.round(size * 0.6), opacity: 0.95 };
}

function glassStyleByLayout(layout: CardLayoutVariant): ViewStyle {
  if (layout === 'magazine') return { ...glassBase, left: 18, bottom: 22 };
  if (layout === 'cover') return { ...glassBase, right: 28, top: 30, opacity: 0.55 };
  return { ...glassBase, right: 28, top: 30 };
}

function motifWrapByLayout(layout: CardLayoutVariant): ViewStyle {
  if (layout === 'cover') return { ...motifWrapBase, left: 14, bottom: 18 };
  return { ...motifWrapBase, right: 14, bottom: 18 };
}

function titleWrapByLayout(layout: CardLayoutVariant, size: number): ViewStyle {
  if (layout === 'magazine') {
    return {
      position: 'absolute',
      // image 있을 때는 좌측으로 (이미지가 우측 밴드 차지). 없을 땐 우측.
      left: 14, right: undefined, top: size * 0.32,
      width: size * 0.55,
      alignItems: 'flex-start',
    };
  }
  if (layout === 'cover') {
    return { position: 'absolute', left: 14, right: 14, top: size * 0.30, alignItems: 'center' };
  }
  return { position: 'absolute', left: 14, right: 100, top: 14 };
}

function titleTextByLayout(layout: CardLayoutVariant): TextStyle {
  if (layout === 'magazine') return { fontSize: 16, fontWeight: '700', lineHeight: 21, letterSpacing: -0.3 };
  if (layout === 'cover') return { fontSize: 18, fontWeight: '800', lineHeight: 23, letterSpacing: -0.3, textAlign: 'center' };
  return { fontSize: 14, fontWeight: '700', lineHeight: 19, letterSpacing: -0.2 };
}

function subtitleTextByLayout(layout: CardLayoutVariant): TextStyle {
  const base: TextStyle = { fontSize: 11, fontWeight: '500', lineHeight: 15, opacity: 0.85, marginTop: 4 };
  if (layout === 'cover') return { ...base, fontSize: 12, textAlign: 'center', marginTop: 6 };
  return base;
}

// ─────────── base styles ───────────

const glassBase: ViewStyle = { position: 'absolute', opacity: 0.85 };
const motifWrapBase: ViewStyle = {
  position: 'absolute',
  flexDirection: 'row', alignItems: 'center', gap: 6,
};

const styles = StyleSheet.create({
  hero: { position: 'relative', overflow: 'hidden' },
  bookmark: { position: 'absolute', right: 12, top: 12, zIndex: 3 },
  numberBase: {
    position: 'absolute',
    fontWeight: '700',
    letterSpacing: -8,
    fontFamily: 'PlayfairDisplay_700Bold_Italic',
  },
  motifBracket: {
    width: 6, height: 38, borderLeftWidth: 1.5,
    borderTopLeftRadius: 18, borderBottomLeftRadius: 18,
    borderTopWidth: 0, borderBottomWidth: 0, borderRightWidth: 0,
  },
  motifBracketRight: { transform: [{ rotateY: '180deg' }] },
  motifText: { alignItems: 'center' },
  motifLine: { fontSize: 13, fontWeight: '700', lineHeight: 18, letterSpacing: -0.3 },

  // image 슬롯
  coverBg: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 0 } as ImageStyle,
  coverTint: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 1 },
  magazineBand: {
    position: 'absolute', right: 0, top: 0, bottom: 0,
    zIndex: 0,
  } as ImageStyle,
  signatureFrame: {
    position: 'absolute', right: 12, top: 12,
    width: 75, height: 75, borderRadius: 10, zIndex: 2,
  } as ImageStyle,
});

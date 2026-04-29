import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle, type ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Path, Line } from 'react-native-svg';
import type { CardTemplate, CardLayoutVariant } from '@/lib/constants/cardTemplates';

interface Props {
  template: CardTemplate;
  /** 카드 폭. hero 는 1:1 정사각형. */
  width: number;
  /** 행 위치 번호. picker 썸네일 미지정 → template.numberLabel 사용. */
  numberOverride?: string | number;
  /** 모임 제목. 미지정 시 template.motif[0] 가 placeholder 로 노출(picker preview). */
  title?: string;
  /** 부제. 미지정 시 template.motif[1] 가 placeholder 로 노출(picker preview). */
  subtitle?: string;
  /** 커버 이미지 URL. variant 별 위치/크기. */
  imageUrl?: string | null;
}

/**
 * 트레바리식 카드 hero — 정사각 1:1.
 *
 * 공통:
 *  - 숫자 = 항상 좌하단 큼
 *  - 북마크 = 우상단
 *  - 와인글라스 = 우상단(이미지 있을 땐 숨김)
 *
 * variant 차이는 "제목/부제 슬롯의 위치 + 이미지 슬롯 형태":
 *  - signature : title 좌상단 strip / image 우상단 코너 액자(75×75)
 *  - magazine  : title 우중단(이미지 있을 땐 좌상으로 양보) / image 우측 풀-밴드
 *  - cover     : title 상중앙 / image 풀-블리드 배경 + 컬러 오버레이
 *
 * picker 썸네일은 title 미지정 → template.motif 가 title/subtitle 슬롯에 들어가
 * "이 자리에 텍스트가 들어가요" 하는 placeholder 역할을 한다.
 */
export function CardTemplateHero({
  template, width, numberOverride, title, subtitle, imageUrl,
}: Props) {
  const size = width;
  const numberText = numberOverride != null ? String(numberOverride) : template.numberLabel;
  const layout: CardLayoutVariant = template.layout || 'signature';
  const hasImage = !!imageUrl;
  // cover + 이미지: 배경이 사진이라 fg 컬러(특히 lavender 같은 옅은 톤) 가독성이
  // 떨어진다. 텍스트는 #fff + 짙은 그림자로 강제하고, 컬러 오버레이는 살짝 옅게.
  const coverImageMode = hasImage && layout === 'cover';
  const textColor = coverImageMode ? '#fff' : template.fg;
  const textShadow: TextStyle = coverImageMode
    ? { textShadowColor: 'rgba(0,0,0,0.55)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }
    : {};
  // picker 미리보기: motif 가 title/subtitle 자리를 채워서 디자인 확인
  const titleStr = title ?? template.motif[0];
  const subtitleStr = subtitle ?? (title ? undefined : template.motif[1]);

  return (
    <View style={[styles.hero, { backgroundColor: template.bg, width: size, height: size }]}>
      {/* cover variant 풀-블리드 배경 — 컬러 톤은 살짝만(0.30), 텍스트 영역엔 별도 짙은 스크림 */}
      {hasImage && layout === 'cover' && (
        <>
          <Image source={imageUrl!} style={styles.coverBg} contentFit="cover" cachePolicy="memory-disk" />
          <View style={[styles.coverTint, { backgroundColor: template.bg, opacity: 0.30 }]} />
          <View style={styles.coverScrim} />
        </>
      )}

      {/* magazine variant 우측 풀-밴드 이미지 */}
      {hasImage && layout === 'magazine' && (
        <Image
          source={imageUrl!}
          style={[styles.magazineBand, { width: size * 0.42 }]}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      )}

      {/* 우상단 북마크 — signature + image 일 땐 액자가 그 자리라 숨김 */}
      {!(hasImage && layout === 'signature') && (
        <View style={styles.bookmark}>
          <Svg width={14} height={18} viewBox="0 0 24 24" fill={template.fg}>
            <Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </Svg>
        </View>
      )}

      {/* signature 우상단 코너 액자 이미지 */}
      {hasImage && layout === 'signature' && (
        <Image
          source={imageUrl!}
          style={styles.signatureFrame}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      )}

      {/* 와인글라스 — 이미지 영역과 충돌하면 숨김 */}
      {!hasImage && (
        <View style={styles.glassWrap}>
          <Svg width={32} height={50} viewBox="0 0 24 36" fill="none" stroke={template.glassColor} strokeWidth={1.5}>
            <Path d="M5 2 Q5 14 12 16 Q19 14 19 2 Z" />
            <Line x1={12} y1={16} x2={12} y2={28} />
            <Line x1={6} y1={28} x2={18} y2={28} />
          </Svg>
        </View>
      )}

      {/* 숫자 — 모든 variant 좌하단 통일 */}
      <Text
        style={[
          styles.numberBase,
          numberStyleByLayout(layout, size),
          { color: textColor },
          textShadow,
        ]}
      >
        {numberText}
      </Text>

      {/* 제목 + 부제 슬롯 — variant 별 위치, 좌하단 숫자 영역과 안 부딪히게 배치 */}
      <View style={titleWrapByLayout(layout, size, hasImage)}>
        <Text
          style={[titleTextByLayout(layout), { color: textColor }, textShadow]}
          numberOfLines={layout === 'cover' ? 3 : 2}
        >
          {titleStr}
        </Text>
        {subtitleStr ? (
          <Text
            style={[subtitleTextByLayout(layout), { color: textColor }, textShadow]}
            numberOfLines={2}
          >
            {subtitleStr}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// ─────────── variant 별 스타일 helper ───────────

/** 숫자 — 모든 variant 좌하단 큼. cover 만 약간 더 크게 (배경 사진 있어도 인상 유지). */
function numberStyleByLayout(layout: CardLayoutVariant, size: number): TextStyle {
  if (layout === 'cover') {
    return { left: 12, bottom: -10, fontSize: Math.round(size * 0.7), lineHeight: Math.round(size * 0.7), opacity: 0.95 };
  }
  return { left: 12, bottom: -8, fontSize: Math.round(size * 0.6), lineHeight: Math.round(size * 0.6), opacity: 0.95 };
}

/**
 * 제목/부제 슬롯 위치 — 좌하단 숫자(높이 ~size*0.6)와 안 부딪히게 상단 영역 사용.
 * magazine 은 이미지 유무에 따라 좌·우 위치 스왑.
 */
function titleWrapByLayout(layout: CardLayoutVariant, size: number, hasImage: boolean): ViewStyle {
  if (layout === 'magazine') {
    if (hasImage) {
      // 우측 밴드가 이미지 차지 → title 좌상
      return { position: 'absolute', left: 14, top: 16, right: size * 0.46, alignItems: 'flex-start' };
    }
    return { position: 'absolute', right: 14, top: 16, width: size * 0.55, alignItems: 'flex-end' };
  }
  if (layout === 'cover') {
    return { position: 'absolute', left: 14, right: 14, top: size * 0.18, alignItems: 'center' };
  }
  // signature — 좌상단 strip (우상단의 액자/글라스 자리 피해 right 100)
  return { position: 'absolute', left: 14, top: 14, right: 100 };
}

function titleTextByLayout(layout: CardLayoutVariant): TextStyle {
  if (layout === 'magazine') return { fontSize: 17, fontWeight: '700', lineHeight: 22, letterSpacing: -0.3 };
  if (layout === 'cover') return { fontSize: 19, fontWeight: '800', lineHeight: 24, letterSpacing: -0.3, textAlign: 'center' };
  return { fontSize: 15, fontWeight: '700', lineHeight: 20, letterSpacing: -0.2 };
}

function subtitleTextByLayout(layout: CardLayoutVariant): TextStyle {
  const base: TextStyle = { fontSize: 11, fontWeight: '500', lineHeight: 15, opacity: 0.85, marginTop: 4 };
  if (layout === 'cover') return { ...base, fontSize: 12, textAlign: 'center', marginTop: 6 };
  return base;
}

const styles = StyleSheet.create({
  hero: { position: 'relative', overflow: 'hidden' },
  bookmark: { position: 'absolute', right: 12, top: 12, zIndex: 3 },
  glassWrap: { position: 'absolute', right: 28, top: 30, opacity: 0.7, zIndex: 2 },
  numberBase: {
    position: 'absolute',
    fontWeight: '700',
    letterSpacing: -8,
    fontFamily: 'PlayfairDisplay_700Bold_Italic',
    zIndex: 2,
  },

  // image 슬롯
  coverBg: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 0 } as ImageStyle,
  coverTint: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 1 },
  // cover + 이미지: 텍스트가 사진 어두운/밝은 부분 어디에 떨어져도 읽히도록 짙은 스크림.
  // 좌하단 숫자 + 상중앙 제목 영역까지 모두 덮음. 컬러 톤은 coverTint 가 담당.
  coverScrim: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.32)', zIndex: 1,
  },
  magazineBand: {
    position: 'absolute', right: 0, top: 0, bottom: 0,
    zIndex: 0,
  } as ImageStyle,
  signatureFrame: {
    position: 'absolute', right: 12, top: 12,
    width: 75, height: 75, borderRadius: 10, zIndex: 2,
  } as ImageStyle,
});

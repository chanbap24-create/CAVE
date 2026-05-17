import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { colors, fontSize, fontWeight, lineHeight, fontFamily } from '@/constants/theme';

// ─────────────────────────────────────────────────────────
// 에디토리얼 톤 타이포그래피 시스템 (2026-05-14 redesign A).
//
// 위계:
//   Display      매거진 hero / 큰 숫자 / 인용 (serif italic)
//   H1 / H2 / H3 페이지·섹션 제목 (sans bold)
//   Body         본문 (sans regular)
//   Label        라벨 / 메타 (sans medium, 작음)
//   Caption      캡션 / 보조 (sans, 회색)
//
// tone prop 으로 색만 바꿈 — primary / muted / warm / inverse.
// 인라인 style override 가능하지만 가능한 prop 으로 표현 권장.
// ─────────────────────────────────────────────────────────

type Tone = 'default' | 'muted' | 'warm' | 'warmMuted' | 'primary' | 'inverse';

const toneColor: Record<Tone, string> = {
  default: colors.text,
  muted: colors.textMuted,
  warm: colors.textWarm,
  warmMuted: colors.textWarmMuted,
  primary: colors.primary,
  inverse: '#fff',
};

interface TypoProps extends TextProps {
  tone?: Tone;
}

function makeText(base: TextStyle) {
  return function Component({ style, tone = 'default', children, ...rest }: TypoProps) {
    return (
      <Text style={[base, { color: toneColor[tone] }, style]} {...rest}>
        {children}
      </Text>
    );
  };
}

// Pretendard 는 weight 별 별도 파일 — fontWeight 보단 fontFamily 직접 매핑이
// iOS/Android 양쪽에서 가장 정확.

// ─── Display — 큰 숫자 / hero ─────────
export const Display = makeText({
  fontFamily: fontFamily.extrabold,
  fontSize: fontSize.displayLg,
  lineHeight: fontSize.displayLg * lineHeight.tight,
  letterSpacing: -0.6,
});

export const DisplaySm = makeText({
  fontFamily: fontFamily.extrabold,
  fontSize: fontSize.display,
  lineHeight: fontSize.display * lineHeight.tight,
  letterSpacing: -0.5,
});

// ─── Headings ─────────────────────────────────
export const H1 = makeText({
  fontFamily: fontFamily.bold,
  fontSize: fontSize.h1,
  lineHeight: fontSize.h1 * lineHeight.tight,
  letterSpacing: -0.3,
});

export const H2 = makeText({
  fontFamily: fontFamily.bold,
  fontSize: fontSize.h2,
  lineHeight: fontSize.h2 * lineHeight.tight,
  letterSpacing: -0.2,
});

export const H3 = makeText({
  fontFamily: fontFamily.semibold,
  fontSize: fontSize.h3,
  lineHeight: fontSize.h3 * lineHeight.tight,
});

// ─── Body ────────────────────────────────────────
export const Body = makeText({
  fontFamily: fontFamily.body,
  fontSize: fontSize.body,
  lineHeight: fontSize.body * lineHeight.body,
});

export const BodyLg = makeText({
  fontFamily: fontFamily.body,
  fontSize: fontSize.bodyLg,
  lineHeight: fontSize.bodyLg * lineHeight.body,
});

export const BodyBold = makeText({
  fontFamily: fontFamily.semibold,
  fontSize: fontSize.body,
  lineHeight: fontSize.body * lineHeight.body,
});

// ─── Label / Caption ───────────────────
export const Label = makeText({
  fontFamily: fontFamily.medium,
  fontSize: fontSize.label,
  lineHeight: fontSize.label * lineHeight.base,
});

export const Caption = makeText({
  fontFamily: fontFamily.body,
  fontSize: fontSize.caption,
  lineHeight: fontSize.caption * lineHeight.base,
});

/** 작은 카테고리 / 섹션 라벨 (uppercase) */
export const Eyebrow = makeText({
  fontFamily: fontFamily.bold,
  fontSize: fontSize.caption,
  letterSpacing: 1.2,
  textTransform: 'uppercase' as TextStyle['textTransform'],
  lineHeight: fontSize.caption * lineHeight.base,
});

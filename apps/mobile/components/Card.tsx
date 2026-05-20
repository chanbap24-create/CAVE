import React from 'react';
import { View, Pressable, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { colors, spacing, borderRadius, shadow } from '@/constants/theme';
// shadow import 가 variant 안에서 spread 됨 — eslint unused 안 뜸.

// ─────────────────────────────────────────────────────────
// 카드 시스템 — 5등급 (2026-05-14 redesign A).
//
// 새 카드는 반드시 이 중 하나에 속하게. 1회만 등장하는 unique 카드는
// 내부 검토 후 추가. 자유로운 디자인 X — 시각 통일을 위한 강제 룰.
//
//   row       — 행 카드 (모임 일정 / 알림 / 메뉴). h-padding 만, 평면.
//   hero      — 매거진 hero (모임 큐레이션). cream 배경 + 강한 border.
//   polaroid  — 일기 / 픽 (사진 + 메모, 회전 액센트 옵션).
//   module    — 모듈 박스 (stats / badges 묶음).
//   plain     — 그리드 셀 등 border 없는 단순 컨테이너.
//
// onPress 주면 자동으로 Pressable + press feedback (살짝 scale).
// ─────────────────────────────────────────────────────────

type Variant = 'row' | 'hero' | 'polaroid' | 'module' | 'plain';

interface CardProps {
  variant?: Variant;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** 그림자 추가 (hero / floating 카드용) */
  elevated?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<Variant, ViewStyle> = {
  row: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,         // 16
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.md,
  },
  hero: {
    backgroundColor: colors.cream,         // 피치
    borderRadius: borderRadius.lg,         // 20
    padding: spacing.md,
    ...shadow.soft,                         // 코랄 톤 — 그림자 기본
  },
  polaroid: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,         // 10
    borderWidth: 1,
    borderColor: colors.border,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.md,
    ...shadow.soft,
  },
  module: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  plain: {
    backgroundColor: colors.background,
  },
};

export function Card({
  variant = 'row', onPress, onLongPress, style, elevated, children,
}: CardProps) {
  const baseStyle: StyleProp<ViewStyle> = [
    variantStyles[variant],
    elevated && shadow.soft,
    style,
  ];

  if (onPress || onLongPress) {
    return (
      <Pressable
        style={({ pressed }) => [baseStyle, pressed && styles.pressed]}
        onPress={onPress}
        onLongPress={onLongPress}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={baseStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  // 매거진 톤은 강한 인터랙션 X — opacity 약간만.
  pressed: { opacity: 0.85 },
});

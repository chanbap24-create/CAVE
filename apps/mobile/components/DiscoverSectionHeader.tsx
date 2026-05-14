import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { BodyBold, Caption, Eyebrow } from '@/components/Typography';
import { colors, spacing } from '@/constants/theme';

interface Props {
  title: string;
  subtitle?: string;
  /** 우측 액션 라벨 (default '더보기'). null 이면 미노출 */
  actionLabel?: string | null;
  onActionPress?: () => void;
  /** Eyebrow 라벨 — 섹션 위 작은 카테고리 표시 */
  eyebrow?: string;
}

/**
 * 섹션 헤더 — Eyebrow (선택) + Bold 한글 제목 + 우측 더보기.
 * 매거진 톤 통일 (2026-05-14 redesign A).
 */
export function DiscoverSectionHeader({ title, subtitle, actionLabel = '더보기', onActionPress, eyebrow }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={{ flex: 1 }}>
        {eyebrow ? <Eyebrow tone="warmMuted" style={styles.eyebrow}>{eyebrow}</Eyebrow> : null}
        <BodyBold tone="warm" style={styles.title}>{title}</BodyBold>
        {subtitle ? <Caption tone="warmMuted" style={styles.subtitle}>{subtitle}</Caption> : null}
      </View>
      {actionLabel && onActionPress ? (
        <Pressable onPress={onActionPress} hitSlop={6}>
          <Caption tone="primary" style={styles.action}>{actionLabel} ›</Caption>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, marginBottom: spacing.base, marginTop: spacing.xs,
  },
  eyebrow: { letterSpacing: 1.5, marginBottom: spacing.xs },
  title: { fontSize: 18, letterSpacing: -0.3 },
  subtitle: { marginTop: spacing.xs, lineHeight: 16 },
  action: { fontWeight: '600' },
});

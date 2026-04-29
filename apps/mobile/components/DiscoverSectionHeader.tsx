import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface Props {
  title: string;
  subtitle?: string;
  /** 우측 액션 라벨 (default '더보기'). null 이면 미노출 */
  actionLabel?: string | null;
  onActionPress?: () => void;
}

/**
 * Discover 섹션 헤더 — 트레바리/데일리샷 스타일의 에디토리얼 톤.
 * 모든 가로 스크롤/그리드 섹션 위에 일관되게 사용. 제목+부제 2줄 구조 +
 * 우측 액션(더보기). 섹션 간 시각적 리듬 통일.
 */
export function DiscoverSectionHeader({ title, subtitle, actionLabel = '더보기', onActionPress }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel && onActionPress ? (
        <Pressable onPress={onActionPress} hitSlop={6}>
          <Text style={styles.action}>{actionLabel} ›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 12, marginTop: 4,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: '#888', marginTop: 4, lineHeight: 16 },
  action: { fontSize: 12, color: '#7b2d4e', fontWeight: '600' },
});

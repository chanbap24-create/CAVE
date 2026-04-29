import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';

interface Props {
  description: string | null;
}

/**
 * 모임 상세의 "이 모임에 대해" — 호스트 long-form 본문. 마크다운 렌더.
 * 호스트가 자유롭게 글을 적으면 제목/굵게/목록 스타일링 자동 처리.
 */
export function GatheringDescriptionSection({ description }: Props) {
  if (!description || !description.trim()) return null;
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>이 모임에 대해</Text>
      <Markdown style={mdStyles}>{description}</Markdown>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 36, paddingHorizontal: 20 },
  title: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', letterSpacing: -0.3, marginBottom: 12 },
});

const mdStyles = {
  body: { color: '#333', fontSize: 15, lineHeight: 24 },
  heading1: { color: '#1a1a1a', fontSize: 20, fontWeight: '700' as const, marginTop: 18, marginBottom: 8 },
  heading2: { color: '#1a1a1a', fontSize: 17, fontWeight: '700' as const, marginTop: 16, marginBottom: 6 },
  heading3: { color: '#1a1a1a', fontSize: 15, fontWeight: '700' as const, marginTop: 14, marginBottom: 4 },
  strong: { fontWeight: '700' as const, color: '#1a1a1a' },
  em: { fontStyle: 'italic' as const },
  bullet_list: { marginTop: 6, marginBottom: 6 },
  ordered_list: { marginTop: 6, marginBottom: 6 },
  list_item: { marginVertical: 2 },
  paragraph: { marginTop: 8, marginBottom: 8 },
  link: { color: '#7b2d4e', textDecorationLine: 'underline' as const },
  blockquote: {
    backgroundColor: '#fdf6f8', borderLeftWidth: 3, borderLeftColor: '#7b2d4e',
    paddingHorizontal: 12, paddingVertical: 8, marginVertical: 8,
  },
};

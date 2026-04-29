import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { CardTemplateHero } from '@/components/CardTemplateHero';
import { getCardTemplate } from '@/lib/constants/cardTemplates';

interface Props {
  templateKey: string;
  title: string;
  subtitle: string;
  imageUri: string | null;
}

/**
 * 모임 만들기 폼 상단의 라이브 프리뷰. 입력값(제목/부제/이미지)이나 선택한
 * 템플릿이 바뀌면 즉시 hero 가 다시 그려진다 — WYSIWYG.
 */
export function GatheringLivePreview({ templateKey, title, subtitle, imageUri }: Props) {
  const template = getCardTemplate(templateKey);
  // 화면 폭의 약 70% 까지 — 폼 안에서도 큰 카드로 인상 검증.
  const screen = Dimensions.get('window').width;
  const heroSize = Math.min(280, screen - 80);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>미리보기</Text>
      <View style={styles.frame}>
        <CardTemplateHero
          template={template}
          width={heroSize}
          title={title || undefined}
          subtitle={subtitle || undefined}
          imageUrl={imageUri}
        />
      </View>
      <Text style={styles.hint}>
        제목·부제·이미지·디자인을 바꾸면 이 미리보기가 즉시 갱신돼요.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginTop: 4, marginBottom: 8 },
  label: { fontSize: 12, fontWeight: '600', color: '#999', alignSelf: 'flex-start', marginBottom: 8 },
  frame: {
    borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  hint: { fontSize: 11, color: '#bbb', marginTop: 10, textAlign: 'center' },
});

import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { CardTemplateHero } from '@/components/CardTemplateHero';
import {
  CARD_TEMPLATES,
  CARD_TEMPLATE_CATEGORY_LABELS,
  type CardTemplate,
  type CardTemplateCategory,
} from '@/lib/constants/cardTemplates';

interface Props {
  /** 선택된 템플릿 key */
  value: string;
  onChange: (key: string) => void;
}

const THUMB_WIDTH = 130;
const CATEGORY_ORDER: CardTemplateCategory[] = ['basic', 'mood', 'season'];

/**
 * 모임 개설 시 카드 디자인을 고르는 picker.
 *
 * 카테고리(기본/무드/시즌)별로 가로 스크롤 섹션을 분리 → 템플릿이 늘어도
 * 한 줄에서 끝없이 스크롤하는 단조로움 없이 위계 있게 탐색 가능.
 *
 * 각 썸네일은 실제 hero 와 동일한 컴포넌트로 렌더되어 결과가 그대로 보이고,
 * numberLabel 은 템플릿 고유값(1~12)으로 노출 — 실제 카드는 행 위치로 override.
 */
export function CardTemplatePicker({ value, onChange }: Props) {
  const grouped = groupByCategory(CARD_TEMPLATES);
  return (
    <View style={styles.wrap}>
      {CATEGORY_ORDER.map(cat => {
        const items = grouped[cat];
        if (!items || items.length === 0) return null;
        return (
          <View key={cat} style={styles.section}>
            <Text style={styles.sectionLabel}>
              {CARD_TEMPLATE_CATEGORY_LABELS[cat]}
            </Text>
            <ScrollView
              horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scroll}
            >
              {items.map(t => {
                const selected = t.key === value;
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => onChange(t.key)}
                    style={[styles.item, selected && styles.itemSelected]}
                  >
                    <CardTemplateHero template={t} width={THUMB_WIDTH} />
                    <Text style={[styles.name, selected && styles.nameSelected]} numberOfLines={1}>
                      {t.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        );
      })}
    </View>
  );
}

function groupByCategory(items: CardTemplate[]): Record<CardTemplateCategory, CardTemplate[]> {
  return items.reduce((acc, t) => {
    (acc[t.category] = acc[t.category] || []).push(t);
    return acc;
  }, {} as Record<CardTemplateCategory, CardTemplate[]>);
}

const styles = StyleSheet.create({
  wrap: { marginTop: 4 },
  section: { marginTop: 10 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#999',
    letterSpacing: 0.6, marginBottom: 6,
  },
  scroll: { paddingVertical: 4, paddingRight: 12, gap: 10 },
  item: {
    borderWidth: 2, borderColor: 'transparent', borderRadius: 12,
    padding: 2, alignItems: 'center',
  },
  itemSelected: { borderColor: '#7b2d4e' },
  name: { fontSize: 11, color: '#666', marginTop: 6, fontWeight: '600' },
  nameSelected: { color: '#7b2d4e' },
});

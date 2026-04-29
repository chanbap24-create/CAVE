import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { getDiscoverCardWidth, CARD_GAP } from '@/lib/utils/discoverCardWidth';
import { CardTemplateHero } from '@/components/CardTemplateHero';
import { getCardTemplate } from '@/lib/constants/cardTemplates';

const CARD_WIDTH = getDiscoverCardWidth();
const HERO_INSET = 1; // 카드 테두리 안쪽으로 1px 여유

interface TagSpec {
  label: string;
  bg: string;
  fg: string;
}

interface Props {
  /** 호스트가 모임 만들 때 고른 hero 템플릿 키 */
  cardTemplate?: string | null;
  /** 행 내 카드 위치 (1-based) — hero 큰 숫자에 노출 */
  slotNumber?: number;
  /** 호스트 타입/카테고리 태그 — 본문 strip 좌측 */
  tag?: TagSpec | null;
  /** 호스트(강사) 아바타 URL */
  avatarUrl?: string | null;
  avatarFallback?: string;
  /** 호스트 이름 */
  hostName: string;
  /** 호스트 부가 정보 (예: '와인 디렉터') */
  hostSubtitle?: string | null;
  /** 모임 제목 — hero 안에 variant 별 위치로 노출 */
  title: string;
  /** 부제 — hero 안 title 아래 작은 카피 */
  subtitle?: string | null;
  /** 커버 이미지 URL — hero variant 별 위치/크기로 노출 */
  coverImageUrl?: string | null;
  /** 일정 + 장소 (예: '4/29 · 청담') */
  metaLine?: string | null;
  onPress?: () => void;
}

/**
 * Discover 모임 카드 — 정사각 hero(컬러 + 숫자 + 모티프 + 제목) + 슬림 본문 strip.
 *
 * 제목은 hero 안에서 template.layout (signature / magazine / cover) 별로 다른
 * 위치에 노출 → 행 안에서 카드들이 똑같이 안 생기고 다양성 확보.
 *
 * 본문 strip 은 모든 variant 통일: tag · 호스트 작은 아바타 · 이름 · 메타.
 * 카드 높이가 일정해서 가로 스크롤 시각 리듬이 깨지지 않음.
 */
export function GatheringPreviewCard({
  cardTemplate, slotNumber, tag, avatarUrl, avatarFallback,
  hostName, hostSubtitle, title, subtitle, coverImageUrl, metaLine,
  onPress,
}: Props) {
  const template = getCardTemplate(cardTemplate);
  const heroSize = CARD_WIDTH - HERO_INSET * 2;
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.heroWrap}>
        <CardTemplateHero
          template={template}
          width={heroSize}
          numberOverride={slotNumber}
          title={title}
          subtitle={subtitle || undefined}
          imageUrl={coverImageUrl}
        />
      </View>

      <View style={styles.body}>
        <View style={styles.row}>
          {tag ? (
            <View style={[styles.tag, { backgroundColor: tag.bg }]}>
              <Text style={[styles.tagText, { color: tag.fg }]}>{tag.label}</Text>
            </View>
          ) : <View />}
          <View style={styles.hostRow}>
            {avatarUrl ? (
              <Image source={avatarUrl} style={styles.avatar} contentFit="cover" cachePolicy="memory-disk" />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarChar}>{(avatarFallback || '?').toUpperCase()}</Text>
              </View>
            )}
            <Text style={styles.hostName} numberOfLines={1}>
              {hostName}{hostSubtitle ? ` · ${hostSubtitle}` : ''}
            </Text>
          </View>
        </View>

        {metaLine ? <Text style={styles.meta} numberOfLines={1}>{metaLine}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH, marginRight: CARD_GAP,
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: '#eee',
    overflow: 'hidden',
  },
  heroWrap: { padding: HERO_INSET },
  body: { paddingTop: 10, paddingBottom: 12, paddingHorizontal: 12 },

  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  tag: {
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4,
  },
  tagText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.4 },

  hostRow: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, marginLeft: 6 },
  avatar: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#f0eaec' },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  avatarChar: { fontSize: 9, fontWeight: '700', color: '#999' },
  hostName: { fontSize: 11, color: '#666', marginLeft: 5, fontWeight: '600', flexShrink: 1 },

  meta: { fontSize: 11, color: '#888', marginTop: 6, fontWeight: '500' },
});

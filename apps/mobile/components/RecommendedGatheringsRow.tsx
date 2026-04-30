import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { RecommendedGathering } from '@/lib/hooks/useRecommendedGatherings';
import {
  getSnapInterval, HORIZONTAL_PADDING,
} from '@/lib/utils/discoverCardWidth';
import { DiscoverSectionHeader } from '@/components/DiscoverSectionHeader';
import { GatheringPreviewCard } from '@/components/GatheringPreviewCard';

interface Props {
  recs: RecommendedGathering[];
}

const SNAP = getSnapInterval();

/**
 * 셀러 기반 추천 모임 — 발견(Discover) 탭의 GatheringPreviewCard 와 동일 프레임.
 *
 * 카드 디자인을 한 곳에서 관리하기 위해 cellar 탭 자체 카드 대신 Discover 카드를
 * 그대로 사용. match_reason ("내 셀러의 ◯◯와 어울리는 모임") 은 카드 본문 strip
 * 의 tag 슬롯에 노출.
 *
 * docs/icave_concept_updates.md §2 cellar 흡수 항목 #5.
 */
export function RecommendedGatheringsRow({ recs }: Props) {
  const router = useRouter();
  if (recs.length === 0) return null;
  return (
    <View style={styles.wrap}>
      <DiscoverSectionHeader
        title="내 셀러 기반 추천 모임"
        onActionPress={() => router.push('/(tabs)/explore')}
      />
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP} decelerationRate="fast"
        contentContainerStyle={styles.row}
      >
        {recs.map((g, idx) => (
          <GatheringPreviewCard
            key={g.id}
            cardTemplate={g.card_template}
            slotNumber={idx + 1}
            // match_reason 우선, 없으면 호스트 타입(파트너) 또는 카테고리 fallback
            tag={
              g.match_reason
                ? { label: g.match_reason, bg: '#7b2d4e', fg: '#fff' }
                : g.category
                  ? { label: g.category, bg: '#f7f0f3', fg: '#7b2d4e' }
                  : null
            }
            avatarUrl={g.host?.avatar_url}
            avatarFallback={
              (g.host?.partner_label || g.host?.display_name || g.host?.username || '?')[0]
            }
            hostName={g.host?.partner_label || g.host?.display_name || g.host?.username || '호스트'}
            hostSubtitle={g.host?.is_partner ? '파트너' : null}
            title={g.title}
            subtitle={g.subtitle}
            coverImageUrl={g.cover_image_url}
            metaLine={
              `${g.gathering_date ? formatDate(g.gathering_date) : '일정 미정'}` +
              `${g.location ? ` · ${g.location}` : ''}`
            }
            onPress={() => router.push(`/gathering/${g.id}?from=cellar` as any)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${['일', '월', '화', '수', '목', '금', '토'][d.getDay()]}`;
}

const styles = StyleSheet.create({
  wrap: { marginTop: 24 },
  row: { paddingLeft: HORIZONTAL_PADDING, paddingRight: HORIZONTAL_PADDING / 2 },
});

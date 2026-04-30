import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { Gathering, GatheringHostType } from '@/lib/hooks/useGatherings';
import {
  getSnapInterval, HORIZONTAL_PADDING,
} from '@/lib/utils/discoverCardWidth';
import { DiscoverSectionHeader } from '@/components/DiscoverSectionHeader';
import { GatheringPreviewCard } from '@/components/GatheringPreviewCard';

const PARTNER_LIMIT = 8;
const SNAP = getSnapInterval();

interface Props {
  gatherings: Gathering[];
  /** 섹션 제목 (default "샵·소믈리에 모임") */
  title?: string;
}

/**
 * 파트너 모임 가로 스크롤. host_type != 'user' 인 모임만.
 * 카드는 GatheringPreviewCard 공용 프레임 사용 (사진 없이 강사 아바타 + 텍스트).
 */
export function PartnerGatheringsRow({ gatherings, title = '샵·소믈리에 모임' }: Props) {
  const router = useRouter();
  const partnerEvents = gatherings
    .filter(g => g.host_type !== 'user' && g.status === 'open' && g.gathering_date)
    .slice(0, PARTNER_LIMIT);
  return (
    <View style={styles.wrap}>
      <DiscoverSectionHeader
        title={title}
        onActionPress={() => router.push('/(tabs)/gatherings')}
      />
      {partnerEvents.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>곧 합류할 파트너 샵 모임을 준비 중이에요</Text>
          <Text style={styles.emptySub}>샵·소믈리에 큐레이션 모임이 여기 노출됩니다</Text>
        </View>
      ) : (
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          snapToInterval={SNAP} decelerationRate="fast"
          contentContainerStyle={styles.row}
        >
          {partnerEvents.map((g, idx) => (
            <GatheringPreviewCard
              key={g.id}
              cardTemplate={g.card_template}
              slotNumber={idx + 1}
              tag={{ label: labelOfHostType(g.host_type), bg: '#231115', fg: '#fff' }}
              avatarUrl={g.host?.avatar_url}
              avatarFallback={(g.host?.partner_label || g.host?.display_name || g.host?.username || '?')[0]}
              hostName={g.host?.partner_label || g.host?.display_name || g.host?.username || '파트너'}
              hostSubtitle={hostSubtitleFor(g.host_type)}
              title={g.title}
              subtitle={g.subtitle}
              coverImageUrl={g.cover_image_url}
              metaLine={`${formatDate(g.gathering_date!)}${g.location ? ` · ${g.location}` : ''}`}
              onPress={() => router.push(`/gathering/${g.id}?from=home` as any)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function labelOfHostType(t: GatheringHostType): string {
  switch (t) {
    case 'shop': return '샵 직영';
    case 'sommelier': return '소믈리에';
    case 'venue': return '업장';
    default: return '파트너';
  }
}

function hostSubtitleFor(t: GatheringHostType): string | null {
  switch (t) {
    case 'shop': return '와인샵 큐레이션';
    case 'sommelier': return '소믈리에';
    case 'venue': return '업장 직영';
    default: return null;
  }
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${['일', '월', '화', '수', '목', '금', '토'][d.getDay()]}`;
}

const styles = StyleSheet.create({
  wrap: { marginTop: 48 },
  row: { paddingLeft: HORIZONTAL_PADDING, paddingRight: HORIZONTAL_PADDING / 2 },

  empty: {
    marginHorizontal: 16, paddingVertical: 18, paddingHorizontal: 16,
    backgroundColor: '#231115', borderRadius: 10,
  },
  emptyTitle: { fontSize: 13, fontWeight: '600', color: '#fff' },
  emptySub: { fontSize: 12, color: '#bba1ac', marginTop: 4 },
});

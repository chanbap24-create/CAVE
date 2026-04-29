import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { Gathering } from '@/lib/hooks/useGatherings';
import {
  getSnapInterval, HORIZONTAL_PADDING,
} from '@/lib/utils/discoverCardWidth';
import { DiscoverSectionHeader } from '@/components/DiscoverSectionHeader';
import { GatheringPreviewCard } from '@/components/GatheringPreviewCard';

const SNAP = getSnapInterval();

interface Props {
  gatherings: Gathering[];
  /** 섹션 제목 (default "유저 모임") */
  title?: string;
}

/**
 * 유저 모임 가로 스크롤. host_type === 'user' 만.
 * 카드는 GatheringPreviewCard 공용 프레임 사용 — 강사 아바타 + 제목 + 일정.
 * 가격/모집인원은 상세 진입 후만 노출.
 */
export function UserGatheringsRow({ gatherings, title = '유저 모임' }: Props) {
  const router = useRouter();
  const upcoming = gatherings
    .filter(g => g.host_type === 'user' && g.status === 'open' && g.gathering_date)
    .slice(0, 8);
  return (
    <View style={styles.wrap}>
      <DiscoverSectionHeader
        title={title}
        onActionPress={() => router.push('/(tabs)/gatherings')}
      />
      {upcoming.length === 0 ? (
        <Pressable style={styles.empty} onPress={() => router.push('/(tabs)/gatherings')}>
          <Text style={styles.emptyTitle}>아직 예정된 유저 모임이 없어요</Text>
          <Text style={styles.emptySub}>첫 모임을 만들고 셀러 친구들을 초대해보세요 →</Text>
        </Pressable>
      ) : (
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          snapToInterval={SNAP} decelerationRate="fast"
          contentContainerStyle={styles.row}
        >
          {upcoming.map((g, idx) => (
            <GatheringPreviewCard
              key={g.id}
              cardTemplate={g.card_template}
              slotNumber={idx + 1}
              tag={g.category ? { label: g.category, bg: '#f7f0f3', fg: '#7b2d4e' } : null}
              avatarUrl={g.host?.avatar_url}
              avatarFallback={(g.host?.display_name || g.host?.username || '?')[0]}
              hostName={g.host?.display_name || g.host?.username || '호스트'}
              hostSubtitle={null}
              title={g.title}
              subtitle={g.subtitle}
              coverImageUrl={g.cover_image_url}
              metaLine={`${formatDate(g.gathering_date!)}${g.location ? ` · ${g.location}` : ''}`}
              onPress={() => router.push(`/gathering/${g.id}` as any)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${['일', '월', '화', '수', '목', '금', '토'][d.getDay()]}`;
}

const styles = StyleSheet.create({
  wrap: { marginTop: 32 },
  row: { paddingLeft: HORIZONTAL_PADDING, paddingRight: HORIZONTAL_PADDING / 2 },

  empty: {
    marginHorizontal: 16, paddingVertical: 18, paddingHorizontal: 16,
    backgroundColor: '#fafafa', borderRadius: 10, alignItems: 'flex-start',
  },
  emptyTitle: { fontSize: 13, fontWeight: '600', color: '#444' },
  emptySub: { fontSize: 12, color: '#7b2d4e', marginTop: 4, fontWeight: '500' },
});

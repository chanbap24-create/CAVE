import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import type { Gathering } from '@/lib/hooks/useGatherings';
import {
  getDiscoverCardWidth, getSnapInterval, HORIZONTAL_PADDING, CARD_GAP,
} from '@/lib/utils/discoverCardWidth';
import { DiscoverSectionHeader } from '@/components/DiscoverSectionHeader';

const CARD_WIDTH = getDiscoverCardWidth();
const SNAP = getSnapInterval();

interface Props {
  gatherings: Gathering[];
  /** 섹션 제목 (default "유저 모임") */
  title?: string;
}

/**
 * Discover 의 "유저 모임" 가로 스크롤. 큐레이션 위계의 하위 — 큐레이션 강도가
 * 약한 일반 사용자 호스팅 모임. 시즌 클럽/시음회 가 본격화되면 시각적으로 더
 * 단순한 카드로 두어 위계가 자연스럽게 드러나게 한다.
 */
export function UserGatheringsRow({ gatherings, title = '유저 모임' }: Props) {
  const router = useRouter();
  const upcoming = gatherings
    // user 타입만 — 파트너 모임은 PartnerGatheringsRow 가 노출
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
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={SNAP}
          decelerationRate="fast"
          contentContainerStyle={styles.row}
        >
          {upcoming.map(g => (
            <Pressable key={g.id} style={styles.card} onPress={() => router.push(`/gathering/${g.id}` as any)}>
              <View style={styles.imgWrap}>
                <Image source={{ uri: g.wine_previews[0]?.image_url || g.wine_previews[0]?.photo_url || '' }} style={styles.img} />
              </View>
              <View style={styles.body}>
                <Text style={styles.cardTitle} numberOfLines={2}>{g.title}</Text>
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {formatDate(g.gathering_date!)}{g.location ? ` · ${g.location}` : ''}
                </Text>
              </View>
              <View style={styles.footer}>
                <Text style={styles.cardSeats}>{g.current_members}/{g.max_members} 참여</Text>
              </View>
            </Pressable>
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
  card: {
    width: CARD_WIDTH, marginRight: CARD_GAP,
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#eee',
    overflow: 'hidden',
  },
  imgWrap: { backgroundColor: '#f5f5f5' },
  img: { width: '100%', height: 110, backgroundColor: '#efe4ea' },
  body: { paddingHorizontal: 12, paddingTop: 10 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#222', lineHeight: 18 },
  cardMeta: { marginTop: 4, fontSize: 11, color: '#666' },
  footer: {
    paddingHorizontal: 12, paddingVertical: 10, marginTop: 8,
    borderTopWidth: 1, borderTopColor: '#f0f0f0',
  },
  cardSeats: { fontSize: 11, color: '#999' },

  empty: {
    marginHorizontal: 16, paddingVertical: 18, paddingHorizontal: 16,
    backgroundColor: '#fafafa', borderRadius: 10, alignItems: 'flex-start',
  },
  emptyTitle: { fontSize: 13, fontWeight: '600', color: '#444' },
  emptySub: { fontSize: 12, color: '#7b2d4e', marginTop: 4, fontWeight: '500' },
});

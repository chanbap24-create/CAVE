import React from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import type { Gathering, GatheringHostType } from '@/lib/hooks/useGatherings';

// Discover 화면 한 페이지당 노출할 파트너 모임 수 (2열 × 3행 = 6개).
// 더 보고 싶으면 '더보기' 로 모임 탭 이동.
const PARTNER_PAGE_LIMIT = 6;

interface Props {
  gatherings: Gathering[];
  /** 섹션 제목 (default "샵·소믈리에 모임") */
  title?: string;
}

/**
 * Discover §4 위계의 샵 큐레이션 슬롯. 시즌 클럽(히어로) 와 유저 모임 사이.
 *
 * 큐레이션 강도 ↑ → 카드도 시각적으로 더 프리미엄:
 *   - 호스트 라벨 우선 노출 (예: "ABC 와인샵", "소믈리에 김XX")
 *   - 호스트 타입 배지 (샵 / 소믈리에 / 업장)
 *   - 가격 (price_per_person) 강조
 *
 * 파트너 자격(profiles.is_partner) + host_type != 'user' 인 모임만 진입.
 * 파트너가 모임 올리는 흐름은 form 에 host_type 셀렉터로 v1 추가, 권한은
 * DB trigger(enforce_partner_host_type) 가 강제.
 */
export function PartnerGatheringsRow({ gatherings, title = '샵·소믈리에 모임' }: Props) {
  const router = useRouter();
  const partnerEvents = gatherings
    .filter(g => g.host_type !== 'user' && g.status === 'open' && g.gathering_date)
    .slice(0, PARTNER_PAGE_LIMIT);
  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        <Pressable onPress={() => router.push('/(tabs)/gatherings')} hitSlop={6}>
          <Text style={styles.more}>더보기</Text>
        </Pressable>
      </View>
      {partnerEvents.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>곧 합류할 파트너 샵 모임을 준비 중이에요</Text>
          <Text style={styles.emptySub}>샵·소믈리에 큐레이션 모임이 여기 노출됩니다</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {partnerEvents.map(g => (
            <Pressable key={g.id} style={styles.card} onPress={() => router.push(`/gathering/${g.id}` as any)}>
              <View style={styles.imgWrap}>
                <Image source={{ uri: g.wine_previews[0]?.image_url || g.wine_previews[0]?.photo_url || '' }} style={styles.img} />
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{labelOfHostType(g.host_type)}</Text>
                </View>
              </View>
              <Text style={styles.host} numberOfLines={1}>
                {g.host?.partner_label || g.host?.display_name || g.host?.username || '파트너'}
              </Text>
              <Text style={styles.cardTitle} numberOfLines={2}>{g.title}</Text>
              <Text style={styles.cardMeta} numberOfLines={1}>
                {formatDate(g.gathering_date!)}{g.location ? ` · ${g.location}` : ''}
              </Text>
              <View style={styles.footer}>
                <Text style={styles.cardSeats}>{g.current_members}/{g.max_members}</Text>
                {g.price_per_person ? (
                  <Text style={styles.price}>{formatKRW(g.price_per_person)}</Text>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
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

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${['일', '월', '화', '수', '목', '금', '토'][d.getDay()]}`;
}

function formatKRW(n: number) {
  return `₩${n.toLocaleString('ko-KR')}`;
}

const styles = StyleSheet.create({
  wrap: { marginTop: 24 },
  titleRow: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
    paddingHorizontal: 16, marginBottom: 10,
  },
  title: { fontSize: 15, fontWeight: '700', color: '#222' },
  more: { fontSize: 12, color: '#7b2d4e', fontWeight: '600' },
  // 2열 그리드: 가로 패딩 16 + 카드 사이 간격 12. 카드는 width '48.5%' 로
  // 한 행에 정확히 2개. flexWrap 으로 행이 자동 추가.
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 12,
  },
  card: {
    width: '48.5%',
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#eee',
    overflow: 'hidden',
  },
  imgWrap: { position: 'relative', backgroundColor: '#f0eaec' },
  img: { width: '100%', height: 130 },
  typeBadge: {
    position: 'absolute', left: 8, top: 8,
    backgroundColor: 'rgba(35,17,21,0.9)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4,
  },
  typeBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  host: {
    fontSize: 11, fontWeight: '700', color: '#7b2d4e',
    paddingHorizontal: 12, paddingTop: 10,
  },
  cardTitle: {
    fontSize: 13, fontWeight: '600', color: '#222', lineHeight: 18,
    paddingHorizontal: 12, paddingTop: 4,
  },
  cardMeta: {
    fontSize: 11, color: '#666',
    paddingHorizontal: 12, paddingTop: 4,
  },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10, marginTop: 4,
    borderTopWidth: 1, borderTopColor: '#f0f0f0',
  },
  cardSeats: { fontSize: 11, color: '#999' },
  price: { fontSize: 12, fontWeight: '700', color: '#222' },

  empty: {
    marginHorizontal: 16, paddingVertical: 18, paddingHorizontal: 16,
    backgroundColor: '#231115', borderRadius: 10,
  },
  emptyTitle: { fontSize: 13, fontWeight: '600', color: '#fff' },
  emptySub: { fontSize: 12, color: '#bba1ac', marginTop: 4 },
});

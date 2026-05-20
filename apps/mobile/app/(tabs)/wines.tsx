import React, { useState } from 'react';
import {
  View, Text, TextInput, FlatList, ScrollView, Pressable, StyleSheet, ActivityIndicator, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CardImage } from '@/components/CardImage';
import { useWineSearch } from '@/lib/hooks/useWineSearch';
import { useIsPartner } from '@/lib/hooks/useIsPartner';
import { usePartnerWineMenu } from '@/lib/hooks/usePartnerWineMenu';
import { useAllPartnerSales, type PartnerSale } from '@/lib/hooks/useAllPartnerSales';
import { PartnerMenuList } from '@/components/PartnerMenuList';
import { TrendingDrinks } from '@/components/TrendingDrinks';
import { BodyBold, Body, Caption, Eyebrow } from '@/components/Typography';
import { Button } from '@/components/Button';
import { useReadyWithImages } from '@/lib/hooks/useReadyWithImages';
import { colors, spacing, borderRadius, fontSize, fontFamily } from '@/constants/theme';

type Mode = 'browse' | 'menu';

/**
 * 주류 검색 탭. 두 모드:
 *   - browse : 와인 카탈로그 검색 (모든 사용자)
 *   - menu   : 본인 판매 와인 관리 (파트너만 노출)
 */
export default function WinesSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isPartner } = useIsPartner();
  const [mode, setMode] = useState<Mode>('browse');

  return (
    <View style={styles.container}>
      <View style={[styles.topPad, { paddingTop: insets.top + spacing.sm }]} />

      {isPartner && (
        <View style={styles.segmentedWrap}>
          <Segmented label="탐색" active={mode === 'browse'} onPress={() => setMode('browse')} />
          <Segmented label="내 메뉴" active={mode === 'menu'} onPress={() => setMode('menu')} />
        </View>
      )}

      {mode === 'browse' ? <BrowseMode router={router} /> : <PartnerMenuMode />}
    </View>
  );
}

function Segmented({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.segment, active && styles.segmentActive]} onPress={onPress}>
      <Body style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Body>
    </Pressable>
  );
}

/**
 * 브라우즈 모드.
 *  - 검색어 비어있음: 판매 중인 와인 리스트 (모든 파트너) 노출 — 마켓플레이스 톤
 *  - 검색어 입력: 와인 카탈로그 검색 결과 (wines 테이블 전체)
 */
function BrowseMode({ router }: { router: ReturnType<typeof useRouter> }) {
  const { results, loading: searchLoading, searchWines, clearResults } = useWineSearch();
  const { sales, loading: salesLoading } = useAllPartnerSales();
  const [query, setQuery] = useState('');

  const isSearching = query.trim().length >= 2;

  function handleChange(text: string) {
    setQuery(text);
    if (text.trim().length < 2) clearResults();
    else searchWines(text.trim(), 30);
  }

  return (
    <>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={handleChange}
          placeholder="와인 이름 / 생산자 / 지역 검색"
          placeholderTextColor={colors.textLight}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => { setQuery(''); clearResults(); }} hitSlop={8}>
            <Caption tone="muted" style={styles.clear}>✕</Caption>
          </Pressable>
        )}
      </View>

      {isSearching ? (
        <SearchResultList
          results={results}
          loading={searchLoading}
          onTap={(id) => router.push(`/catalog/${id}?from=wines` as any)}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
          {/* sales 카드 tap = 카탈로그 (와인 자세한 정보 + 셀러 리스트 + 구매 버튼).
              구매는 카탈로그의 sellers 행 옆 "구매" 버튼 또는 하단 CTA 로. */}
          <SalesList
            sales={sales}
            loading={salesLoading}
            onTap={(wineId) => router.push({ pathname: '/catalog/[wineId]', params: { wineId: String(wineId), from: 'wines' } } as any)}
          />
          <View style={styles.trendingWrap}>
            <View style={styles.trendingHeader}>
              <BodyBold tone="warm" style={styles.trendingTitle}>트렌딩 주류</BodyBold>
              <Caption tone="warmMuted" style={styles.trendingSub}>최근 셀러에 많이 추가된 보틀</Caption>
            </View>
            <TrendingDrinks />
          </View>
        </ScrollView>
      )}
    </>
  );
}

function SearchResultList({
  results, loading, onTap,
}: {
  results: { id: number; name: string; name_ko: string | null; country: string | null; region: string | null }[];
  loading: boolean;
  onTap: (id: number) => void;
}) {
  if (loading) return <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />;
  if (results.length === 0) {
    return (
      <Caption tone="warmMuted" style={styles.empty}>
        검색 결과가 없어요. 라벨을 스캔하면 셀러에 등록되며 여기서도 찾을 수 있어요.
      </Caption>
    );
  }
  return (
    <FlatList
      data={results}
      keyExtractor={r => String(r.id)}
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => (
        <Pressable style={styles.row} onPress={() => onTap(item.id)}>
          <View style={{ flex: 1 }}>
            <BodyBold tone="warm" numberOfLines={1}>{item.name}</BodyBold>
            {item.name_ko && (
              <Caption tone="warmMuted" numberOfLines={1} style={{ marginTop: 2 }}>{item.name_ko}</Caption>
            )}
            <Caption tone="muted" style={{ marginTop: spacing.xs }}>
              {[item.country, item.region].filter(Boolean).join(' · ') || '지역 정보 없음'}
            </Caption>
          </View>
          <Caption tone="muted" style={styles.rowChevron}>›</Caption>
        </Pressable>
      )}
    />
  );
}

// 한 줄에 2.3장 보이는 카드 (데일리샷 톤) — 좌패딩 + (카드 + gap) × 2 + 0.3 카드 peek.
const SALES_PADDING = 16;
const SALES_GAP = 12;
const SALES_CARD_W = Math.floor(
  (Dimensions.get('window').width - SALES_PADDING - SALES_GAP * 2) / 2.3,
);

function SalesList({
  sales, loading, onTap,
}: {
  sales: PartnerSale[];
  loading: boolean;
  /** 와인 ID — 카탈로그 진입용 */
  onTap: (wineId: number) => void;
}) {
  // 이미지 prefetch 가 끝날 때까지 spinner — 데이터 + 이미지 한꺼번에 reveal.
  const imageUrls = React.useMemo(() => sales.map(s => s.wine?.image_url ?? null), [sales]);
  const ready = useReadyWithImages(imageUrls);

  if ((loading && sales.length === 0) || !ready) {
    return <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />;
  }
  if (sales.length === 0) {
    return (
      <View style={styles.hintWrap}>
        <BodyBold tone="warm">판매 중인 와인이 아직 없어요</BodyBold>
        <Caption tone="warmMuted" style={styles.hint}>
          파트너가 메뉴를 등록하면 여기서 둘러볼 수 있어요. 검색바로 카탈로그를 찾아보세요.
        </Caption>
      </View>
    );
  }
  return (
    <View>
      {/* 섹션 헤더 — 큰 sans bold + sub + 더보기 (데일리샷 패턴) */}
      <View style={styles.salesHeader}>
        <View style={{ flex: 1 }}>
          <BodyBold tone="warm" style={styles.salesTitle}>지금 판매 중인 와인</BodyBold>
          <Caption tone="warmMuted" style={styles.salesSub}>파트너가 직접 선별한 보틀</Caption>
        </View>
        <Caption tone="warmMuted">더보기</Caption>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SALES_CARD_W + SALES_GAP}
        decelerationRate="fast"
        contentContainerStyle={styles.salesScroll}
      >
        {sales.map(item => {
          const partnerLabel = item.partner?.partner_label || item.partner?.display_name || item.partner?.username || '파트너';
          const vintage = item.vintage_year ?? item.wine?.vintage_year;
          const region = [item.wine?.region, vintage].filter(Boolean).join(' · ');
          const photo = item.photo_url || item.wine?.image_url;
          const discountPct = item.original_price && item.original_price > item.price
            ? Math.round(((item.original_price - item.price) / item.original_price) * 100)
            : null;
          return (
            <Pressable
              key={item.id}
              style={[styles.saleCard, { width: SALES_CARD_W }]}
              onPress={() => onTap(item.wine_id)}
            >
              <View style={[styles.saleImgWrap, { width: SALES_CARD_W, height: SALES_CARD_W }]}>
                {photo ? (
                  <CardImage source={photo} style={styles.saleImg} contentFit="contain" />
                ) : (
                  <View style={styles.saleImgEmpty} />
                )}
              </View>

              <View style={styles.saleBody}>
                <View style={styles.partnerChip}>
                  <Caption tone="primary" style={styles.partnerChipText}>{partnerLabel}</Caption>
                </View>
                {item.note ? (
                  <Caption tone="muted" style={styles.saleNote} numberOfLines={1}>{item.note}</Caption>
                ) : null}
                <BodyBold tone="warm" numberOfLines={2} style={styles.saleName}>
                  {item.wine?.name ?? '와인'}
                </BodyBold>
                <View style={styles.salePriceRow}>
                  {discountPct != null ? (
                    <Text style={styles.discount}>{discountPct}%</Text>
                  ) : null}
                  <Text style={styles.salePrice}>
                    {item.price.toLocaleString('ko-KR')}<Text style={styles.salePriceUnit}>원</Text>
                  </Text>
                </View>
                {item.original_price && discountPct != null ? (
                  <Caption tone="muted" style={styles.originalPrice}>
                    {item.original_price.toLocaleString('ko-KR')}원
                  </Caption>
                ) : null}
                {region ? <Caption tone="muted" style={styles.saleMeta}>{region}</Caption> : null}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// 헤더 우상단 + 버튼은 Mode 안에서 sheet visibility 를 제어해야 해서
// 부모(WinesSearchScreen) 가 button + sheet 를 알아야 함. 단순화를 위해
// PartnerMenuMode 가 자체적으로 sheet 관리하고, 헤더 + 는 별도 prop drill 없이
// 파트너 메뉴 모드 내부 trigger 로 흡수.
function AddPartnerMenuButton() {
  // 실제 + 동작은 PartnerMenuMode 내부 sheet 가 처리. 헤더 버튼은 그냥 visual placeholder
  // 으로 두고 trigger 는 PartnerMenuMode 내부로 위임 (중복 trigger 방지).
  // 다만 header right 자리는 시각적으로 "+" 가 보이는 게 중요해서 일단 비워둠.
  return <View />;
}

/** 파트너 메뉴 모드 — 본인 판매 와인. 등록은 /partner/wine/new 페이지로 push. */
function PartnerMenuMode() {
  const router = useRouter();
  const { items, loading, update, remove } = usePartnerWineMenu();

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.menuHeader}>
        <Pressable onPress={() => router.push('/partner/orders' as any)} hitSlop={6}>
          <Caption tone="primary" style={styles.menuLink}>받은 주문 →</Caption>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Body tone="warmMuted" style={styles.menuCount}>{items.length}개</Body>
        <Button label="＋ 등록" variant="primary" size="sm" onPress={() => router.push('/partner/wine/new' as any)} />
      </View>

      {loading && items.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => String(i.id)}
          renderItem={({ item }) => (
            <PartnerMenuList
              items={[item]}
              onToggleAvailable={(id, next) => update(id, { available: next })}
              onRemove={remove}
              onEdit={(id) => router.push({ pathname: '/partner/wine/new', params: { editId: String(id) } } as any)}
            />
          )}
          ListEmptyComponent={
            <PartnerMenuList items={[]} onToggleAvailable={() => {}} onRemove={() => {}} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },

  topPad: {},

  segmentedWrap: {
    flexDirection: 'row', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.borderStrong,
  },
  segment: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.sm,
    backgroundColor: colors.background, alignItems: 'center',
    borderWidth: 1, borderColor: colors.borderStrong,
  },
  segmentActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  segmentText: { color: colors.textWarmMuted, fontWeight: '600' },
  segmentTextActive: { color: '#fff' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.borderStrong,
    backgroundColor: colors.cream,
  },
  input: {
    flex: 1, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm, fontSize: fontSize.body,
    backgroundColor: colors.background,
    color: colors.text,
  },
  clear: { paddingHorizontal: spacing.xs },

  empty: {
    textAlign: 'center', marginTop: spacing.xl,
    paddingHorizontal: spacing.lg, lineHeight: 19,
  },
  hintWrap: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xl, alignItems: 'center', gap: spacing.sm },
  hint: { textAlign: 'center', lineHeight: 19 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.base,
    borderBottomWidth: 1, borderBottomColor: colors.borderStrong,
  },
  rowChevron: { fontSize: 18, marginLeft: spacing.sm },

  // ─── 판매 중 — 파파이스 톤 (강한 그림자 + 큰 사진 + 노란 액센트) ───
  salesHeader: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.base,
  },
  salesTitle: { fontSize: 20, letterSpacing: -0.4, fontFamily: fontFamily.extrabold },
  salesSub: { marginTop: 2 },
  salesScroll: { paddingLeft: SALES_PADDING, paddingRight: SALES_PADDING, paddingVertical: spacing.sm },

  saleCard: {
    marginRight: SALES_GAP,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    // 파파이스식 두툼한 그림자
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.10, shadowRadius: 16,
    elevation: 5,
  },
  saleImgWrap: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  saleImg: { width: '100%', height: '100%' },
  saleImgEmpty: { flex: 1 },

  saleBody: { paddingTop: spacing.sm, paddingHorizontal: spacing.xs, gap: spacing.xs, paddingBottom: spacing.xs },
  partnerChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gold,
  },
  partnerChipText: { color: colors.text, fontWeight: '700' },
  saleNote: { fontStyle: 'italic', marginTop: 2 },
  saleName: { fontSize: 14, lineHeight: 18, marginTop: 4, fontFamily: fontFamily.bold },
  salePriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 6 },
  discount: { fontSize: 20, fontWeight: '900', color: colors.primary, letterSpacing: -0.4 },
  salePrice: { fontSize: 18, fontWeight: '900', color: colors.text, letterSpacing: -0.3 },
  salePriceUnit: { fontSize: 12, fontWeight: '700' },
  originalPrice: { textDecorationLine: 'line-through' },
  saleMeta: { marginTop: 2 },

  // ─── 트렌딩 주류 섹션 ───
  trendingWrap: { marginTop: spacing.xxl },
  trendingHeader: {
    paddingHorizontal: spacing.md, paddingBottom: spacing.base,
  },
  trendingTitle: { fontSize: 18, letterSpacing: -0.3 },
  trendingSub: { marginTop: 2 },

  menuHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.base,
    borderBottomWidth: 1, borderBottomColor: colors.borderStrong,
  },
  menuLink: { fontFamily: fontFamily.semibold },
  menuCount: {},
  addBtn: {
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
  },
  addBtnText: { fontWeight: '700' },
});

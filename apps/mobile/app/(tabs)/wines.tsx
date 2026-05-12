import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, FlatList, ScrollView, Pressable, StyleSheet, ActivityIndicator, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Image } from 'expo-image';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { colors, borderRadius, spacing } from '@/constants/theme';
import { useWineSearch } from '@/lib/hooks/useWineSearch';
import { useIsPartner } from '@/lib/hooks/useIsPartner';
import { usePartnerWineMenu } from '@/lib/hooks/usePartnerWineMenu';
import { useAllPartnerSales, type PartnerSale } from '@/lib/hooks/useAllPartnerSales';
import { PartnerMenuList } from '@/components/PartnerMenuList';
import { AddPartnerWineSheet } from '@/components/AddPartnerWineSheet';

/**
 * 샵 (구 "검색" 탭).
 * CAVE IA v2 — 까브드뱅 등 파트너 매장 + 영수증 인증 진입점.
 *
 * 구조 (위 → 아래):
 *  1. 헤더 — "샵"
 *  2. 영수증 인증 CTA 띠 — 진정성 점수 +가장 큰 신호
 *  3. (파트너 한정) 본인 매장 탭 segmented
 *  4. 파트너 매장 리스트 — partner 별로 그룹핑한 매장 카드
 *  5. 검색 결과 / 판매 와인 (기존 로직 그대로)
 */
type Mode = 'browse' | 'menu';

export default function ShopScreen() {
  const router = useRouter();
  const { isPartner } = useIsPartner();
  const [mode, setMode] = useState<Mode>('browse');

  return (
    <View style={styles.container}>
      <ScreenHeader
        variant="centered"
        title="샵"
        right={isPartner && mode === 'menu' ? <View /> : undefined}
      />

      {isPartner && (
        <View style={styles.segmentedWrap}>
          <Segmented label="둘러보기" active={mode === 'browse'} onPress={() => setMode('browse')} />
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
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────
// 영수증 인증 CTA — 진정성 시스템의 가장 큰 신호
// ─────────────────────────────────────────────────────
function ReceiptCta({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={styles.receiptCta} onPress={onPress}>
      <View style={styles.receiptIcon}>
        <Svg width={22} height={22} fill="none" stroke="#fff" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M4 4v16l3-2 3 2 3-2 3 2 3-2 1 2V4l-1 2-3-2-3 2-3-2-3 2L4 4z" />
          <Line x1={8} y1={9} x2={16} y2={9} />
          <Line x1={8} y1={13} x2={14} y2={13} />
        </Svg>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.receiptKicker}>매장에서 마셨다면</Text>
        <Text style={styles.receiptTitle}>영수증으로 셀러에 추가</Text>
      </View>
      <Text style={styles.receiptArrow}>›</Text>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────
// 파트너 매장 카드 — partner 단위로 sales 그룹핑
// ─────────────────────────────────────────────────────
type PartnerStore = {
  partnerId: string;
  label: string;
  saleCount: number;
  cover: string | null;
};

function groupByPartner(sales: PartnerSale[]): PartnerStore[] {
  const map = new Map<string, PartnerStore>();
  for (const s of sales) {
    const pid = s.partner?.id ?? '';
    if (!pid) continue;
    const label = s.partner?.partner_label || s.partner?.display_name || s.partner?.username || '파트너';
    if (!map.has(pid)) {
      map.set(pid, { partnerId: pid, label, saleCount: 0, cover: s.wine?.image_url ?? null });
    }
    const cur = map.get(pid)!;
    cur.saleCount += 1;
    if (!cur.cover && s.wine?.image_url) cur.cover = s.wine.image_url;
  }
  return [...map.values()];
}

function PartnerStoreRow({ stores, onTap }: { stores: PartnerStore[]; onTap: (id: string) => void }) {
  if (stores.length === 0) return null;
  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>파트너 매장</Text>
        <Text style={styles.sectionMeta}>{stores.length}곳</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storeScroll}
      >
        {stores.map(s => (
          <Pressable key={s.partnerId} style={styles.storeCard} onPress={() => onTap(s.partnerId)}>
            {s.cover ? (
              <Image source={s.cover} style={styles.storeCover} contentFit="cover" cachePolicy="memory-disk" />
            ) : (
              <View style={[styles.storeCover, styles.storeCoverPlaceholder]} />
            )}
            <View style={styles.storeBody}>
              <Text style={styles.storeName} numberOfLines={1}>{s.label}</Text>
              <View style={styles.storeMetaRow}>
                <Text style={styles.storeMeta}>판매 {s.saleCount}종</Text>
                <View style={styles.verifiedPill}>
                  <Text style={styles.verifiedPillText}>영수증 인증</Text>
                </View>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────
// Browse mode — 영수증 CTA + 파트너 매장 + 검색/판매 리스트
// ─────────────────────────────────────────────────────
function BrowseMode({ router }: { router: ReturnType<typeof useRouter> }) {
  const { results, loading: searchLoading, searchWines, clearResults } = useWineSearch();
  const { sales, loading: salesLoading } = useAllPartnerSales();
  const [query, setQuery] = useState('');
  const stores = useMemo(() => groupByPartner(sales), [sales]);

  const isSearching = query.trim().length >= 2;

  function handleChange(text: string) {
    setQuery(text);
    if (text.trim().length < 2) clearResults();
    else searchWines(text.trim(), 30);
  }

  // 검색 중일 때는 결과만 단독 노출 (산만함 방지)
  if (isSearching) {
    return (
      <>
        <SearchBar value={query} onChange={handleChange} onClear={() => { setQuery(''); clearResults(); }} />
        <SearchResultList
          results={results}
          loading={searchLoading}
          onTap={(id) => router.push(`/catalog/${id}` as any)}
        />
      </>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
      <ReceiptCta onPress={() => router.push('/(tabs)/cellar' as any)} />
      <SearchBar value={query} onChange={handleChange} onClear={() => { setQuery(''); clearResults(); }} />
      <PartnerStoreRow stores={stores} onTap={(pid) => router.push(`/user/${pid}` as any)} />
      <SalesList
        sales={sales}
        loading={salesLoading}
        onTap={(wineId) => router.push(`/catalog/${wineId}` as any)}
      />
    </ScrollView>
  );
}

function SearchBar({ value, onChange, onClear }: { value: string; onChange: (t: string) => void; onClear: () => void }) {
  return (
    <View style={styles.searchWrap}>
      <Svg width={16} height={16} fill="none" stroke={colors.textMuted} strokeWidth={2} viewBox="0 0 24 24">
        <Circle cx={11} cy={11} r={8} />
        <Line x1={21} y1={21} x2={16.65} y2={16.65} />
      </Svg>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder="와인 이름 / 생산자 / 지역 검색"
        placeholderTextColor={colors.textLight}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Pressable onPress={onClear} hitSlop={8}>
          <Text style={styles.clear}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

function SearchResultList({
  results, loading, onTap,
}: {
  results: { id: number; name: string; name_ko: string | null; country: string | null; region: string | null }[];
  loading: boolean;
  onTap: (id: number) => void;
}) {
  if (loading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />;
  if (results.length === 0) {
    return (
      <Text style={styles.empty}>
        검색 결과가 없어요. 라벨을 스캔하면 셀러에 등록되며 여기서도 찾을 수 있어요.
      </Text>
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
            <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
            {item.name_ko && (
              <Text style={styles.rowNameKo} numberOfLines={1}>{item.name_ko}</Text>
            )}
            <Text style={styles.rowMeta}>
              {[item.country, item.region].filter(Boolean).join(' · ') || '지역 정보 없음'}
            </Text>
          </View>
          <Text style={styles.rowChevron}>›</Text>
        </Pressable>
      )}
    />
  );
}

const SALES_PADDING = 16;
const SALES_GAP = 10;
const SALES_CARD_W = Math.floor(
  (Dimensions.get('window').width - SALES_PADDING - SALES_GAP * 2) / 2.5,
);

function SalesList({
  sales, loading, onTap,
}: {
  sales: PartnerSale[];
  loading: boolean;
  onTap: (wineId: number) => void;
}) {
  if (loading && sales.length === 0) {
    return <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />;
  }
  if (sales.length === 0) {
    return (
      <View style={styles.hintWrap}>
        <Text style={styles.hintTitle}>판매 중인 와인이 아직 없어요</Text>
        <Text style={styles.hint}>
          파트너가 메뉴를 등록하면 여기서 둘러볼 수 있어요. 검색바로 카탈로그를 찾아보세요.
        </Text>
      </View>
    );
  }
  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>지금 판매 중</Text>
        <Text style={styles.sectionMeta}>{sales.length}병</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SALES_CARD_W + SALES_GAP}
        decelerationRate="fast"
        contentContainerStyle={styles.salesScroll}
      >
        {sales.map(item => (
          <Pressable
            key={item.id}
            style={[styles.saleCard, { width: SALES_CARD_W }]}
            onPress={() => onTap(item.wine_id)}
          >
            {item.wine?.image_url ? (
              <Image
                source={item.wine.image_url}
                style={[styles.saleCardImg, { width: SALES_CARD_W, height: SALES_CARD_W }]}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={[styles.saleCardImg, styles.saleCardImgPlaceholder, { width: SALES_CARD_W, height: SALES_CARD_W }]} />
            )}
            <View style={styles.saleCardBody}>
              <Text style={styles.saleCardName} numberOfLines={2}>
                {item.wine?.name ?? '와인'}
              </Text>
              <Text style={styles.salePartner} numberOfLines={1}>
                {item.partner?.partner_label || item.partner?.display_name || item.partner?.username || '파트너'}
              </Text>
              <Text style={styles.salePrice}>{item.price.toLocaleString('ko-KR')}원</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

/** 파트너 메뉴 모드 — 본인 판매 와인 + 등록 시트. (변경 없음) */
function PartnerMenuMode() {
  const { items, loading, refresh, add, update, remove } = usePartnerWineMenu();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.menuHeader}>
        <Text style={styles.menuCount}>
          판매 와인 {items.length}개
        </Text>
        <Pressable style={styles.addBtn} onPress={() => setSheetOpen(true)}>
          <Text style={styles.addBtnText}>＋ 와인 등록</Text>
        </Pressable>
      </View>

      {loading && items.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => String(i.id)}
          renderItem={({ item }) => (
            <PartnerMenuList
              items={[item]}
              onToggleAvailable={(id, next) => update(id, { available: next })}
              onRemove={remove}
            />
          )}
          ListEmptyComponent={
            <PartnerMenuList items={[]} onToggleAvailable={() => {}} onRemove={() => {}} />
          }
        />
      )}

      <AddPartnerWineSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAdded={refresh}
        add={add}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // segmented
  segmentedWrap: {
    flexDirection: 'row', gap: 4,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  segment: {
    flex: 1, paddingVertical: 8, borderRadius: borderRadius.sm + 2,
    backgroundColor: colors.surface, alignItems: 'center',
  },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  segmentTextActive: { color: '#fff' },

  // 영수증 CTA
  receiptCta: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: spacing.md, marginTop: spacing.md,
    padding: 14,
    backgroundColor: colors.cellar800,
    borderRadius: borderRadius.lg,
  },
  receiptIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  receiptKicker: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  receiptTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginTop: 2 },
  receiptArrow: { fontSize: 22, color: '#fff', opacity: 0.6, marginLeft: 4 },

  // search bar
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: spacing.md, marginTop: spacing.md, marginBottom: spacing.sm,
    paddingHorizontal: 12,
    backgroundColor: colors.g200,
    borderRadius: borderRadius.md,
  },
  input: {
    flex: 1, paddingVertical: 11, fontSize: 14, color: colors.text,
  },
  clear: { fontSize: 14, color: colors.textMuted, paddingHorizontal: 6 },

  // section
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  sectionMeta: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },

  // partner stores
  storeScroll: { paddingLeft: 16, paddingRight: 8, paddingBottom: 4 },
  storeCard: {
    width: 200, marginRight: 10,
    borderRadius: borderRadius.lg,
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
  },
  storeCover: { width: '100%', height: 96, backgroundColor: colors.g300 },
  storeCoverPlaceholder: { backgroundColor: '#3d1925' },
  storeBody: { padding: 12 },
  storeName: { fontSize: 14, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  storeMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  storeMeta: { fontSize: 11, color: colors.textMuted },
  verifiedPill: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999,
  },
  verifiedPillText: { fontSize: 10, fontWeight: '700', color: colors.success },

  // search results
  empty: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 32, paddingHorizontal: 24, lineHeight: 19 },
  hintWrap: { paddingHorizontal: 24, paddingVertical: 32, alignItems: 'center' },
  hintTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  hint: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  rowName: { fontSize: 14, fontWeight: '600', color: colors.text },
  rowNameKo: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  rowMeta: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  rowChevron: { fontSize: 18, color: colors.g400, marginLeft: 8 },

  // sales (지금 판매 중)
  salesScroll: { paddingLeft: SALES_PADDING, paddingRight: SALES_PADDING / 2 },
  saleCard: {
    marginRight: SALES_GAP,
    backgroundColor: '#fff',
    borderRadius: borderRadius.md - 2,
    borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
  },
  saleCardImg: { backgroundColor: colors.wine50 },
  saleCardImgPlaceholder: {},
  saleCardBody: { padding: 10, gap: 4 },
  saleCardName: { fontSize: 13, fontWeight: '600', color: colors.text, lineHeight: 17 },
  salePartner: { fontSize: 11, color: colors.primary, fontWeight: '500' },
  salePrice: { fontSize: 14, fontWeight: '700', color: colors.primary, marginTop: 2 },

  // partner menu mode
  menuHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  menuCount: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  addBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: borderRadius.sm + 2,
    backgroundColor: colors.primary,
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});

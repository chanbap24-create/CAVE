import React, { useState } from 'react';
import {
  View, Text, TextInput, FlatList, ScrollView, Pressable, StyleSheet, ActivityIndicator, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Image } from 'expo-image';
import { useWineSearch } from '@/lib/hooks/useWineSearch';
import { useIsPartner } from '@/lib/hooks/useIsPartner';
import { usePartnerWineMenu } from '@/lib/hooks/usePartnerWineMenu';
import { useAllPartnerSales, type PartnerSale } from '@/lib/hooks/useAllPartnerSales';
import { PartnerMenuList } from '@/components/PartnerMenuList';
import { AddPartnerWineSheet } from '@/components/AddPartnerWineSheet';

type Mode = 'browse' | 'menu';

/**
 * 주류 검색 탭. 두 모드:
 *   - browse : 와인 카탈로그 검색 (모든 사용자)
 *   - menu   : 본인 판매 와인 관리 (파트너만 노출)
 */
export default function WinesSearchScreen() {
  const router = useRouter();
  const { isPartner } = useIsPartner();
  const [mode, setMode] = useState<Mode>('browse');

  return (
    <View style={styles.container}>
      <ScreenHeader
        variant="centered"
        title="검색"
        right={isPartner && mode === 'menu' ? <AddPartnerMenuButton /> : undefined}
      />

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
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
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
          placeholderTextColor="#bbb"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => { setQuery(''); clearResults(); }} hitSlop={8}>
            <Text style={styles.clear}>✕</Text>
          </Pressable>
        )}
      </View>

      {isSearching ? (
        <SearchResultList
          results={results}
          loading={searchLoading}
          onTap={(id) => router.push(`/catalog/${id}` as any)}
        />
      ) : (
        <SalesList
          sales={sales}
          loading={salesLoading}
          onTap={(wineId) => router.push(`/catalog/${wineId}` as any)}
        />
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
  if (loading) return <ActivityIndicator color="#7b2d4e" style={{ marginTop: 24 }} />;
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

// 한 줄에 2.5장 보이는 카드 폭 — 좌측 패딩 + (카드 + gap) × 2 + 0.5 카드.
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
    return <ActivityIndicator color="#7b2d4e" style={{ marginTop: 24 }} />;
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
      <Text style={styles.salesHeading}>판매 중인 와인 ({sales.length})</Text>
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

/** 파트너 메뉴 모드 — 본인 판매 와인 + 등록 시트. */
function PartnerMenuMode() {
  const { items, loading, refresh, add, update, remove } = usePartnerWineMenu();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.menuHeader}>
        <Text style={styles.menuCount}>
          판매 와인 {items.length}개
        </Text>
        <Pressable
          style={styles.addBtn}
          onPress={() => setSheetOpen(true)}
        >
          <Text style={styles.addBtnText}>＋ 와인 등록</Text>
        </Pressable>
      </View>

      {loading && items.length === 0 ? (
        <ActivityIndicator color="#7b2d4e" style={{ marginTop: 24 }} />
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
  container: { flex: 1, backgroundColor: '#fff' },

  segmentedWrap: {
    flexDirection: 'row', gap: 4,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  segment: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    backgroundColor: '#fafafa', alignItems: 'center',
  },
  segmentActive: { backgroundColor: '#7b2d4e' },
  segmentText: { fontSize: 13, fontWeight: '600', color: '#999' },
  segmentTextActive: { color: '#fff' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  input: {
    flex: 1, borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
    backgroundColor: '#fafafa',
  },
  clear: { fontSize: 14, color: '#999', paddingHorizontal: 6 },

  empty: { fontSize: 13, color: '#999', textAlign: 'center', marginTop: 32, paddingHorizontal: 24, lineHeight: 19 },
  hintWrap: { paddingHorizontal: 24, paddingVertical: 32, alignItems: 'center' },
  hintTitle: { fontSize: 16, fontWeight: '700', color: '#444', marginBottom: 6 },
  hint: { fontSize: 13, color: '#999', textAlign: 'center', lineHeight: 19 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  rowName: { fontSize: 14, fontWeight: '600', color: '#222' },
  rowNameKo: { fontSize: 12, color: '#666', marginTop: 2 },
  rowMeta: { fontSize: 11, color: '#999', marginTop: 4 },
  rowChevron: { fontSize: 18, color: '#ccc', marginLeft: 8 },

  // 판매 중인 와인 — 카드 가로 스크롤 (2.5 visible)
  salesHeading: {
    fontSize: 12, fontWeight: '700', color: '#999',
    textTransform: 'uppercase', letterSpacing: 0.5,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10,
  },
  salesScroll: { paddingLeft: SALES_PADDING, paddingRight: SALES_PADDING / 2 },
  saleCard: {
    marginRight: SALES_GAP,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1, borderColor: '#eee',
    overflow: 'hidden',
  },
  saleCardImg: { backgroundColor: '#f0eaec' },
  saleCardImgPlaceholder: {},
  saleCardBody: { padding: 10, gap: 4 },
  saleCardName: { fontSize: 13, fontWeight: '600', color: '#222', lineHeight: 17 },
  salePartner: { fontSize: 11, color: '#7b2d4e', fontWeight: '500' },
  salePrice: { fontSize: 14, fontWeight: '700', color: '#7b2d4e', marginTop: 2 },

  menuHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  menuCount: { fontSize: 13, fontWeight: '600', color: '#666' },
  addBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    backgroundColor: '#7b2d4e',
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});

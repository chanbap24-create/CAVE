import React, { useEffect, useMemo, useState } from 'react';
import {
  View, ScrollView, StyleSheet, Pressable, TextInput, Alert,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ScreenHeader, BackButton } from '@/components/ScreenHeader';
import { CardImage } from '@/components/CardImage';
import { Body, BodyBold, Caption, Eyebrow } from '@/components/Typography';
import { Button } from '@/components/Button';
import { colors, spacing, borderRadius, fontFamily } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useWineSearch, type WineSearchResult } from '@/lib/hooks/useWineSearch';
import { usePartnerWineMenu, type PartnerMenuItem } from '@/lib/hooks/usePartnerWineMenu';
import { uploadImage } from '@/lib/utils/imageUpload';

/**
 * 파트너 와인 판매 등록 / 수정 — 단일 페이지, query 로 모드 분기.
 *
 *   /partner/wine/new            → 신규 등록 (와인 검색 → 폼)
 *   /partner/wine/new?editId=N   → 기존 메뉴 수정 (와인 검색 X, 폼만)
 *
 * 폼 필드: 판매가 (필수) / 정가 / 코멘트 / 재고 / 빈티지 override / 사진.
 */
export default function PartnerWineFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ editId?: string | string[] }>();
  // expo-router 가 가끔 string[] 로 줘서 둘 다 받게.
  const editIdRaw = Array.isArray(params.editId) ? params.editId[0] : params.editId;
  const editId = editIdRaw ? parseInt(editIdRaw, 10) : null;
  const isEdit = editId != null && !Number.isNaN(editId);

  // 뒤로가기 — expo-router tab+stack 회귀 우회. 항상 wines 탭으로 강제 replace.
  const backToWines = () => router.replace('/(tabs)/wines' as any);
  const back = <BackButton fallbackPath="/(tabs)/wines" onPress={backToWines} />;

  const { user } = useAuth();
  const { items, add, update } = usePartnerWineMenu();
  const { results, loading: searchLoading, searchWines, clearResults } = useWineSearch();

  const editingItem = useMemo(
    () => (isEdit ? items.find(i => i.id === editId) ?? null : null),
    [isEdit, editId, items],
  );

  // 폼 상태
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<WineSearchResult | null>(null);
  const [priceText, setPriceText] = useState('');
  const [originalPriceText, setOriginalPriceText] = useState('');
  const [note, setNote] = useState('');
  const [stockText, setStockText] = useState('');
  const [vintageText, setVintageText] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false); // edit 모드 초기 prefill 1회만

  // edit 모드 — 기존 메뉴 데이터로 폼 prefill (items 로드되면 1회)
  useEffect(() => {
    if (!isEdit || hydrated || !editingItem) return;
    const w = editingItem.wine;
    if (w) {
      setPicked({
        id: w.id, name: w.name, name_ko: w.name_ko,
        producer: w.producer, category: 'wine',
        country: w.country, region: w.region,
        vintage_year: w.vintage_year, alcohol_pct: null,
        image_url: w.image_url,
      });
    }
    setPriceText(String(editingItem.price));
    if (editingItem.original_price != null) setOriginalPriceText(String(editingItem.original_price));
    if (editingItem.note) setNote(editingItem.note);
    if (editingItem.stock != null) setStockText(String(editingItem.stock));
    if (editingItem.vintage_year != null) setVintageText(String(editingItem.vintage_year));
    if (editingItem.photo_url) setPhotoUrl(editingItem.photo_url);
    setHydrated(true);
  }, [isEdit, hydrated, editingItem]);

  // 입력 파싱
  const price = parseIntSafe(priceText);
  const originalPrice = parseIntSafe(originalPriceText);
  const stock = parseIntSafe(stockText);
  const vintage = parseIntSafe(vintageText);
  const discountPct = originalPrice != null && price != null && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : null;

  const canSave = !!picked && price != null && price > 0 && !saving;

  function handleQuery(t: string) {
    setQuery(t);
    if (t.trim().length < 2) clearResults();
    else searchWines(t.trim(), 20);
  }

  function handlePick(w: WineSearchResult) {
    setPicked(w);
    setQuery('');
    clearResults();
  }

  async function handlePickPhoto() {
    if (!user || photoUploading) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('권한 필요', '사진 접근을 허용해주세요');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;
    setPhotoUri(uri);
    setPhotoUploading(true);
    const uploaded = await uploadImage(uri, `${user.id}/partner-menu`);
    setPhotoUploading(false);
    if (uploaded) setPhotoUrl(uploaded);
    else {
      Alert.alert('업로드 실패', '다시 시도해주세요');
      setPhotoUri(null);
    }
  }

  async function handleSubmit() {
    if (!canSave || !picked || price == null) return;
    setSaving(true);
    const payload = {
      wine_id: picked.id,
      price,
      original_price: originalPrice,
      note: note.trim() || null,
      stock,
      vintage_year: vintage,
      photo_url: photoUrl,
    };
    const ok = isEdit
      ? await update(editId!, payload)
      : await add(payload);
    setSaving(false);
    if (ok) router.replace('/(tabs)/wines' as any);
  }

  // ─── edit 모드: items 로딩 대기 ─────────────────────────────
  if (isEdit && !editingItem) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="" left={back} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      </View>
    );
  }

  // ─── new 모드 + 와인 선택 전: 검색만 ─────────────────────────
  if (!picked) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="와인 검색" left={back} />
        <View style={styles.body}>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={handleQuery}
            placeholder="와인 이름 / 생산자"
            placeholderTextColor={colors.textLight}
            autoCapitalize="none"
            autoFocus
          />
          {searchLoading && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />}
          <ScrollView keyboardShouldPersistTaps="handled">
            {results.map(item => (
              <Pressable key={item.id} style={styles.searchRow} onPress={() => handlePick(item)}>
                <BodyBold numberOfLines={1}>{item.name}</BodyBold>
                {item.name_ko && <Caption tone="muted" numberOfLines={1} style={{ marginTop: 2 }}>{item.name_ko}</Caption>}
                <Caption tone="muted" style={{ marginTop: spacing.xs }}>
                  {[item.country, item.region].filter(Boolean).join(' · ') || '지역 정보 없음'}
                </Caption>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  }

  // ─── 폼 ─────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader
        title={isEdit ? '판매 수정' : '판매 등록'}
        left={
          isEdit
            ? back
            : <Pressable onPress={() => setPicked(null)} hitSlop={8}>
                <Caption tone="primary" style={styles.headerBtn}>변경</Caption>
              </Pressable>
        }
        right={
          <Button
            label={isEdit ? '저장' : '등록'}
            variant="primary"
            size="sm"
            loading={saving}
            disabled={!canSave}
            onPress={handleSubmit}
          />
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* 와인 정보 카드 */}
        <View style={styles.wineCard}>
          {(photoUri || photoUrl || picked.image_url) ? (
            <CardImage
              source={photoUri || photoUrl || picked.image_url!}
              style={styles.wineImg}
              contentFit="contain"
            />
          ) : (
            <View style={styles.wineImgEmpty} />
          )}
          <View style={styles.wineInfo}>
            <BodyBold numberOfLines={2}>{picked.name}</BodyBold>
            <Caption tone="muted" style={{ marginTop: spacing.xs }}>
              {[picked.country, picked.region].filter(Boolean).join(' · ')}
            </Caption>
            <Pressable onPress={handlePickPhoto} hitSlop={6} style={{ marginTop: spacing.sm }}>
              <Caption tone="primary" style={styles.linkBtn}>
                {photoUploading ? '업로드 중…' : (photoUri || photoUrl) ? '✓ 사진 변경됨 — 다시 변경' : '사진 변경'}
              </Caption>
            </Pressable>
          </View>
        </View>

        {/* 가격 */}
        <Section eyebrow="PRICE">
          <Field label="판매 가격 *">
            <TextInput
              style={styles.field}
              value={priceText}
              onChangeText={setPriceText}
              placeholder="38000"
              placeholderTextColor={colors.textLight}
              keyboardType="number-pad"
            />
          </Field>
          <Field label="정가 (선택)">
            <TextInput
              style={styles.field}
              value={originalPriceText}
              onChangeText={setOriginalPriceText}
              placeholder="비워두면 할인 표시 안 함"
              placeholderTextColor={colors.textLight}
              keyboardType="number-pad"
            />
          </Field>
          {discountPct != null ? (
            <Caption tone="primary" style={styles.discountHint}>
              할인율 {discountPct}% — 정가 {originalPrice?.toLocaleString()}원 → {price?.toLocaleString()}원
            </Caption>
          ) : null}
        </Section>

        {/* 디테일 */}
        <Section eyebrow="DETAILS">
          <Field label="한 줄 코멘트 (선택)">
            <TextInput
              style={styles.field}
              value={note}
              onChangeText={setNote}
              placeholder='예: "매장 한정", "마지막 1병"'
              placeholderTextColor={colors.textLight}
              maxLength={40}
            />
          </Field>
          <Field label="재고 (선택)">
            <TextInput
              style={styles.field}
              value={stockText}
              onChangeText={setStockText}
              placeholder="비워두면 표시 안 함"
              placeholderTextColor={colors.textLight}
              keyboardType="number-pad"
            />
          </Field>
          <Field label="빈티지 (선택)">
            <TextInput
              style={styles.field}
              value={vintageText}
              onChangeText={setVintageText}
              placeholder="이 와인의 다른 빈티지를 판매할 때만 입력"
              placeholderTextColor={colors.textLight}
              keyboardType="number-pad"
              maxLength={4}
            />
          </Field>
        </Section>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function parseIntSafe(text: string): number | null {
  const cleaned = text.replace(/[^0-9]/g, '');
  if (!cleaned) return null;
  const n = parseInt(cleaned, 10);
  return Number.isNaN(n) ? null : n;
}

function Section({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Eyebrow tone="muted" style={styles.sectionEyebrow}>{eyebrow}</Eyebrow>
      {children}
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldWrap}>
      <Caption tone="muted" style={styles.fieldLabel}>{label}</Caption>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.md },

  headerBtn: { fontFamily: fontFamily.semibold, fontSize: 14, paddingHorizontal: spacing.sm },
  headerBtnDisabled: { color: colors.textLight },

  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    fontSize: 15, fontFamily: fontFamily.body, color: colors.text,
    backgroundColor: colors.surface,
  },
  searchRow: {
    paddingHorizontal: spacing.sm, paddingVertical: spacing.base,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },

  scroll: { paddingBottom: spacing.xxl },

  wineCard: {
    flexDirection: 'row', gap: spacing.base,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  wineImg: { width: 80, height: 80, backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md },
  wineImgEmpty: { width: 80, height: 80, backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md },
  wineInfo: { flex: 1, justifyContent: 'center' },
  linkBtn: { fontFamily: fontFamily.semibold },

  section: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionEyebrow: { letterSpacing: 1.5, marginBottom: spacing.base },

  fieldWrap: { marginBottom: spacing.base },
  fieldLabel: { marginBottom: spacing.xs },
  field: {
    borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    fontSize: 15, fontFamily: fontFamily.body, color: colors.text,
    backgroundColor: colors.surface,
  },

  discountHint: {
    marginTop: spacing.xs, fontFamily: fontFamily.medium,
  },
});

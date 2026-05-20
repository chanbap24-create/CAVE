import React, { useEffect, useState } from 'react';
import {
  View, ScrollView, StyleSheet, Pressable, TextInput, Alert,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenHeader, BackButton } from '@/components/ScreenHeader';
import { CardImage } from '@/components/CardImage';
import { Body, BodyBold, Caption, Eyebrow } from '@/components/Typography';
import { Button } from '@/components/Button';
import { colors, spacing, borderRadius, fontFamily } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { PartnerMenuItem } from '@/lib/hooks/usePartnerWineMenu';

/**
 * 구매 요청 페이지 — /order/new?menuId=N
 *
 * 흐름: 와인 정보 + 수량 + 코멘트 → "구매 요청" → orders insert → 내역으로.
 * 결제 X (MVP 옵션 2: 예약만, 픽업/결제는 파트너와 직접).
 */
export default function OrderNewScreen() {
  const router = useRouter();
  const { menuId: rawMenuId } = useLocalSearchParams<{ menuId?: string | string[] }>();
  const menuId = parseMenuId(rawMenuId);

  const { user } = useAuth();
  const [item, setItem] = useState<PartnerMenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 뒤로가기 — wines 탭으로 강제 (expo-router 회귀 회피)
  const back = <BackButton fallbackPath="/(tabs)/wines" onPress={() => router.replace('/(tabs)/wines' as any)} />;

  useEffect(() => {
    if (menuId == null) { setLoading(false); return; }
    (async () => {
      const { data, error } = await supabase
        .from('partner_wine_menu')
        .select(`
          id, wine_id, partner_id, price, original_price, note, stock, vintage_year, photo_url, available,
          wine:wines(id, name, name_ko, producer, region, country, vintage_year, image_url),
          partner:profiles!partner_wine_menu_partner_id_fkey(id, username, display_name, partner_label)
        `)
        .eq('id', menuId)
        .maybeSingle();
      if (error) console.error('[order/new]', error.message);
      setItem(data as unknown as PartnerMenuItem | null);
      setLoading(false);
    })();
  }, [menuId]);

  const stockOk = item?.stock == null || item.stock >= quantity;
  const isOwnMenu = !!(user && item && user.id === (item as any).partner_id);
  const canSubmit = !!item && quantity > 0 && stockOk && !isOwnMenu && !submitting && !!user;

  async function handleSubmit() {
    if (!canSubmit || !item || !user) return;
    setSubmitting(true);
    const totalPrice = item.price * quantity;
    const { error } = await supabase.from('orders').insert({
      customer_id: user.id,
      partner_id: (item as any).partner_id,
      wine_menu_id: item.id,
      wine_id: item.wine_id,
      quantity,
      unit_price: item.price,
      total_price: totalPrice,
      customer_note: note.trim() || null,
      // 승인 단계 skip — 매장 픽업 흐름은 바로 확정.
      status: 'confirmed',
    });
    setSubmitting(false);
    if (error) { Alert.alert('구매 실패', error.message); return; }
    Alert.alert(
      '구매 완료',
      '셀러에 등록됐어요. 매장에서 픽업해주세요.',
      [{ text: '확인', onPress: () => router.replace('/order/list' as any) }],
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="" left={back} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      </View>
    );
  }
  if (!item) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="" left={back} />
        <Caption tone="muted" style={styles.center}>판매 정보를 찾을 수 없어요.</Caption>
      </View>
    );
  }

  const photo = item.photo_url || item.wine?.image_url;
  const vintage = item.vintage_year ?? item.wine?.vintage_year;
  const partnerLabel =
    (item as any).partner?.partner_label ||
    (item as any).partner?.display_name ||
    (item as any).partner?.username || '파트너';
  const discountPct = item.original_price && item.original_price > item.price
    ? Math.round(((item.original_price - item.price) / item.original_price) * 100)
    : null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="구매" left={back} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* 와인 카드 */}
        <View style={styles.wineCard}>
          {photo ? (
            <CardImage source={photo} style={styles.wineImg} contentFit="contain" />
          ) : <View style={styles.wineImgEmpty} />}
          <View style={styles.wineInfo}>
            <Caption tone="primary" style={styles.partnerChip}>{partnerLabel}</Caption>
            {item.note ? <Caption tone="muted" style={styles.note} numberOfLines={1}>{item.note}</Caption> : null}
            <BodyBold numberOfLines={2}>
              {item.wine?.name ?? '와인'}
              {vintage ? ` · ${vintage}` : ''}
            </BodyBold>
            <View style={styles.priceRow}>
              {discountPct != null ? <Body style={styles.discount}>{discountPct}%</Body> : null}
              <Body style={styles.price}>{item.price.toLocaleString('ko-KR')}원</Body>
              {discountPct != null && item.original_price ? (
                <Caption tone="muted" style={styles.originalPrice}>{item.original_price.toLocaleString('ko-KR')}원</Caption>
              ) : null}
            </View>
            {item.stock != null ? (
              <Caption tone="muted" style={{ marginTop: spacing.xs }}>재고 {item.stock}병</Caption>
            ) : null}
          </View>
        </View>

        {/* 수량 */}
        <Section eyebrow="QUANTITY">
          <View style={styles.qtyRow}>
            <Pressable
              onPress={() => setQuantity(q => Math.max(1, q - 1))}
              style={styles.qtyBtn}
              hitSlop={6}
            >
              <Body style={styles.qtyBtnText}>−</Body>
            </Pressable>
            <BodyBold style={styles.qtyValue}>{quantity}</BodyBold>
            <Pressable
              onPress={() => setQuantity(q => (item.stock != null ? Math.min(item.stock, q + 1) : q + 1))}
              style={styles.qtyBtn}
              hitSlop={6}
            >
              <Body style={styles.qtyBtnText}>+</Body>
            </Pressable>
            {!stockOk ? (
              <Caption tone="primary" style={{ marginLeft: spacing.base }}>재고 부족</Caption>
            ) : null}
          </View>
        </Section>

        {/* 코멘트 */}
        <Section eyebrow="NOTE TO PARTNER (선택)">
          <TextInput
            style={styles.field}
            value={note}
            onChangeText={setNote}
            placeholder="픽업 시간, 요청사항 등"
            placeholderTextColor={colors.textLight}
            multiline
            maxLength={200}
          />
        </Section>

        {isOwnMenu ? (
          <Caption tone="muted" style={styles.warn}>본인 메뉴는 구매할 수 없어요.</Caption>
        ) : null}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* 하단 sticky 구매 CTA */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomTotal}>
          <Caption tone="muted">총 결제 (현장 결제)</Caption>
          <BodyBold style={styles.totalPrice}>
            {(item.price * quantity).toLocaleString('ko-KR')}원
          </BodyBold>
        </View>
        <Button
          label="구매하기"
          variant="pill"
          size="lg"
          loading={submitting}
          disabled={!canSubmit}
          onPress={handleSubmit}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function parseMenuId(raw: string | string[] | undefined): number | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v) return null;
  const n = parseInt(v, 10);
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.xxl },
  center: { textAlign: 'center', marginTop: spacing.xl },

  headerBtn: { fontFamily: fontFamily.semibold, fontSize: 14, paddingHorizontal: spacing.sm },
  headerBtnDisabled: { color: colors.textLight },

  wineCard: {
    flexDirection: 'row', gap: spacing.base,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  wineImg: { width: 88, height: 88, backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md },
  wineImgEmpty: { width: 88, height: 88, backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md },
  wineInfo: { flex: 1, justifyContent: 'center', gap: spacing.xs },
  partnerChip: { fontFamily: fontFamily.semibold },
  note: { fontStyle: 'italic' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: spacing.xs, flexWrap: 'wrap' },
  discount: { fontFamily: fontFamily.extrabold, color: colors.primary, fontSize: 15 },
  price: { fontFamily: fontFamily.bold, fontSize: 15 },
  originalPrice: { textDecorationLine: 'line-through' },

  section: { paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  sectionEyebrow: { letterSpacing: 1.5, marginBottom: spacing.base },

  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.base },
  qtyBtn: {
    width: 36, height: 36, borderRadius: borderRadius.sm,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  qtyBtnText: { fontSize: 18, fontFamily: fontFamily.semibold },
  qtyValue: { fontSize: 18, minWidth: 30, textAlign: 'center' },

  field: {
    borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    fontSize: 15, fontFamily: fontFamily.body, color: colors.text,
    backgroundColor: colors.surface,
    minHeight: 72, textAlignVertical: 'top',
  },

  totalPrice: { fontSize: 18, color: colors.primary },

  warn: {
    paddingHorizontal: spacing.md, paddingTop: spacing.sm,
    textAlign: 'center',
  },

  // 하단 sticky CTA — 옐로우 (파파이스 톤)
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.base,
    paddingHorizontal: spacing.md, paddingTop: spacing.base, paddingBottom: 34,
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  bottomTotal: { flex: 1, gap: 2 },
});

import React from 'react';
import { View, Pressable, Switch, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CardImage } from '@/components/CardImage';
import { BodyBold, Body, Caption } from '@/components/Typography';
import { colors, spacing, borderRadius, fontFamily } from '@/constants/theme';
import type { PartnerMenuItem } from '@/lib/hooks/usePartnerWineMenu';

interface Props {
  items: PartnerMenuItem[];
  onToggleAvailable: (id: number, next: boolean) => void;
  onRemove: (id: number) => void;
  onEdit?: (id: number) => void;
}

/**
 * 파트너 본인 판매 메뉴 리스트 — owner view.
 * 가격 / 정가 / 코멘트 / 재고 / available toggle. Long-press 삭제.
 */
export function PartnerMenuList({ items, onToggleAvailable, onRemove, onEdit }: Props) {
  function confirmRemove(item: PartnerMenuItem) {
    Alert.alert(
      '메뉴에서 제거',
      `${item.wine?.name ?? '이 와인'}을 판매 메뉴에서 제거할까요?`,
      [
        { text: '취소', style: 'cancel' },
        { text: '제거', style: 'destructive', onPress: () => onRemove(item.id) },
      ],
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <BodyBold>등록된 판매 와인이 없어요</BodyBold>
        <Caption tone="muted" style={styles.emptyHint}>
          우상단 + 버튼으로 와인을 검색해 등록하세요.
        </Caption>
      </View>
    );
  }

  return (
    <View>
      {items.map(item => {
        const photo = item.photo_url || item.wine?.image_url;
        const discountPct = item.original_price && item.original_price > item.price
          ? Math.round(((item.original_price - item.price) / item.original_price) * 100)
          : null;
        const vintage = item.vintage_year ?? item.wine?.vintage_year;
        return (
          <Pressable
            key={item.id}
            style={styles.row}
            onLongPress={() => confirmRemove(item)}
          >
            {photo ? (
              <CardImage source={photo} style={styles.thumb} contentFit="contain" />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]} />
            )}
            <View style={styles.info}>
              <BodyBold numberOfLines={1}>
                {item.wine?.name ?? '와인'}
                {vintage ? ` · ${vintage}` : ''}
              </BodyBold>
              {item.wine?.producer && (
                <Caption tone="muted" numberOfLines={1} style={{ marginTop: 2 }}>{item.wine.producer}</Caption>
              )}
              {item.note ? (
                <Caption tone="primary" numberOfLines={1} style={styles.note}>{item.note}</Caption>
              ) : null}
              <View style={styles.priceRow}>
                {discountPct != null ? (
                  <>
                    <Body style={styles.discount}>{discountPct}%</Body>
                    <Body style={styles.price}>{item.price.toLocaleString('ko-KR')}원</Body>
                    <Caption tone="muted" style={styles.originalPrice}>{item.original_price?.toLocaleString('ko-KR')}원</Caption>
                  </>
                ) : (
                  <Body style={styles.price}>{item.price.toLocaleString('ko-KR')}원</Body>
                )}
                {item.stock != null ? (
                  <Caption tone="muted" style={styles.stock}>· 재고 {item.stock}</Caption>
                ) : null}
              </View>
            </View>
            <View style={styles.actions}>
              {onEdit ? (
                <Pressable onPress={() => onEdit(item.id)} hitSlop={8} style={styles.editBtn}>
                  <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
                </Pressable>
              ) : null}
              <Switch
                value={item.available}
                onValueChange={(v) => onToggleAvailable(item.id, v)}
                trackColor={{ true: colors.primary, false: '#ddd' }}
              />
            </View>
          </Pressable>
        );
      })}
      <Caption tone="muted" style={styles.footer}>편집 ✏️  /  길게 눌러 삭제</Caption>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.base,
    paddingHorizontal: spacing.md, paddingVertical: spacing.base,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  thumb: {
    width: 56, height: 56, borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
  },
  thumbPlaceholder: {},
  info: { flex: 1, gap: spacing.xs },
  note: { fontFamily: fontFamily.medium, marginTop: 2 },

  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  editBtn: { padding: spacing.xs },

  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: spacing.xs, flexWrap: 'wrap' },
  discount: { color: colors.primary, fontFamily: fontFamily.extrabold, fontSize: 15 },
  price: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 15 },
  originalPrice: { textDecorationLine: 'line-through' },
  stock: {},

  footer: { textAlign: 'center', paddingVertical: spacing.base },

  empty: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xl, alignItems: 'center', gap: spacing.sm },
  emptyHint: { textAlign: 'center', lineHeight: 18 },
});

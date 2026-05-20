import React from 'react';
import { View, ScrollView, StyleSheet, Pressable, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenHeader, BackButton } from '@/components/ScreenHeader';
import { CardImage } from '@/components/CardImage';
import { BodyBold, Body, Caption, Eyebrow } from '@/components/Typography';
import { colors, spacing, borderRadius, fontFamily } from '@/constants/theme';
import { useMyOrders, type MyOrder, type OrderStatus } from '@/lib/hooks/useMyOrders';
import { formatMonthDay } from '@/lib/utils/dateUtils';

/**
 * 내 주문 내역 — customer 가 자기 주문 확인.
 * pending 위로, 같은 상태는 최신순. 본인이 cancel 가능 (pending 만).
 */
export default function OrderListScreen() {
  const router = useRouter();
  const { orders, loading, refresh, cancel } = useMyOrders();
  const [refreshing, setRefreshing] = React.useState(false);

  const back = <BackButton fallbackPath="/(tabs)/profile" onPress={() => router.replace('/(tabs)/profile' as any)} />;

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  function handleCancel(order: MyOrder) {
    Alert.alert('주문 취소', '이 주문을 취소할까요?', [
      { text: '뒤로', style: 'cancel' },
      { text: '취소', style: 'destructive', onPress: () => cancel(order.id) },
    ]);
  }

  // pending 은 레거시 → confirmed 와 같이 "픽업 대기" 그룹.
  // customer 는 픽업 전 (pending/confirmed) 까지만 취소 가능.
  const active = orders.filter(o => o.status === 'pending' || o.status === 'confirmed');
  const completed = orders.filter(o => o.status === 'picked_up');
  const cancelled = orders.filter(o => o.status === 'cancelled');

  return (
    <View style={styles.container}>
      <ScreenHeader title="내 주문" left={back} />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
      >
        {!loading && orders.length === 0 ? (
          <View style={styles.empty}>
            <BodyBold>아직 주문이 없어요</BodyBold>
            <Caption tone="muted" style={styles.emptyHint}>
              주류 도감의 판매 카드에서 구매할 수 있어요
            </Caption>
          </View>
        ) : null}

        <Group label={`픽업 대기 · ${active.length}`} hide={active.length === 0}>
          {active.map(o => <OrderRow key={o.id} order={o} onCancel={() => handleCancel(o)} />)}
        </Group>

        <Group label={`픽업 완료 · ${completed.length}`} hide={completed.length === 0}>
          {completed.map(o => <OrderRow key={o.id} order={o} />)}
        </Group>

        <Group label={`취소됨 · ${cancelled.length}`} hide={cancelled.length === 0}>
          {cancelled.map(o => <OrderRow key={o.id} order={o} />)}
        </Group>
      </ScrollView>
    </View>
  );
}

function Group({ label, children, hide }: { label: string; children: React.ReactNode; hide?: boolean }) {
  if (hide) return null;
  return (
    <View style={styles.group}>
      <Eyebrow tone="muted" style={styles.groupLabel}>{label}</Eyebrow>
      {children}
    </View>
  );
}

function OrderRow({ order, onCancel }: { order: MyOrder; onCancel?: () => void }) {
  const partnerLabel = order.partner?.partner_label || order.partner?.display_name || order.partner?.username || '파트너';
  return (
    <View style={styles.row}>
      {order.wine?.image_url ? (
        <CardImage source={order.wine.image_url} style={styles.thumb} contentFit="contain" />
      ) : <View style={[styles.thumb, styles.thumbEmpty]} />}
      <View style={styles.info}>
        <Caption tone="primary" style={styles.partner}>{partnerLabel}</Caption>
        <BodyBold numberOfLines={2}>
          {order.wine?.name ?? '와인'}
          {order.wine?.vintage_year ? ` · ${order.wine.vintage_year}` : ''}
        </BodyBold>
        <Body style={styles.price}>
          {order.quantity > 1 ? `${order.quantity}병 · ` : ''}
          {order.total_price.toLocaleString('ko-KR')}원
        </Body>
        <Caption tone="muted" style={{ marginTop: 2 }}>
          {formatMonthDay(order.created_at)} 요청
          {order.partner_note ? ` · ${order.partner_note}` : ''}
        </Caption>
        {onCancel ? (
          <Pressable onPress={onCancel} hitSlop={4} style={styles.cancelBtn}>
            <Caption tone="primary" style={styles.cancelText}>요청 취소</Caption>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  empty: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.sm },
  emptyHint: { textAlign: 'center' },

  group: { paddingTop: spacing.lg },
  groupLabel: { paddingHorizontal: spacing.md, marginBottom: spacing.sm, letterSpacing: 1.5 },

  row: {
    flexDirection: 'row', gap: spacing.base,
    paddingHorizontal: spacing.md, paddingVertical: spacing.base,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  thumb: { width: 64, height: 64, borderRadius: borderRadius.sm, backgroundColor: colors.surfaceLight },
  thumbEmpty: {},
  info: { flex: 1, gap: spacing.xs },
  partner: { fontFamily: fontFamily.semibold },
  price: { fontFamily: fontFamily.bold, marginTop: 2 },

  cancelBtn: { alignSelf: 'flex-start', marginTop: spacing.xs },
  cancelText: { fontFamily: fontFamily.semibold },
});

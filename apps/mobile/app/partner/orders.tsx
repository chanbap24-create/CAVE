import React from 'react';
import { View, ScrollView, StyleSheet, Pressable, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenHeader, BackButton } from '@/components/ScreenHeader';
import { CardImage } from '@/components/CardImage';
import { BodyBold, Body, Caption, Eyebrow } from '@/components/Typography';
import { colors, spacing, borderRadius, fontFamily } from '@/constants/theme';
import { usePartnerOrders, type PartnerOrder, type OrderStatus } from '@/lib/hooks/usePartnerOrders';
import { formatMonthDay } from '@/lib/utils/dateUtils';

/**
 * 파트너 받은 주문 — pending 위로, 승인/거절/픽업확정 액션.
 */
export default function PartnerOrdersScreen() {
  const router = useRouter();
  const { orders, loading, refresh, updateStatus } = usePartnerOrders();
  const [refreshing, setRefreshing] = React.useState(false);

  const back = <BackButton fallbackPath="/(tabs)/wines" onPress={() => router.replace('/(tabs)/wines' as any)} />;

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  function confirmAction(order: PartnerOrder, next: OrderStatus, verb: string) {
    Alert.alert(verb, `이 주문을 ${verb}할까요?`, [
      { text: '뒤로', style: 'cancel' },
      { text: verb, onPress: () => updateStatus(order.id, next) },
    ]);
  }

  // pending 은 레거시 (구매 시 status='confirmed' 직행). 혹시 모를 잔존 데이터는 confirmed 와 같이 표시.
  const active = orders.filter(o => o.status === 'pending' || o.status === 'confirmed');
  const completed = orders.filter(o => o.status === 'picked_up');
  const cancelled = orders.filter(o => o.status === 'cancelled');

  return (
    <View style={styles.container}>
      <ScreenHeader title="받은 주문" left={back} />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
      >
        {!loading && orders.length === 0 ? (
          <View style={styles.empty}>
            <BodyBold>아직 받은 주문이 없어요</BodyBold>
          </View>
        ) : null}

        <Group label={`픽업 대기 · ${active.length}`} hide={active.length === 0}>
          {active.map(o => (
            <OrderRow
              key={o.id} order={o}
              actions={[
                { label: '픽업 완료', onPress: () => confirmAction(o, 'picked_up', '픽업 완료 처리') },
                { label: '취소', tone: 'destructive', onPress: () => confirmAction(o, 'cancelled', '주문 취소') },
              ]}
            />
          ))}
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

interface Action {
  label: string;
  onPress: () => void;
  tone?: 'default' | 'destructive';
}

function OrderRow({ order, actions = [] }: { order: PartnerOrder; actions?: Action[] }) {
  const customer = order.customer?.display_name || order.customer?.username || '고객';
  return (
    <View style={styles.row}>
      {order.wine?.image_url ? (
        <CardImage source={order.wine.image_url} style={styles.thumb} contentFit="contain" />
      ) : <View style={[styles.thumb, styles.thumbEmpty]} />}
      <View style={styles.info}>
        <Caption tone="primary" style={styles.customer}>{customer}</Caption>
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
          {order.customer_note ? ` · ${order.customer_note}` : ''}
        </Caption>

        {actions.length > 0 ? (
          <View style={styles.actions}>
            {actions.map(a => (
              <Pressable
                key={a.label}
                onPress={a.onPress}
                style={[styles.actionBtn, a.tone === 'destructive' && styles.actionBtnDestructive]}
                hitSlop={6}
              >
                <Caption
                  style={[
                    styles.actionText,
                    a.tone === 'destructive' && styles.actionTextDestructive,
                  ]}
                >
                  {a.label}
                </Caption>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  empty: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xxl, alignItems: 'center' },

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
  customer: { fontFamily: fontFamily.semibold },
  price: { fontFamily: fontFamily.bold, marginTop: 2 },

  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionBtn: {
    paddingHorizontal: spacing.base, paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
  },
  actionBtnDestructive: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.error },
  actionText: { color: '#fff', fontFamily: fontFamily.semibold },
  actionTextDestructive: { color: colors.error },
});

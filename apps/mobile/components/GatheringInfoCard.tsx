import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { UserAvatar } from '@/components/UserAvatar';
import { getTopBadge } from '@/lib/tierUtils';
import { getGatheringTypeLabel, type GatheringType } from '@/lib/types/gathering';
import { formatDateFull } from '@/lib/utils/dateUtils';

interface Props {
  gathering: any; // gatherings row — loosely typed on the detail page
  host: any | null;
  memberCount: number;
  /** True if the viewer can open the group chat (host or approved member). */
  canOpenChat: boolean;
  chatLoading: boolean;
  onOpenChat: () => void;
}

/**
 * Title + description + host card + detail box (date/location/members/price)
 * + optional group chat button. Extracted from the gathering detail page
 * so that orchestration file stays close to the 200-line budget.
 */
export function GatheringInfoCard({
  gathering, host, memberCount, canOpenChat, chatLoading, onOpenChat,
}: Props) {
  const typeLabel = getGatheringTypeLabel(gathering.gathering_type as GatheringType);
  const hostBadge = getTopBadge(host?.collection_count || 0);

  return (
    <View style={styles.info}>
      <Text style={styles.title}>
        {typeLabel ? <Text style={styles.typePrefix}>[{typeLabel}] </Text> : null}
        {gathering.title}
      </Text>
      {gathering.description ? <Text style={styles.desc}>{gathering.description}</Text> : null}

      <View style={styles.hostRow}>
        <UserAvatar
          uri={host?.avatar_url}
          fallbackChar={host?.display_name?.[0]}
          collectionCount={host?.collection_count || 0}
          size="lg"
        />
        <View>
          <View style={styles.hostNameRow}>
            <Text style={styles.hostName}>{host?.username}</Text>
            {hostBadge ? (
              <View style={[styles.hostBadge, { backgroundColor: hostBadge.bg }]}>
                <Text style={[styles.hostBadgeText, { color: hostBadge.color }]}>{hostBadge.name}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.hostLabel}>Host</Text>
        </View>
      </View>

      <View style={styles.detailsBox}>
        <DetailRow label="Date" value={formatDateFull(gathering.gathering_date)} />
        <DetailRow label="Location" value={gathering.location} />
        <DetailRow label="Members" value={`${memberCount} / ${gathering.max_members}`} />
        {gathering.price_per_person ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price</Text>
            <Text style={styles.detailPrice}>{gathering.price_per_person.toLocaleString()}won</Text>
          </View>
        ) : null}
      </View>

      {canOpenChat ? (
        <Pressable
          style={({ pressed }) => [styles.chatBtn, pressed && styles.chatBtnPressed]}
          onPress={onOpenChat}
          disabled={chatLoading}
        >
          <Text style={styles.chatBtnText}>{chatLoading ? 'Opening...' : 'Group Chat'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  info: { padding: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#222', marginBottom: 8 },
  typePrefix: { color: '#7b2d4e', fontWeight: '700' },
  desc: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 16 },

  hostRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  hostNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hostName: { fontSize: 15, fontWeight: '600', color: '#222' },
  hostLabel: { fontSize: 11, color: '#7b2d4e', fontWeight: '500' },
  hostBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  hostBadgeText: { fontSize: 9, fontWeight: '600' },

  detailsBox: { backgroundColor: '#fafafa', borderRadius: 12, padding: 16, gap: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 13, color: '#999' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#222' },
  detailPrice: { fontSize: 15, fontWeight: '700', color: '#7b2d4e' },

  chatBtn: {
    backgroundColor: '#222', padding: 14, borderRadius: 10,
    alignItems: 'center', marginTop: 16,
  },
  chatBtnPressed: { opacity: 0.6 },
  chatBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});

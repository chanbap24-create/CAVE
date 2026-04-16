import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';
import type { Gathering } from '@/lib/hooks/useGatherings';
import { getAvatarRingColor, getTopBadge } from '@/lib/tierUtils';

function formatDate(dateStr: string | null) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dayName = days[d.getDay()];
  const hour = d.getHours().toString().padStart(2, '0');
  const min = d.getMinutes().toString().padStart(2, '0');
  return `${month}.${day} (${dayName}) ${hour}:${min}`;
}

interface Props {
  gathering: Gathering;
  onPress: () => void;
}

export function GatheringCard({ gathering, onPress }: Props) {
  const g = gathering;
  const host = g.host;
  const hostInitial = host?.display_name?.[0]?.toUpperCase() || host?.username?.[0]?.toUpperCase() || '?';
  const isClosed = g.status === 'closed' || g.status === 'completed' || g.current_members >= g.max_members;

  return (
    <View style={styles.card}>
      <View style={styles.body}>
        <Text style={styles.title}>{g.title}</Text>

        <View style={styles.hostRow}>
          {(() => {
            const rc = getAvatarRingColor((host as any)?.collection_count || 0);
            return host?.avatar_url ? (
              <View style={rc ? [styles.avatarGlow, { shadowColor: rc }] : undefined}>
                <Image source={{ uri: host.avatar_url }} style={[styles.hostAvatarImg, rc && { borderWidth: 1.5, borderColor: rc }]} />
              </View>
            ) : (
              <View style={[styles.hostAvatar, rc && { borderWidth: 1.5, borderColor: rc }]}><Text style={styles.hostAvatarText}>{hostInitial}</Text></View>
            );
          })()}
          <Text style={styles.hostName}>{host?.username || 'unknown'}</Text>
          {(() => {
            const b = getTopBadge((host as any)?.collection_count || 0);
            return b ? (
              <View style={[styles.hostBadge, { backgroundColor: b.bg }]}>
                <Text style={[styles.hostBadgeText, { color: b.color }]}>{b.name}</Text>
              </View>
            ) : null;
          })()}
          <View style={styles.hostBadge}><Text style={styles.hostBadgeText}>Host</Text></View>
        </View>

        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Svg width={14} height={14} fill="none" stroke="#999" strokeWidth={1.8} viewBox="0 0 24 24">
              <Rect x={3} y={4} width={18} height={18} rx={2} />
              <Line x1={16} y1={2} x2={16} y2={6} /><Line x1={8} y1={2} x2={8} y2={6} />
              <Line x1={3} y1={10} x2={21} y2={10} />
            </Svg>
            <Text style={styles.detailText}>{formatDate(g.gathering_date)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Svg width={14} height={14} fill="none" stroke="#999" strokeWidth={1.8} viewBox="0 0 24 24">
              <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <Circle cx={12} cy={10} r={3} />
            </Svg>
            <Text style={styles.detailText}>{g.location || 'TBD'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Svg width={14} height={14} fill="none" stroke="#999" strokeWidth={1.8} viewBox="0 0 24 24">
              <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <Circle cx={9} cy={7} r={4} />
              <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </Svg>
            <Text style={styles.detailText}>{g.current_members} / {g.max_members}{isClosed ? ' (Closed)' : ''}</Text>
          </View>
        </View>

        <Pressable
          style={[styles.detailBtn, isClosed && styles.detailBtnClosed]}
          onPress={onPress}
          disabled={isClosed}
        >
          <Text style={[styles.detailBtnText, isClosed && styles.detailBtnTextClosed]}>
            {isClosed ? 'Closed' : 'Details'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderBottomWidth: 8, borderBottomColor: '#f5f5f5' },
  body: { padding: 16, paddingHorizontal: 20 },
  title: { fontSize: 17, fontWeight: '700', color: '#222', marginBottom: 10 },

  hostRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  hostAvatar: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#f0f0f0',
    alignItems: 'center', justifyContent: 'center',
  },
  hostAvatarImg: { width: 28, height: 28, borderRadius: 14 },
  hostAvatarText: { fontSize: 10, fontWeight: '600', color: '#888' },
  avatarGlow: {
    borderRadius: 16, padding: 1,
    shadowColor: '#c9a84c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: 8,
  },
  avatarGoldBorder: { borderWidth: 1.5, borderColor: '#c9a84c' },
  hostName: { fontSize: 13, fontWeight: '600', color: '#222' },
  hostBadge: { backgroundColor: '#f7f0f3', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  hostBadgeText: { fontSize: 10, fontWeight: '600', color: '#7b2d4e' },

  details: { gap: 6, marginBottom: 14 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 13, color: '#666' },

  detailBtn: { backgroundColor: '#7b2d4e', padding: 12, borderRadius: 10, alignItems: 'center' },
  detailBtnClosed: { backgroundColor: '#f0f0f0' },
  detailBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  detailBtnTextClosed: { color: '#bbb' },
});

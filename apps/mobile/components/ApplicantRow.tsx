import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { TasteCard } from './TasteCard';
import { useTasteProfile } from '@/lib/hooks/useTasteProfile';

interface Member {
  user_id: string;
  status: string;
  message: string | null;
  profile?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    collection_count: number;
  };
}

interface Props {
  member: Member;
  showActions?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
}

export function ApplicantRow({ member, showActions, onApprove, onReject }: Props) {
  const p = member.profile;
  const initial = p?.display_name?.[0]?.toUpperCase() || p?.username?.[0]?.toUpperCase() || '?';
  const { taste, loadTaste } = useTasteProfile(member.user_id);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => { loadTaste(); }, [member.user_id]);

  // Build simple badge list from taste data
  const badges: string[] = [];
  if (taste) {
    if (taste.totalBottles >= 100) badges.push('Master');
    else if (taste.totalBottles >= 50) badges.push('Expert');
    else if (taste.totalBottles >= 10) badges.push('Collector');
    if (taste.topCountries.length >= 5) badges.push('World Traveler');
    if (taste.categoryBreakdown.length > 0) {
      badges.push(taste.categoryBreakdown[0].label + ' Lover');
    }
  }

  return (
    <View style={styles.applicant}>
      <Pressable style={styles.top} onPress={() => setExpanded(!expanded)}>
        {p?.avatar_url ? (
          <Image source={{ uri: p.avatar_url }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name}>{p?.username || 'unknown'}</Text>
          <View style={styles.badgeRow}>
            {badges.map((b, i) => (
              <View key={i} style={styles.badge}>
                <Text style={styles.badgeText}>{b}</Text>
              </View>
            ))}
            {badges.length === 0 && <Text style={styles.noBadge}>No badges yet</Text>}
          </View>
        </View>
        {member.status === 'approved' && (
          <View style={styles.joinedBadge}>
            <Text style={styles.joinedText}>Joined</Text>
          </View>
        )}
      </Pressable>

      {/* Expanded: full taste card */}
      {expanded && taste && <TasteCard taste={taste} compact />}

      {member.message && (
        <Text style={styles.message}>"{member.message}"</Text>
      )}

      {showActions && (
        <View style={styles.actionRow}>
          <Pressable style={styles.acceptBtn} onPress={onApprove}>
            <Text style={styles.acceptText}>Accept</Text>
          </Pressable>
          <Pressable style={styles.rejectBtn} onPress={onReject}>
            <Text style={styles.rejectText}>Decline</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  applicant: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#f0f0f0',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  avatarText: { fontSize: 14, fontWeight: '600', color: '#999' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#222' },
  badgeRow: { flexDirection: 'row', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  badge: { backgroundColor: '#f7f0f3', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '600', color: '#7b2d4e' },
  noBadge: { fontSize: 10, color: '#ccc' },
  joinedBadge: { backgroundColor: '#e8f5e9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  joinedText: { fontSize: 11, fontWeight: '600', color: '#2e7d32' },
  message: {
    fontSize: 13, color: '#555', lineHeight: 19,
    backgroundColor: '#fafaf8', padding: 10, borderRadius: 10,
    marginTop: 10,
  },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  acceptBtn: { flex: 1, backgroundColor: '#7b2d4e', padding: 10, borderRadius: 10, alignItems: 'center' },
  acceptText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  rejectBtn: { flex: 1, borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 10, alignItems: 'center' },
  rejectText: { color: '#999', fontSize: 14, fontWeight: '600' },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { TasteCard } from './TasteCard';
import { WineDetailSheet } from './WineDetailSheet';
import { FollowButton } from '@/components/FollowButton';
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
  contribution?: {
    collection_id: number | null;
    is_blind: boolean;
    status: string;
    wine?: {
      name: string;
      name_ko?: string | null;
      producer?: string | null;
      category?: string | null;
      region?: string | null;
      country?: string | null;
      vintage_year: number | null;
      image_url: string | null;
    } | null;
    collection_photo_url?: string | null;
  } | null;
}

interface Props {
  member: Member;
  showActions?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  /** Avatar tap handler — typically opens the user's cellar in a sheet. */
  onAvatarPress?: (userId: string) => void;
}

export function ApplicantRow({ member, showActions, onApprove, onReject, onAvatarPress }: Props) {
  const p = member.profile;
  const initial = p?.display_name?.[0]?.toUpperCase() || p?.username?.[0]?.toUpperCase() || '?';
  const { taste, loadTaste } = useTasteProfile(member.user_id);
  const [expanded, setExpanded] = useState(false);
  const [wineSheetOpen, setWineSheetOpen] = useState(false);

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
        {/* Wrap the avatar in its own Pressable so tapping it opens the
            user's cellar sheet; tapping the rest of the row toggles the
            expand/collapse. stopPropagation keeps the two gestures clean. */}
        <Pressable
          hitSlop={4}
          onPress={(e) => {
            e.stopPropagation?.();
            onAvatarPress?.(member.user_id);
          }}
          disabled={!onAvatarPress}
        >
          {p?.avatar_url ? (
            <Image source={p.avatar_url} style={styles.avatarImg} contentFit="cover" cachePolicy="memory-disk" transition={150} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          )}
        </Pressable>
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
        <View style={styles.rightSlot}>
          {member.status === 'host' ? (
            <View style={styles.hostBadge}>
              <Text style={styles.hostBadgeText}>Host</Text>
            </View>
          ) : member.status === 'approved' ? (
            <View style={styles.joinedBadge}>
              <Text style={styles.joinedText}>Joined</Text>
            </View>
          ) : null}
          {/* FollowButton self-guards (hides for the viewer's own row). */}
          <FollowButton targetUserId={member.user_id} size="small" />
        </View>
      </Pressable>

      {/* Expanded: only the wine card. Taste / country breakdown used to
          show here but felt like clutter for the Members tab — badges
          next to the name already signal the viewer's collecting vibe. */}
      {expanded && member.contribution && (
        <Pressable
          style={({ pressed }) => [styles.wineCard, pressed && styles.wineCardPressed]}
          onPress={() => {
            // Blind wines have nothing to reveal yet — skip opening.
            if (member.contribution?.is_blind) return;
            if (!member.contribution?.wine) return;
            setWineSheetOpen(true);
          }}
          disabled={!!member.contribution.is_blind || !member.contribution.wine}
        >
          {member.contribution.is_blind ? (
            <View style={[styles.wineThumb, styles.blindThumb]}>
              <Text style={styles.blindLock}>🔒</Text>
            </View>
          ) : member.contribution.collection_photo_url || member.contribution.wine?.image_url ? (
            <Image
              source={member.contribution.collection_photo_url ?? member.contribution.wine?.image_url!}
              style={styles.wineThumb}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={[styles.wineThumb, { backgroundColor: '#f0f0f0' }]} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.wineName} numberOfLines={2}>
              {member.contribution.is_blind
                ? '블라인드 와인'
                : member.contribution.wine?.name ?? 'Selected wine'}
            </Text>
            {!member.contribution.is_blind && member.contribution.wine?.producer ? (
              <Text style={styles.wineProducer} numberOfLines={1}>
                {member.contribution.wine.producer}
              </Text>
            ) : null}
            <Text style={styles.wineMeta} numberOfLines={1}>
              {member.contribution.is_blind
                ? '당일 공개'
                : member.contribution.wine?.vintage_year
                  ? `${member.contribution.wine.vintage_year} · 탭하여 자세히 보기`
                  : '탭하여 자세히 보기'}
            </Text>
          </View>
          {member.contribution.status === 'pending' && (
            <View style={styles.pendingPill}>
              <Text style={styles.pendingPillText}>Pending</Text>
            </View>
          )}
        </Pressable>
      )}

      <WineDetailSheet
        visible={wineSheetOpen}
        onClose={() => setWineSheetOpen(false)}
        wine={
          member.contribution?.wine
            ? {
                ...member.contribution.wine,
                photo_url: member.contribution.collection_photo_url ?? null,
              }
            : null
        }
        broughtBy={p?.username ? `@${p.username}` : undefined}
      />

      {/* Application message intentionally not rendered in the row — the
          host can still see it by tapping Accept/Decline, and listing it
          clutters the Members tab. */}

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
  rightSlot: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  joinedBadge: { backgroundColor: '#e8f5e9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  joinedText: { fontSize: 11, fontWeight: '600', color: '#2e7d32' },
  hostBadge: { backgroundColor: '#7b2d4e', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  hostBadgeText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  message: {
    fontSize: 13, color: '#555', lineHeight: 19,
    backgroundColor: '#fafaf8', padding: 10, borderRadius: 10,
    marginTop: 10,
  },
  wineCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 10, padding: 10,
    backgroundColor: '#fafaf8', borderRadius: 10,
  },
  wineCardPressed: { opacity: 0.6 },
  wineThumb: { width: 36, height: 36, borderRadius: 6, backgroundColor: '#f0f0f0' },
  blindThumb: {
    backgroundColor: '#f5f0e8', alignItems: 'center', justifyContent: 'center',
  },
  blindLock: { fontSize: 14 },
  wineName: { fontSize: 13, fontWeight: '600', color: '#222' },
  wineProducer: { fontSize: 11, color: '#7b2d4e', fontWeight: '500', marginTop: 2 },
  wineMeta: { fontSize: 11, color: '#999', marginTop: 2 },
  pendingPill: {
    backgroundColor: '#fff3e0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  pendingPillText: { fontSize: 10, fontWeight: '600', color: '#ed8c32' },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  acceptBtn: { flex: 1, backgroundColor: '#7b2d4e', padding: 10, borderRadius: 10, alignItems: 'center' },
  acceptText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  rejectBtn: { flex: 1, borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 10, alignItems: 'center' },
  rejectText: { color: '#999', fontSize: 14, fontWeight: '600' },
});

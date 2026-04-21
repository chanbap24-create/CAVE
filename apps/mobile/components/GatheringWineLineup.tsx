import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import type { LineupEntry } from '@/lib/hooks/useGatheringDetail';
import { WineDetailSheet } from './WineDetailSheet';

interface Props {
  entries: LineupEntry[];
  currentUserId?: string | null;
  /** Contribution ids that have a pending change request — UI locks the
   *  Change button and shows a 변경 요청 중 pill instead. */
  pendingChangeIds?: Set<number>;
  /** If provided, the viewer sees a "Change" button on their own committed
   *  wines (when no pending request exists). */
  onRequestChange?: (entry: LineupEntry) => void;
  /** Host-only reveal action for blind slots. Tapping opens a picker; on
   *  pick the caller flips is_blind=false and fills collection_id. */
  onRevealBlind?: (entry: LineupEntry) => void;
}

/**
 * Committed wine lineup for the gathering detail screen. Renders every
 * committed contribution (host slots + approved attendees) with who brought
 * what. Blind host slots show a padlock + "당일 공개" hint.
 */
export function GatheringWineLineup({
  entries, currentUserId, pendingChangeIds, onRequestChange, onRevealBlind,
}: Props) {
  const [active, setActive] = useState<LineupEntry | null>(null);
  if (entries.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Wine Lineup ({entries.length})</Text>
      {entries.map((e) => {
        const canOpen = !e.is_blind && !!e.wine;
        const mine = currentUserId != null && e.user_id === currentUserId;
        const pending = pendingChangeIds?.has(e.id) ?? false;
        const showChange = mine && !e.is_blind && !pending && onRequestChange != null;
        // Only the slot's owner (host for host slots) can reveal.
        const showReveal = mine && e.is_blind && onRevealBlind != null;

        return (
          <Pressable
            key={e.id}
            style={({ pressed }) => [styles.row, pressed && canOpen && styles.rowPressed]}
            onPress={() => canOpen && setActive(e)}
            disabled={!canOpen}
          >
            {e.is_blind ? (
              <View style={[styles.thumb, styles.blind]}>
                <Text style={styles.lock}>🔒</Text>
              </View>
            ) : e.collection_photo_url || e.wine?.image_url ? (
              <Image
                source={e.collection_photo_url ?? e.wine?.image_url!}
                style={styles.thumb}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={[styles.thumb, styles.placeholder]} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={2}>
                {e.is_blind ? '블라인드 와인' : e.wine?.name ?? 'Selected wine'}
              </Text>
              {!e.is_blind && e.wine?.producer ? (
                <Text style={styles.producer} numberOfLines={1}>{e.wine.producer}</Text>
              ) : null}
              <Text style={styles.meta} numberOfLines={1}>
                {e.is_blind
                  ? '당일 공개'
                  : e.wine?.vintage_year
                    ? `${e.wine.vintage_year} · 탭하여 자세히 보기`
                    : '탭하여 자세히 보기'}
              </Text>
              {pending && (
                <View style={styles.pendingPill}>
                  <Text style={styles.pendingPillText}>변경 요청 진행중</Text>
                </View>
              )}
            </View>

            <View style={styles.rightSide}>
              <View style={[styles.byChip, e.is_host && styles.byChipHost]}>
                <Text style={[styles.byChipText, e.is_host && styles.byChipTextHost]}>
                  {e.is_host ? 'Host' : e.profile?.username ?? 'Member'}
                </Text>
              </View>
              {showChange && (
                <Pressable
                  style={styles.changeBtn}
                  onPress={(ev) => {
                    ev.stopPropagation();
                    onRequestChange!(e);
                  }}
                >
                  <Text style={styles.changeBtnText}>Change</Text>
                </Pressable>
              )}
              {showReveal && (
                <Pressable
                  style={[styles.changeBtn, styles.revealBtn]}
                  onPress={(ev) => {
                    ev.stopPropagation();
                    onRevealBlind!(e);
                  }}
                >
                  <Text style={[styles.changeBtnText, { color: '#8a6d3b' }]}>Reveal</Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        );
      })}

      <WineDetailSheet
        visible={active != null}
        onClose={() => setActive(null)}
        wine={
          active?.wine
            ? {
                ...active.wine,
                photo_url: active.collection_photo_url ?? null,
              }
            : null
        }
        broughtBy={
          active?.is_host
            ? 'Host'
            : active?.profile?.username
              ? `@${active.profile.username}`
              : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  heading: { fontSize: 15, fontWeight: '700', color: '#222', marginBottom: 12 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  rowPressed: { opacity: 0.6 },
  thumb: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#f0f0f0' },
  blind: {
    backgroundColor: '#f5f0e8',
    alignItems: 'center', justifyContent: 'center',
  },
  lock: { fontSize: 18 },
  placeholder: { backgroundColor: '#f0f0f0' },
  name: { fontSize: 14, fontWeight: '600', color: '#222' },
  producer: { fontSize: 11, color: '#7b2d4e', fontWeight: '500', marginTop: 2 },
  meta: { fontSize: 11, color: '#999', marginTop: 2 },
  rightSide: { alignItems: 'flex-end', gap: 6 },
  byChip: {
    backgroundColor: '#f7f0f3',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  byChipHost: { backgroundColor: '#7b2d4e' },
  byChipText: { fontSize: 10, fontWeight: '600', color: '#7b2d4e' },
  byChipTextHost: { color: '#fff' },

  changeBtn: {
    borderWidth: 1, borderColor: '#7b2d4e', borderRadius: 6,
    paddingVertical: 4, paddingHorizontal: 10,
  },
  changeBtnText: { fontSize: 11, fontWeight: '600', color: '#7b2d4e' },
  revealBtn: { borderColor: '#8a6d3b' },

  pendingPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#fffbf4', borderWidth: 1, borderColor: '#f0e2c8',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    marginTop: 4,
  },
  pendingPillText: { fontSize: 10, fontWeight: '600', color: '#8a6d3b' },
});

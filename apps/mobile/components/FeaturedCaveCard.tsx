import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { VideoPlayer } from './VideoPlayer';
import { useRouter } from 'expo-router';
import type { FeaturedCave } from '@/lib/hooks/useFeaturedCaves';
import { getAvatarRingColor } from '@/lib/tierUtils';

export function FeaturedCaveCard({ cave }: { cave: FeaturedCave }) {
  const router = useRouter();
  const initial = cave.display_name?.[0]?.toUpperCase() || cave.username[0]?.toUpperCase() || '?';
  // Determine badge with color
  let topBadge: { name: string; bg: string; color: string } | null = null;
  if (cave.collection_count >= 100) topBadge = { name: 'Master', bg: 'rgba(120,96,168,0.3)', color: '#c0a8f0' };
  else if (cave.collection_count >= 50) topBadge = { name: 'Expert', bg: 'rgba(184,147,58,0.3)', color: '#e8d080' };
  else if (cave.collection_count >= 10) topBadge = { name: 'Collector', bg: 'rgba(123,45,78,0.3)', color: '#e0a0b8' };
  else if (cave.badges[0]) topBadge = { name: cave.badges[0], bg: 'rgba(255,255,255,0.2)', color: '#fff' };

  return (
    <Pressable style={styles.card} onPress={() => router.push(`/user/${cave.user_id}`)}>
      {/* Latest post as background */}
      {cave.latestVideoPlaybackId ? (
        <View style={styles.cardBg}>
          <VideoPlayer playbackId={cave.latestVideoPlaybackId!} style={styles.videoBg} />
          <View style={[styles.overlay, styles.videoOverlay]}>
            <CardContent cave={cave} initial={initial} topBadge={topBadge} />
          </View>
        </View>
      ) : cave.latestPostImage ? (
        <View style={styles.cardBg}>
          <Image
            source={cave.latestPostImage}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
          />
          <View style={[styles.overlay, styles.videoOverlay]}>
            <CardContent cave={cave} initial={initial} topBadge={topBadge} />
          </View>
        </View>
      ) : (
        <View style={[styles.cardBg, { backgroundColor: '#f0f0f0' }]}>
          <CardContent cave={cave} initial={initial} topBadge={topBadge} />
        </View>
      )}
    </Pressable>
  );
}

function CardContent({ cave, initial, topBadge }: { cave: FeaturedCave; initial: string; topBadge: { name: string; bg: string; color: string } | null }) {
  const hasImage = !!cave.latestPostImage;
  const textColor = hasImage ? '#fff' : '#222';
  const subColor = hasImage ? 'rgba(255,255,255,0.8)' : '#999';
  const ringColor = getAvatarRingColor(cave.collection_count);
  const borderStyle = ringColor
    ? { borderWidth: 1.5, borderColor: ringColor }
    : { borderWidth: 1.5, borderColor: '#fff' };
  const glowStyle = ringColor
    ? {
        borderRadius: 16,
        padding: 1,
        shadowColor: ringColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 5,
        elevation: 8,
      }
    : undefined;

  return (
    <View style={styles.content}>
      <View style={styles.topRow}>
        {cave.avatar_url ? (
          <View style={glowStyle}>
            <Image
              source={cave.avatar_url}
              style={[styles.avatar, borderStyle]}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={150}
            />
          </View>
        ) : (
          <View style={[styles.avatarPlaceholder, borderStyle]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        )}
        {cave.activeGatherings > 0 && <View style={styles.gatheringDot} />}
      </View>
      <Text style={[styles.username, { color: textColor }]} numberOfLines={1}>{cave.username}</Text>
      {topBadge && (
        <View style={[styles.badge, { backgroundColor: topBadge.bg }]}>
          <Text style={[styles.badgeText, { color: topBadge.color }]}>{topBadge.name}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '31%', borderRadius: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: '#f0f0f0',
  },
  cardBg: { height: 180, justifyContent: 'flex-end', overflow: 'hidden' },
  videoBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  videoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  overlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 11,
  },
  content: { padding: 8 },
  topRow: { position: 'relative', marginBottom: 4, alignSelf: 'flex-start' },
  avatar: { width: 28, height: 28, borderRadius: 14 },
  avatarPlaceholder: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#e8e8e8',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 11, fontWeight: '600', color: '#999' },
  gatheringDot: {
    position: 'absolute', bottom: 0, right: -2,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#4caf7c', borderWidth: 1.5, borderColor: '#fff',
  },
  username: { fontSize: 11, fontWeight: '700' },
  stat: { fontSize: 9, marginTop: 1 },
  badge: {
    backgroundColor: '#f7f0f3', paddingHorizontal: 6, paddingVertical: 1,
    borderRadius: 6, marginTop: 4, alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 9, fontWeight: '600', color: '#7b2d4e' },
});

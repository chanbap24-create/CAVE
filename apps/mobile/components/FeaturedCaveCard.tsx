import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, ImageBackground } from 'react-native';
import { VideoPlayer } from './VideoPlayer';
import { useRouter } from 'expo-router';
import type { FeaturedCave } from '@/lib/hooks/useFeaturedCaves';

export function FeaturedCaveCard({ cave }: { cave: FeaturedCave }) {
  const router = useRouter();
  const initial = cave.display_name?.[0]?.toUpperCase() || cave.username[0]?.toUpperCase() || '?';
  const topBadge = cave.badges[0] || null;

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
        <ImageBackground source={{ uri: cave.latestPostImage }} style={styles.cardBg} imageStyle={styles.cardBgImage}>
          <View style={styles.overlay}>
            <CardContent cave={cave} initial={initial} topBadge={topBadge} />
          </View>
        </ImageBackground>
      ) : (
        <View style={[styles.cardBg, { backgroundColor: '#f0f0f0' }]}>
          <CardContent cave={cave} initial={initial} topBadge={topBadge} />
        </View>
      )}
    </Pressable>
  );
}

function CardContent({ cave, initial, topBadge }: { cave: FeaturedCave; initial: string; topBadge: string | null }) {
  const hasImage = !!cave.latestPostImage;
  const textColor = hasImage ? '#fff' : '#222';
  const subColor = hasImage ? 'rgba(255,255,255,0.8)' : '#999';

  return (
    <View style={styles.content}>
      <View style={styles.topRow}>
        {cave.avatar_url ? (
          <Image source={{ uri: cave.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        )}
        {cave.activeGatherings > 0 && <View style={styles.gatheringDot} />}
      </View>
      <Text style={[styles.username, { color: textColor }]} numberOfLines={1}>{cave.username}</Text>
      <Text style={[styles.stat, { color: subColor }]}>{cave.collection_count} bottles · {cave.countries} countries</Text>
      {topBadge && (
        <View style={[styles.badge, hasImage && { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
          <Text style={[styles.badgeText, hasImage && { color: '#fff' }]}>{topBadge}</Text>
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
  cardBgImage: { borderRadius: 11 },
  videoBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  videoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  overlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 11,
  },
  content: { padding: 8 },
  topRow: { position: 'relative', marginBottom: 4, alignSelf: 'flex-start' },
  avatar: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: '#fff' },
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

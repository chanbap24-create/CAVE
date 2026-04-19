import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useMuxPlaybackToken } from '@/lib/hooks/useMuxPlaybackToken';

interface Props {
  playbackId: string;
  style?: any;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
}

export function VideoPlayer({
  playbackId,
  style,
  muted = true,
  loop = true,
  controls = false,
}: Props) {
  const { token, loading } = useMuxPlaybackToken(playbackId);

  // Wait for token resolution before mounting the player to avoid a 403 flash
  // on signed-policy videos. Old public videos still resolve quickly (the
  // server returns a token anyway, which Mux ignores).
  if (loading) {
    return (
      <View style={[styles.video, style, styles.loading]}>
        <ActivityIndicator color="#7b2d4e" />
      </View>
    );
  }

  const url = token
    ? `https://stream.mux.com/${playbackId}.m3u8?token=${token}`
    : `https://stream.mux.com/${playbackId}.m3u8`;

  return <MuxVideo url={url} style={style} muted={muted} loop={loop} controls={controls} />;
}

// Inner component so the player is re-created with a fresh key when the
// tokenized URL changes (token refresh mid-lifetime).
function MuxVideo({
  url,
  style,
  muted,
  loop,
  controls,
}: {
  url: string;
  style?: any;
  muted: boolean;
  loop: boolean;
  controls: boolean;
}) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = loop;
    p.muted = muted;
    p.play();
  });

  return (
    <VideoView
      style={[styles.video, style]}
      player={player}
      contentFit="cover"
      nativeControls={controls}
    />
  );
}

const styles = StyleSheet.create({
  video: { width: '100%', height: '100%' },
  loading: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
});

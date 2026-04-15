import React from 'react';
import { StyleSheet } from 'react-native';
import { Video, ResizeMode } from 'expo-av';

interface Props {
  playbackId: string;
  style?: any;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
}

export function VideoPlayer({ playbackId, style, muted = true, loop = true, controls = false }: Props) {
  return (
    <Video
      source={{ uri: `https://stream.mux.com/${playbackId}.m3u8` }}
      style={[styles.video, style]}
      resizeMode={ResizeMode.COVER}
      shouldPlay
      isLooping={loop}
      isMuted={muted}
      useNativeControls={controls}
    />
  );
}

const styles = StyleSheet.create({
  video: { width: '100%', height: '100%' },
});

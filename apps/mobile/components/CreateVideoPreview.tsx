import React from 'react';
import { VideoView, useVideoPlayer } from 'expo-video';

export function CreateVideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return (
    <VideoView
      style={{ width: '100%', aspectRatio: 1 }}
      player={player}
      contentFit="cover"
    />
  );
}

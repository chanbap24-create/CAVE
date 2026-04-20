import React from 'react';
import Svg, { Path, Circle, Line } from 'react-native-svg';

// Heart — post like toggle. Fills when liked.
export function HeartIcon({ filled, size = 24 }: { filled?: boolean; size?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      fill={filled ? '#ed4956' : 'none'}
      stroke={filled ? '#ed4956' : '#222'}
      strokeWidth={filled ? 0 : 1.8}
      viewBox="0 0 24 24"
    >
      <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </Svg>
  );
}

// Speech bubble — open comments.
export function CommentBubbleIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} fill="none" stroke="#222" strokeWidth={1.8} viewBox="0 0 24 24">
      <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Svg>
  );
}

// Paper plane — DM / send / share.
export function SendIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} fill="none" stroke="#222" strokeWidth={1.8} viewBox="0 0 24 24">
      <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </Svg>
  );
}

// User with + — tag another user in a photo.
export function TagUserIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} fill="none" stroke="#222" strokeWidth={1.8} viewBox="0 0 24 24">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx={12} cy={7} r={4} />
      <Line x1={19} y1={11} x2={19} y2={17} />
      <Line x1={16} y1={14} x2={22} y2={14} />
    </Svg>
  );
}

import React from 'react';
import { Image, type ImageProps } from 'expo-image';

/**
 * 카드 / 그리드 / 리스트 등에서 쓰는 이미지 공용 wrapper.
 *
 * 기본값:
 *   - cachePolicy: memory-disk (재방문 시 즉시 표시)
 *   - contentFit: cover (왜곡 없이 채움)
 *   - transition: 200ms fade-in (loading 시 popping 제거 — 시각적 jank 해소)
 *
 * 모든 prop 을 override 가능 — 그냥 expo-image 와 같은 인터페이스.
 * 이미지 로드 전 빈 박스 톤은 caller 가 바깥 wrap View 의 backgroundColor 로 처리.
 *
 * 2026-05-13 추출: 30+ 파일이 동일 옵션 사용 중이고 그중 절반은 transition 누락.
 */
export function CardImage(props: ImageProps) {
  return (
    <Image
      cachePolicy="memory-disk"
      contentFit="cover"
      transition={200}
      {...props}
    />
  );
}

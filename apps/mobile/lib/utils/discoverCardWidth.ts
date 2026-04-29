import { Dimensions } from 'react-native';

/**
 * Discover 가로 스크롤 섹션의 "2-up + peek" 카드 폭 계산.
 *
 * 레이아웃 가정:
 *   contentContainer paddingLeft = HORIZONTAL_PADDING (=16)
 *   카드 사이 marginRight = CARD_GAP (=12)
 *   3번째 카드의 PEEK 만큼이 화면 우측에 보임
 *
 * 결과 폭 = (screen - HORIZONTAL_PADDING - CARD_GAP*2 - PEEK) / 2
 *
 * 사용처: PartnerGatheringsRow, UserGatheringsRow.
 * 동일 폭을 쓰면 두 섹션의 카드가 시각적으로 정렬됨.
 */
// DiscoverSectionHeader paddingHorizontal 와 동일 (20). 헤더-카드 좌측 정렬.
export const HORIZONTAL_PADDING = 20;
export const CARD_GAP = 12;

/**
 * Discover 모든 가로 스크롤 카드의 통일 폭.
 *  - 한 화면에 2장 들어오되 2번째 카드가 약 20% 잘려서 보임 (swipe 유도)
 *  - leftPadding + W + gap + 0.8*W = screen → W = (screen - leftPadding - gap) / 1.8
 *
 * 모든 섹션(Partner / User / Caves / Trending / Editor) 이 같은 폭 → 페이지
 * 세로 리듬 통일.
 */
export function getDiscoverCardWidth(): number {
  const screen = Dimensions.get('window').width;
  return Math.floor((screen - HORIZONTAL_PADDING - CARD_GAP) / 1.8);
}

/** 모든 섹션이 동일 폭이라 별칭으로 둠. 추후 위계 강조 카드만 다르게 하고 싶으면 분리. */
export function getFeatureCardWidth(): number {
  return getDiscoverCardWidth();
}

/** snap 단위 — 한 카드씩 정렬되며 swipe 가 자연스럽게 떨어짐 */
export function getSnapInterval(): number {
  return getDiscoverCardWidth() + CARD_GAP;
}

export function getFeatureSnapInterval(): number {
  return getFeatureCardWidth() + CARD_GAP;
}

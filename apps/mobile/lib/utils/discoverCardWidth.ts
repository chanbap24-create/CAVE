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
const PEEK = 36; // 다음 카드가 우측에 보이는 양 (px). 옆으로 넘기고 싶게 만드는 정도.

export function getDiscoverCardWidth(): number {
  const screen = Dimensions.get('window').width;
  // 카드1 + gap + 카드2 + gap + peek = screen - leftPadding
  // 2*W + 2*GAP + PEEK = screen - HORIZONTAL_PADDING
  // W = (screen - HORIZONTAL_PADDING - 2*GAP - PEEK) / 2
  return Math.floor((screen - HORIZONTAL_PADDING - CARD_GAP * 2 - PEEK) / 2);
}

/** snap 단위 — 한 카드씩 정렬되며 swipe 가 자연스럽게 떨어짐 */
export function getSnapInterval(): number {
  return getDiscoverCardWidth() + CARD_GAP;
}

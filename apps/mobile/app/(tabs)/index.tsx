import { Redirect } from 'expo-router';

/**
 * /(tabs) 진입점 redirect — 홈(explore) 으로 보냄.
 * 2026-04-30 부터 explore 가 "홈" 으로 자리매김 (가운데 탭, 집 아이콘).
 *
 * 로그인 직후 / 콜드 부트 / `/(tabs)` 라우트 진입 모두 이 redirect 를 거쳐
 * 홈으로 떨어진다. _layout.tsx 의 initialRouteName='explore' 와 짝.
 *
 * 자세한 방향성: docs/icave_concept_updates.md
 */
export default function TabsIndexRedirect() {
  return <Redirect href="/(tabs)/explore" />;
}

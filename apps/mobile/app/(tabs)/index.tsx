import { Redirect } from 'expo-router';

/**
 * Home(피드) 제거 — i cave 는 셀러가 첫 진입점.
 * 기존 posts 기반 피드는 deprecate 되어 더 이상 진입점 미제공.
 * /(tabs) 라우트로 들어오면 즉시 셀러로 보낸다.
 *
 * 자세한 방향성: docs/icave_concept_updates.md
 */
export default function HomeIndexRedirect() {
  return <Redirect href="/(tabs)/cellar" />;
}

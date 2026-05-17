import { useEffect, useMemo, useRef, useState } from 'react';
import { Image } from 'expo-image';

const PREFETCH_TIMEOUT_MS = 1500;

/**
 * 데이터 + 이미지를 한 번에 보여주기 위한 readiness 게이트.
 *
 * 동작:
 *   1. 첫 mount + 빈 데이터 → ready=true (게이트 skip)
 *   2. 데이터 처음 도착 → ready=false → prefetch → ready=true (1회 reveal)
 *   3. 이후 refetch / 업데이트 → 다시 게이트 X (이미 ready 면 그대로 유지)
 *
 * 1회만 게이팅하는 이유: useFocusEffect refetch 마다 spinner 가 깜빡이던 버그.
 * 새 항목이 추가되면 transition fade-in 으로 부드럽게 들어옴.
 *
 * 1.5초 타임아웃 — 이미지가 느리거나 일부 실패해도 무한 로딩 안 됨.
 */
export function useReadyWithImages(
  urls: (string | null | undefined)[],
  timeoutMs: number = PREFETCH_TIMEOUT_MS,
): boolean {
  // 빈 데이터로 시작 (마스터 hook 에서 빈 배열로 초기화 후 fetch). 첫 데이터 오기
  // 전엔 ready=true 로 두고, 첫 데이터 도착시에만 게이트.
  const [ready, setReady] = useState(true);
  const hasGatedRef = useRef(false);

  const key = useMemo(
    () => urls.filter((u): u is string => !!u).join('|'),
    [urls],
  );

  useEffect(() => {
    if (!key) return;            // 데이터 없음 — 게이트 X
    if (hasGatedRef.current) return; // 이미 한 번 게이트 통과 — refetch 시 spinner X
    hasGatedRef.current = true;

    setReady(false);
    let done = false;
    const finish = () => { if (!done) { done = true; setReady(true); } };

    const timer = setTimeout(finish, timeoutMs);
    Image.prefetch(key.split('|')).finally(() => {
      clearTimeout(timer);
      finish();
    });

    return () => { done = true; clearTimeout(timer); };
  }, [key, timeoutMs]);

  return ready;
}

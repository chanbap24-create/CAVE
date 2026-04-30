-- ============================================================
-- gatherings.current_members 캐시 트리거 제거 — 1000 CCU 동시 가입 lock 해소.
--
-- 회귀 시나리오 (수정 전):
--   gathering_members INSERT/UPDATE/DELETE 시 trg_gathering_member_count 가
--   `update gatherings set current_members = current_members + 1 where id = X`
--   를 실행. 인기 모임에 100명이 동시 가입 신청 → 같은 row 에 대한 동시
--   UPDATE 가 직렬화되어 마지막 사용자는 100배 지연.
--
-- 수정:
--   트리거를 drop. 카운트는 hook(useGatherings 등) 에서 gathering_members 를
--   gathering_id 별로 집계하여 클라이언트에 합쳐 전달. 인덱스
--   idx_gathering_members_gathering_status (00048) 가 이미 빠른 조회 보장.
--
-- current_members 컬럼은 schema 호환성을 위해 그대로 두되, 더 이상 갱신되지
-- 않음. 새로 가입하는 row 부터는 hook 이 정확한 값으로 덮어씀.
-- ============================================================

drop trigger if exists trg_gathering_member_count on gathering_members;
drop function if exists update_gathering_member_count();

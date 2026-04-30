-- ============================================================
-- gathering_members 인덱스 보강 — 1000 CCU 확장성.
--
-- 회귀 시나리오 (수정 전):
--   gathering_members 는 PK(gathering_id, user_id) 만 정의되어 있어
--   다음 쿼리들이 풀스캔으로 떨어짐:
--
--   1) RLS gathering_members_read_approved (00037)
--      `using (status = 'approved')` — 모든 SELECT 가 status 컬럼만으로
--      필터링 → 인덱스 없으면 전체 테이블 스캔. 1000 CCU 가 모임 목록 /
--      상세를 자주 보면 초당 수천 풀스캔.
--
--   2) 트리거 apply_unanimous_approval (00029, 00047)
--      vote 가 들어올 때마다
--        select count(*) from gathering_members
--        where gathering_id = X and status = 'approved'
--      를 호출 — vote 빈도가 높은 모임에서 매번 풀스캔.
--
--   3) useCollectionSocial / 셀러 소셜 카운트 — 간접적이지만 같은 테이블 hit.
--
-- 수정:
--   composite index 두 개 추가. 모든 사용 패턴을 커버:
--     - (gathering_id, status) : 모임 안의 status 필터링 (RLS, 트리거)
--     - (user_id, status)      : 내 모임 / 내 신청 상태 조회
--
--   PK(gathering_id, user_id) 는 그대로 두어 직접 lookup 도 빠름.
-- ============================================================

create index if not exists idx_gathering_members_gathering_status
  on gathering_members (gathering_id, status);

create index if not exists idx_gathering_members_user_status
  on gathering_members (user_id, status);

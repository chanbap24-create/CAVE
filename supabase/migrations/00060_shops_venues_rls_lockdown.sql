-- ============================================================
-- shops, venues — 양면 BM (와인샵 / 제휴업장) 미래 테이블 RLS lockdown.
--
-- 현재는 0 rows (placeholder). 그러나 RLS off 상태로 데이터가 들어가면
-- anon key 만으로 외부에서 SELECT/UPDATE/DELETE 가능 — sales 프로젝트에서
-- 받은 Supabase 보안 경고와 동일 패턴.
--
-- 비어있는 지금이 정리 골든 타임. 정책은 일단 미정 → service_role 만
-- 접근 가능. 흐름이 잡히면 owner-write / public-read 등 추가.
-- ============================================================

alter table shops  enable row level security;
alter table venues enable row level security;

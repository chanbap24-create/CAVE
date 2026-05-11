-- ============================================================
-- collections.taste_profile — Vivino식 테이스팅 프로파일.
-- 3-axis 슬라이더 (Light↔Bold, Dry↔Sweet, Soft↔Acidic) + 향 칩 다중 선택.
--
-- jsonb 로 저장하는 이유: chip 사전이 자주 진화할 가능성, 축이 추가될
-- 가능성 (Tannin, Alcohol 등). enum 컬럼 분리하면 마이그레이션 비용 큼.
--
-- 형태 (앱에서 검증):
--   { body: 1-5 | null, sweet: 1-5 | null, acid: 1-5 | null,
--     tags: ["red_fruit", "earthy", ...] }
-- ============================================================

alter table collections
  add column if not exists taste_profile jsonb;

-- ============================================================
-- wines 검색 성능 fix — pg_trgm + 트리그램 GIN 인덱스 3개.
--
-- 진단 (2026-05-13):
--   wines.name ilike '%X%' 가 119,609 행 풀스캔 → 평균 610ms.
--   누적 100초+. useWineSearch / useWineMatch / AddPartnerWineSheet /
--   AddToCaveSheet 등 다수 진입점이 모두 같은 패턴.
--
-- 원인:
--   기존 인덱스 (search_vector GIN, producer btree, country/region) 는
--   `ilike '%X%'` 형태에 활용 안 됨. btree 는 prefix 만, GIN tsvector 는
--   textSearch 에만.
--
-- fix:
--   pg_trgm 확장 + name / name_ko / producer 에 trigram GIN 인덱스.
--   ilike 쿼리가 인덱스 자동 활용 → 610ms → <50ms 목표.
-- ============================================================

create extension if not exists pg_trgm;

create index if not exists wines_name_trgm
  on wines using gin (name gin_trgm_ops);

create index if not exists wines_name_ko_trgm
  on wines using gin (name_ko gin_trgm_ops);

create index if not exists wines_producer_trgm
  on wines using gin (producer gin_trgm_ops);

-- 통계 갱신 — 새 인덱스 즉시 활용되도록.
analyze wines;

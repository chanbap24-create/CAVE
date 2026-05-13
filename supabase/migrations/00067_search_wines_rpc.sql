-- ============================================================
-- search_wines RPC — wines 카탈로그 검색의 single source.
--
-- 배경 (2026-05-13):
--   useWineSearch / useWineMatch 가 .or(name.ilike,name_ko.ilike,producer.ilike)
--   로 호출 → planner 가 트리그램 인덱스 BitmapOr 활용 못 하고 풀스캔.
--   특히 한글 2자 이하 / OR 다중 컬럼 조합은 119,609 행 풀스캔 → 2.6초.
--
-- 해법:
--   wines.search_vector (이미 GIN 인덱스 idx_wines_search 존재) 에 prefix
--   tsquery 로 검색. EXPLAIN 으로 14ms 검증 (174배 빠름).
--
-- 안전성:
--   security invoker → wines RLS (read all) 그대로 적용.
--   q 는 to_tsquery 가 자체 파싱하므로 SQL injection 불가 (literal 만 허용).
--   특수문자가 들어와 to_tsquery 가 예외내면 빈 결과 반환 (exception block).
-- ============================================================

create or replace function search_wines(q text, lim int default 20)
returns table (
  id bigint,
  name text,
  name_ko text,
  producer text,
  category text,
  country text,
  region text,
  vintage_year int,
  alcohol_pct numeric,
  image_url text
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  tsq text;
begin
  -- 토큰별 prefix match (`:*`) + AND 결합. 빈 토큰 / 특수문자 제거.
  select string_agg(t || ':*', ' & ')
    into tsq
    from (
      select regexp_replace(t, '[^[:alnum:]가-힣]', '', 'g') as t
      from regexp_split_to_table(coalesce(q, ''), '\s+') t
    ) cleaned
    where length(t) > 0;

  if tsq is null or tsq = '' then
    return;
  end if;

  return query
    select w.id, w.name, w.name_ko, w.producer, w.category,
           w.country, w.region, w.vintage_year, w.alcohol_pct, w.image_url
    from wines w
    where w.search_vector @@ to_tsquery('simple', tsq)
    order by ts_rank(w.search_vector, to_tsquery('simple', tsq)) desc
    limit lim;
exception when others then
  -- 잘못된 tsquery 입력은 그냥 빈 결과로 (앱 안 깨지게).
  return;
end;
$$;

grant execute on function search_wines(text, int) to anon, authenticated;

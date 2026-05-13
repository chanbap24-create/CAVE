-- ============================================================
-- search_wines RPC 타입 fix.
--
-- 00067/00068 의 returns table 정의가 wines 실제 컬럼 타입과 안 맞아
-- exception 발생 → 핸들러가 삼켜 빈 결과 반환됐던 문제 해결.
--
-- 차이:
--   - category: USER-DEFINED enum `spirit_category` → text 캐스팅
--   - vintage_year: smallint → smallint (시그니처 일치)
--
-- PG 는 CREATE OR REPLACE 로 return type 변경 불가 → DROP 후 재생성.
-- ============================================================

drop function if exists search_wines(text, int);

create function search_wines(q text, lim int default 20)
returns table (
  id bigint,
  name text,
  name_ko text,
  producer text,
  category text,
  country text,
  region text,
  vintage_year smallint,
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
  select string_agg(cleaned, ' & ')
    into tsq
  from (
    select regexp_replace(word, '[^[:alnum:]가-힣]', '', 'g') || ':*' as cleaned
    from regexp_split_to_table(coalesce(q, ''), '\s+') as word
  ) parts
  where length(cleaned) > 2;

  if tsq is null or tsq = '' then
    return;
  end if;

  return query
    select w.id, w.name, w.name_ko, w.producer, w.category::text,
           w.country, w.region, w.vintage_year, w.alcohol_pct, w.image_url
    from wines w
    where w.search_vector @@ to_tsquery('simple', tsq)
    order by ts_rank(w.search_vector, to_tsquery('simple', tsq)) desc
    limit lim;
end;
$$;

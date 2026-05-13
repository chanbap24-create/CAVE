-- ============================================================
-- search_wines 를 plpgsql → SQL 언어로 재구성.
--
-- 측정 (2026-05-13):
--   동일 쿼리: 직접 SQL = 17ms, plpgsql RPC = 2583ms (152배 느림).
--   plpgsql 변수 대입 후 to_tsquery 호출 시 planner 가 인덱스 plan
--   재사용 못 하는 케이스. SQL 언어 함수는 inline 가능.
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
language sql
stable
security invoker
set search_path = public
as $$
  with parts as (
    select string_agg(cleaned, ' & ') as tsq
    from (
      select regexp_replace(word, '[^[:alnum:]가-힣]', '', 'g') || ':*' as cleaned
      from regexp_split_to_table(coalesce(q, ''), '\s+') as word
    ) tokens
    where length(cleaned) > 2
  )
  select w.id, w.name, w.name_ko, w.producer, w.category::text,
         w.country, w.region, w.vintage_year, w.alcohol_pct, w.image_url
  from wines w, parts p
  where p.tsq is not null and p.tsq <> ''
    and w.search_vector @@ to_tsquery('simple', p.tsq)
  order by ts_rank(w.search_vector, to_tsquery('simple', p.tsq)) desc
  limit lim;
$$;

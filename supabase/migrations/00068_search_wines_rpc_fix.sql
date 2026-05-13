-- ============================================================
-- search_wines RPC fix (00067 의 컬럼 알리아스 충돌 해소).
--
-- 00067 에서는 plpgsql 안 `regexp_split_to_table(...) t` 의 `t` 가
-- 테이블 알리아스 / 컬럼명 모두로 해석되어 tsq 생성이 NULL 이 됨.
-- 명시적 alias (token) + word 기반 from 절로 재작성.
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
  select string_agg(cleaned, ' & ')
    into tsq
  from (
    select regexp_replace(word, '[^[:alnum:]가-힣]', '', 'g') || ':*' as cleaned
    from regexp_split_to_table(coalesce(q, ''), '\s+') as word
  ) parts
  where length(cleaned) > 2;  -- ':*' 만 있는 경우 (length 2) 제외

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
  return;
end;
$$;

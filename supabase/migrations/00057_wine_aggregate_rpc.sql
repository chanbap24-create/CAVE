-- ============================================================
-- wine_taste_aggregate(wine_id) — 와인 카탈로그 페이지 단일 호출.
--
-- 동일 wine_id 의 공개 collections 들에서:
--   1. 평균 별점 / body / sweet / acid (numeric, 1자리)
--   2. 상위 5개 향 태그 (taste_profile.tags 빈도)
--   3. 좋아요 상위 3개 댓글 (like_count >= 1)
-- 한 번에 반환 → N+1 query 방지.
--
-- security definer + search_path 고정 (00014~ 보안 패턴).
-- ============================================================

create or replace function wine_taste_aggregate(p_wine_id bigint)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_avg          jsonb;
  v_tags         jsonb;
  v_top_comments jsonb;
begin
  -- 1. 평균값 + 응답 수
  select to_jsonb(t)
    into v_avg
    from (
      select
        round(avg(rating)::numeric, 1)                                as rating,
        round(avg((taste_profile->>'body')::numeric)::numeric, 1)     as body,
        round(avg((taste_profile->>'sweet')::numeric)::numeric, 1)    as sweet,
        round(avg((taste_profile->>'acid')::numeric)::numeric, 1)     as acid,
        count(*) filter (where rating is not null)                    as rating_count,
        count(*) filter (where taste_profile is not null)             as profile_count
      from collections
      where wine_id = p_wine_id and is_public = true
    ) t;

  -- 2. 상위 5개 태그 (빈도 desc)
  select coalesce(jsonb_agg(jsonb_build_object('key', tag, 'count', cnt) order by cnt desc), '[]'::jsonb)
    into v_tags
    from (
      select tag, count(*) as cnt
      from collections,
        lateral jsonb_array_elements_text(coalesce(taste_profile->'tags', '[]'::jsonb)) as tag
      where wine_id = p_wine_id and is_public = true
      group by tag
      order by cnt desc
      limit 5
    ) sub;

  -- 3. 좋아요 상위 3개 댓글 (>= 1 like)
  select coalesce(jsonb_agg(c order by (c->>'like_count')::int desc), '[]'::jsonb)
    into v_top_comments
    from (
      select jsonb_build_object(
        'id',           cc.id,
        'body',         cc.body,
        'like_count',   cc.like_count,
        'created_at',   cc.created_at,
        'user_id',      cc.user_id,
        'username',     p.username,
        'display_name', p.display_name,
        'avatar_url',   p.avatar_url
      ) as c
      from collection_comments cc
      join collections col on col.id = cc.collection_id
      join profiles    p   on p.id   = cc.user_id
      where col.wine_id = p_wine_id
        and col.is_public = true
        and cc.like_count >= 1
      order by cc.like_count desc
      limit 3
    ) sub;

  return json_build_object(
    'avg',          coalesce(v_avg, '{}'::jsonb),
    'top_tags',     v_tags,
    'top_comments', v_top_comments
  );
end;
$$;

grant execute on function wine_taste_aggregate(bigint) to authenticated;

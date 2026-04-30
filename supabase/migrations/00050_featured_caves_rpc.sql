-- ============================================================
-- get_featured_caves RPC — 셀러 발견 server-side ranking + enrichment.
--
-- 회귀 시나리오 (수정 전 useFeaturedCaves.ts):
--   카테고리 모드: collections.select('*, wines!inner(category)').limit(1000)
--   전체 모드: collections.select(...).limit(2000)
--   → 1000~2000 row 다운로드 후 클라이언트 group by 로 top 10 ranking.
--   이어서 profiles, collections (다시), gatherings (host + member), posts,
--   post_images 까지 6 round-trip 의 batch fetch.
--   1000 CCU 가 홈 탭 진입할 때마다 → DB 부하 + 네트워크 폭주.
--
-- 수정:
--   ranking + enrichment 를 한 SQL 로 묶음. 클라이언트는 RPC 1회 + (있으면)
--   post_images 작은 batch 1회로 끝.
--
--   ranking:
--     - p_category != null : 해당 카테고리 보유 수 합계
--     - p_category null    : 카테고리별 sqrt(count) 합 (다양성 가산)
--
--   enrichment (top N 사용자):
--     - profile (username, display_name, avatar_url, collection_count)
--     - countries (보유한 국가 수)
--     - top_category (가장 많이 보유한 카테고리)
--     - hosted_count, joined_count (active 모임)
--     - latest_post_id, latest_video_playback_id
--
-- security invoker 로 두어 RLS (`collections.is_public`, `gathering_members.
-- status='approved'` 등) 그대로 적용.
-- ============================================================

create or replace function get_featured_caves(
  p_category text default null,
  p_limit int default 10
)
returns table (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  collection_count int,
  countries int,
  top_category text,
  hosted_count int,
  joined_count int,
  latest_post_id bigint,
  latest_video_playback_id text
)
language sql
security invoker
stable
set search_path = pg_catalog, public
as $$
  with per_cat as (
    select c.user_id, w.category::text as category, count(*)::int as cnt
    from collections c
    join wines w on w.id = c.wine_id
    where coalesce(c.is_public, true) = true
      and (p_category is null or w.category::text = p_category)
    group by c.user_id, w.category
  ),
  ranked as (
    select user_id,
      case
        when p_category is not null then sum(cnt)::numeric
        else sum(sqrt(cnt))
      end as score
    from per_cat
    group by user_id
    order by score desc
    limit p_limit
  ),
  user_collections as (
    select c.user_id, w.category::text as category, w.country
    from collections c
    join wines w on w.id = c.wine_id
    where c.user_id in (select user_id from ranked)
      and coalesce(c.is_public, true) = true
  ),
  countries_per_user as (
    select uc.user_id, count(distinct uc.country)::int as cnt
    from user_collections uc
    where uc.country is not null
    group by uc.user_id
  ),
  cat_counts as (
    select user_id, category, count(*)::int as cnt
    from user_collections
    group by user_id, category
  ),
  top_cat_per_user as (
    select distinct on (cc.user_id) cc.user_id, cc.category
    from cat_counts cc
    order by cc.user_id, cc.cnt desc
  ),
  hosted as (
    select host_id, count(*)::int as cnt
    from gatherings
    where host_id in (select user_id from ranked) and status = 'open'
    group by host_id
  ),
  joined as (
    select gm.user_id, count(*)::int as cnt
    from gathering_members gm
    where gm.user_id in (select user_id from ranked) and gm.status = 'approved'
    group by gm.user_id
  ),
  latest_posts as (
    select distinct on (p.user_id) p.user_id, p.id, p.video_playback_id
    from posts p
    where p.user_id in (select user_id from ranked)
    order by p.user_id, p.created_at desc
  )
  select
    r.user_id,
    pr.username,
    pr.display_name,
    pr.avatar_url,
    coalesce(pr.collection_count, 0)::int,
    coalesce(cpu.cnt, 0),
    tcu.category,
    coalesce(h.cnt, 0),
    coalesce(j.cnt, 0),
    lp.id,
    lp.video_playback_id
  from ranked r
  join profiles pr on pr.id = r.user_id
  left join countries_per_user cpu on cpu.user_id = r.user_id
  left join top_cat_per_user tcu on tcu.user_id = r.user_id
  left join hosted h on h.host_id = r.user_id
  left join joined j on j.user_id = r.user_id
  left join latest_posts lp on lp.user_id = r.user_id
  order by r.score desc;
$$;

grant execute on function get_featured_caves(text, int) to authenticated;

-- ============================================================
-- get_collection_social_counts RPC — 셀러 소셜 카운트 server-side aggregate.
--
-- 회귀 시나리오 (수정 전 useCollectionSocial.ts):
--   셀러 리스트 진입 시 collection_likes / collection_comments 의 모든 row 를
--   `.select('collection_id').in('collection_id', ids)` 로 가져와서 클라이언트
--   에서 Map 그룹핑. 셀러 50병 × 좋아요 30 = 1500 row 다운로드 / 매 진입.
--   1000 CCU × 진입 1회 = 초당 1.5M row 가 클라이언트로 흐름.
--
-- 수정:
--   server-side count(*) group by 로 한 번에 응답. 페이로드는 N(컬렉션 수) 만큼.
--   security invoker 로 두어 기존 RLS (`is_public=true` 컬렉션만 노출) 가
--   그대로 적용 — private 컬렉션의 카운트는 0 으로 떨어짐.
-- ============================================================

create or replace function get_collection_social_counts(p_ids bigint[])
returns table (
  collection_id bigint,
  likes int,
  comments int,
  liked boolean
)
language sql
security invoker
set search_path = pg_catalog, public
as $$
  with ids as (select unnest(p_ids) as id),
  like_counts as (
    select collection_id, count(*)::int as cnt
    from collection_likes
    where collection_id = any(p_ids)
    group by collection_id
  ),
  comment_counts as (
    select collection_id, count(*)::int as cnt
    from collection_comments
    where collection_id = any(p_ids)
    group by collection_id
  ),
  my_likes as (
    select collection_id from collection_likes
    where collection_id = any(p_ids)
      and user_id = auth.uid()
  )
  select
    ids.id::bigint as collection_id,
    coalesce(lc.cnt, 0) as likes,
    coalesce(cc.cnt, 0) as comments,
    (ids.id in (select collection_id from my_likes)) as liked
  from ids
  left join like_counts lc on lc.collection_id = ids.id
  left join comment_counts cc on cc.collection_id = ids.id;
$$;

grant execute on function get_collection_social_counts(bigint[]) to authenticated;

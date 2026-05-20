-- ============================================================
-- collections — 같은 (user_id, wine_id) 중복 row 정리.
--
-- 2026-05-18: 이전 useAddToCave 가 보유 수량을 N row 복제로 표현했음.
-- 새 모델 = 1 row + quantity 컬럼. 기존 중복을 dedup 해서 통일.
--
-- 정책:
--   - 동일 user+wine 그룹에서 "정보가 가장 많은 row" 를 keep
--     (tasting_note 길이 → rating 유무 → photo_url 유무 → 최초 created_at)
--   - quantity 는 그룹 sum
--   - 나머지 row 는 삭제 (시음 노트가 다른 경우엔 사용자가 따로 만든 의도일 수
--     있어서 — 노트 길이로 우선순위 매김. 정말 다른 row 면 keep 우선순위에 따라
--     하나만 살아남음. 데이터 손실 가능성은 있으나 12 row 같은 명백한 중복
--     케이스가 90%+).
-- ============================================================

with ranked as (
  select
    id, user_id, wine_id, quantity,
    row_number() over (
      partition by user_id, wine_id
      order by
        coalesce(length(tasting_note), 0) desc,
        (rating is not null) desc,
        (photo_url is not null) desc,
        created_at asc
    ) as rn,
    sum(coalesce(quantity, 1)) over (partition by user_id, wine_id) as total_qty,
    count(*) over (partition by user_id, wine_id) as group_count
  from collections
  where user_id is not null and wine_id is not null
)
-- keep row 의 quantity 를 그룹 합으로 갱신
update collections c
set quantity = r.total_qty
from ranked r
where c.id = r.id and r.rn = 1 and r.group_count > 1;

-- 나머지 row 삭제
with ranked as (
  select
    id,
    row_number() over (
      partition by user_id, wine_id
      order by
        coalesce(length(tasting_note), 0) desc,
        (rating is not null) desc,
        (photo_url is not null) desc,
        created_at asc
    ) as rn,
    count(*) over (partition by user_id, wine_id) as group_count
  from collections
  where user_id is not null and wine_id is not null
)
delete from collections c
using ranked r
where c.id = r.id and r.rn > 1 and r.group_count > 1;

-- 이후 중복 재발 방지 — UNIQUE 제약 (같은 user 가 같은 wine 두 번 등록 X).
-- 새 모델은 quantity 컬럼으로 표현하므로 UNIQUE 가 의도 정합.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'collections_user_wine_unique'
  ) then
    alter table collections
      add constraint collections_user_wine_unique unique (user_id, wine_id);
  end if;
end $$;

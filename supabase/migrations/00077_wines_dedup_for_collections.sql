-- ============================================================
-- wines 테이블 부분 dedup — 사용자 collections 에 영향 주는 중복만.
--
-- 2026-05-18: 라벨 스캔이 매번 wines INSERT 라 같은 와인의 wine_id 가 둘 이상.
-- 이번에 useAddToCave.addNew 가 pre-check 하도록 fix 했지만, 기존 중복 row 는
-- 그대로라 셀러에 같은 와인 두 번 표시되는 문제 남음.
--
-- 정책 (scoped — collections 영향 row 만):
--   1. (name, producer, vintage_year) 동일한 wines 그룹 찾기
--   2. keep_id = min(id) (verified 우선 → image_url 우선 → 가장 오래된 것)
--   3. collections.wine_id 를 keep_id 로 일괄 업데이트 (UNIQUE 충돌은 quantity 합산)
--   4. partner_wine_menu.wine_id 도 동일 처리
--   5. orders.wine_id 도 동일 처리
--   6. 중복 wines row 자체 삭제는 안 함 (다른 외래키 의존 가능성, 안전)
--
-- collections 의 UNIQUE(user_id, wine_id) 제약 → 같은 사용자가 두 wine_id 가지고
-- 있었는데 같은 keep_id 로 바뀌면 충돌. 미리 수량 합치고 한 row 만 keep.
-- ============================================================

-- 1. 중복 그룹 찾기
create temporary table _wine_dedup_map as
with groups as (
  select
    lower(name) as name_l,
    lower(coalesce(producer, '')) as producer_l,
    coalesce(vintage_year::text, '_null_') as vintage_k,
    id,
    row_number() over (
      partition by lower(name), lower(coalesce(producer, '')), coalesce(vintage_year::text, '_null_')
      order by
        verified desc,
        (image_url is not null) desc,
        id asc
    ) as rn,
    count(*) over (
      partition by lower(name), lower(coalesce(producer, '')), coalesce(vintage_year::text, '_null_')
    ) as group_count
  from wines
)
select
  g.id as dup_id,
  k.id as keep_id
from groups g
join groups k
  on k.name_l = g.name_l and k.producer_l = g.producer_l and k.vintage_k = g.vintage_k and k.rn = 1
where g.rn > 1 and g.group_count > 1;

-- 2. collections — 같은 사용자가 keep_id 와 dup_id 둘 다 가지고 있는 경우 수량 합산 후 dup 제거
with affected as (
  select c.id, c.user_id, m.keep_id, c.quantity
  from collections c
  join _wine_dedup_map m on m.dup_id = c.wine_id
),
target_qty as (
  -- keep_id 쪽 quantity 에 추가될 합
  select a.user_id, a.keep_id, sum(coalesce(a.quantity, 1)) as add_qty
  from affected a
  -- 이미 keep_id 로 collection 있는 사용자만
  where exists (
    select 1 from collections c2
    where c2.user_id = a.user_id and c2.wine_id = a.keep_id
  )
  group by a.user_id, a.keep_id
)
update collections c
set quantity = coalesce(c.quantity, 1) + t.add_qty
from target_qty t
where c.user_id = t.user_id and c.wine_id = t.keep_id;

-- 사용자가 keep_id 없으면 dup_id 행의 wine_id 만 keep_id 로 교체 (단순 repoint)
update collections c
set wine_id = m.keep_id
from _wine_dedup_map m
where c.wine_id = m.dup_id
  and not exists (
    select 1 from collections c2
    where c2.user_id = c.user_id and c2.wine_id = m.keep_id and c2.id <> c.id
  );

-- 그래도 남은 dup 행 (이미 keep 도 있던 케이스 — 수량 위에서 합쳤으니 이건 삭제)
delete from collections c
using _wine_dedup_map m
where c.wine_id = m.dup_id;

-- 3. partner_wine_menu — 같은 파트너가 두 wine_id 가졌으면 dup 삭제 (가격은 keep 유지)
delete from partner_wine_menu pwm
using _wine_dedup_map m
where pwm.wine_id = m.dup_id
  and exists (
    select 1 from partner_wine_menu pwm2
    where pwm2.partner_id = pwm.partner_id and pwm2.wine_id = m.keep_id
  );
update partner_wine_menu pwm
set wine_id = m.keep_id
from _wine_dedup_map m
where pwm.wine_id = m.dup_id;

-- 4. orders — 단순 repoint (주문 row 는 분리 유지, snapshot 가격 그대로)
update orders o
set wine_id = m.keep_id
from _wine_dedup_map m
where o.wine_id = m.dup_id;

drop table _wine_dedup_map;

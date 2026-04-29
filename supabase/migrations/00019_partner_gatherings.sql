-- ============================================================
-- 파트너 모임 지원: 샵/소믈리에/업장이 만드는 모임을 유저 모임과 분리.
-- docs/icave_concept_updates.md §4 트레바리식 위계: 유저 < 샵 < 시즌 클럽.
--
-- v1 (지금):
--   - gatherings.host_type 컬럼으로 모임 출처 분류
--   - profiles.is_partner / partner_label 로 파트너 자격 부여 (관리자가 부여)
--   - 파트너만 host_type != 'user' 모임 생성 가능 (RLS check)
-- v2 이후:
--   - 별도 venues 테이블과 연결, 시즌 클럽(season_clubs) 통합,
--     POS 연동 / 정산 흐름 추가
-- ============================================================

-- 1) host_type enum
do $$ begin
  if not exists (select 1 from pg_type where typname = 'gathering_host_type') then
    create type gathering_host_type as enum ('user', 'shop', 'sommelier', 'venue');
  end if;
end $$;

-- 2) gatherings.host_type 컬럼 (기본 'user')
alter table gatherings
  add column if not exists host_type gathering_host_type not null default 'user';

create index if not exists idx_gatherings_host_type
  on gatherings (host_type, status, gathering_date);

-- 3) profiles 에 파트너 플래그
alter table profiles
  add column if not exists is_partner boolean not null default false;

alter table profiles
  add column if not exists partner_label text;
-- partner_label: UI 노출용 라벨. 예: 'ABC 와인샵', '소믈리에 김XX'.
-- is_partner=true 사용자는 모임 생성 시 host_type 을 user 가 아닌 값으로
-- 지정 가능 (앱/웹 폼에서 노출). is_partner=false 면 host_type='user' 강제.

-- 4) RLS: is_partner=false 인 사용자가 host_type != 'user' 로 모임을 생성/수정
--    못하도록 트리거 기반 검증 (정책만으로는 컬럼별 검증이 까다로움).
create or replace function enforce_partner_host_type()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_is_partner boolean;
begin
  if new.host_type = 'user' then
    return new;  -- 기본 케이스 — 누구나 가능
  end if;
  select is_partner into v_is_partner from profiles where id = new.host_id;
  if coalesce(v_is_partner, false) = false then
    raise exception 'Only partner profiles can host non-user gatherings (host_type=%)', new.host_type;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_partner_host_type on gatherings;
create trigger trg_enforce_partner_host_type
  before insert or update of host_type, host_id on gatherings
  for each row execute function enforce_partner_host_type();

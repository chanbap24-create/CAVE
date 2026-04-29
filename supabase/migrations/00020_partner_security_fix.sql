-- ============================================================
-- 00019 보안 보강: 파트너 트리거 우회 차단 + 자기-승격 방지.
-- 분석 보고서 (2026-04-29) S1 / S2 대응.
--
-- S1: enforce_partner_host_type 트리거가 host_id 의 is_partner 만 보고 통과시켜
--     비파트너 사용자 A 가 host_id = 파트너 B 의 id 로 INSERT 하면 우회 가능했음.
--     → 호출자(auth.uid) 가 host_id 본인인지 검증.
-- S2: profiles.is_partner / partner_label 컬럼이 RLS UPDATE 정책에서 자유로워
--     일반 사용자가 자기 프로필 업데이트로 self-promote 가능했음.
--     → BEFORE UPDATE 트리거로 service_role 만 허용.
-- ============================================================

-- =========================================================
-- S1: 파트너 모임 생성 시 호출자가 본인 host_id 인지 검증
-- =========================================================
create or replace function enforce_partner_host_type()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_is_partner boolean;
  v_actor      uuid := auth.uid();
begin
  -- 호출자가 host_id 본인이 아니면 차단 (모든 host_type 에 대해).
  -- service_role 호출 시 auth.uid() = NULL → 통과 (admin/server-side 작업).
  if v_actor is not null and v_actor <> new.host_id then
    raise exception 'Cannot create/update gathering on behalf of another user (actor=% host_id=%)', v_actor, new.host_id;
  end if;

  -- host_type='user' 는 추가 검증 불필요.
  if new.host_type = 'user' then
    return new;
  end if;

  -- host_type != 'user' 는 host_id 가 파트너여야만 가능.
  select is_partner into v_is_partner from profiles where id = new.host_id;
  if coalesce(v_is_partner, false) = false then
    raise exception 'Only partner profiles can host non-user gatherings (host_type=%)', new.host_type;
  end if;
  return new;
end;
$$;

-- 기존 트리거 재바인딩 (함수 본문만 갱신했지만 명시적으로 다시 걸어 안전 보장)
drop trigger if exists trg_enforce_partner_host_type on gatherings;
create trigger trg_enforce_partner_host_type
  before insert or update of host_type, host_id on gatherings
  for each row execute function enforce_partner_host_type();

-- =========================================================
-- S2: profiles.is_partner / partner_label 자기-승격 차단
-- =========================================================
create or replace function lock_partner_columns()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  -- 두 컬럼이 변경되었는지 확인 후, 호출자가 service_role 이 아니면 거부.
  if new.is_partner is distinct from old.is_partner
     or new.partner_label is distinct from old.partner_label
  then
    if auth.uid() is not null then
      raise exception 'is_partner / partner_label can only be modified by service_role (admin). actor=%', auth.uid();
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_lock_partner_columns on profiles;
create trigger trg_lock_partner_columns
  before update of is_partner, partner_label on profiles
  for each row execute function lock_partner_columns();

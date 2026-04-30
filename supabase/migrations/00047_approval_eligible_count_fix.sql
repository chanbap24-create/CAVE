-- ============================================================
-- apply_unanimous_approval 의 eligible_count 보강.
--
-- 회귀 시나리오:
--   호스트가 (실수 또는 legacy 데이터로) 자기 모임에 status='approved' 멤버로
--   들어가 있으면 1(host) + count(approved members 중 host 본인) = 2 로 이중
--   카운트되어, 1명 호스트 + 1명 신청자 모임에서 승인이 영원히 안 떨어짐.
--
-- 수정:
--   approved 멤버 카운트에서 host_id 와 신청자(requester_id) 를 명시적으로
--   제외. 만장일치 voter 풀은 "호스트 + 호스트가 아닌 다른 approved 멤버"
--   만으로 정확히 정의.
-- ============================================================

create or replace function apply_unanimous_approval() returns trigger
language plpgsql as $$
declare
  app gathering_approvals%rowtype;
  v_host_id uuid;
  eligible_count int;
  approve_count int;
  reject_count int;
begin
  select * into app from gathering_approvals where id = new.approval_id;
  if app.status <> 'pending' then
    return new;
  end if;

  -- Any reject = immediate rejection.
  select count(*) into reject_count
    from gathering_approval_votes
    where approval_id = new.approval_id and vote = 'reject';
  if reject_count > 0 then
    update gathering_approvals
       set status = 'rejected', resolved_at = now()
     where id = new.approval_id;
    return new;
  end if;

  -- Eligible voters = 호스트 + (호스트와 신청자를 제외한 approved 멤버).
  select g.host_id into v_host_id from gatherings g where g.id = app.gathering_id;
  select 1 + count(*) into eligible_count
    from gathering_members m
    where m.gathering_id = app.gathering_id
      and m.status = 'approved'
      and m.user_id <> v_host_id              -- host 가 멤버로도 등록돼 있으면 이중 카운트 방지
      and m.user_id <> app.requester_id;      -- 신청자가 (legacy 사유로) approved 상태라도 카운트 제외

  select count(*) into approve_count
    from gathering_approval_votes
    where approval_id = new.approval_id and vote = 'approve';

  if approve_count >= eligible_count then
    update gathering_approvals
       set status = 'approved', resolved_at = now()
     where id = new.approval_id;

    if app.request_type = 'wine_change' and app.target_contribution_id is not null then
      update gathering_contributions
         set collection_id = app.new_collection_id,
             updated_at = now()
       where id = app.target_contribution_id;
    elsif app.request_type = 'no_wine_apply' then
      update gathering_members
         set status = 'approved'
       where gathering_id = app.gathering_id and user_id = app.requester_id;
    end if;
  end if;

  return new;
end;
$$;

-- 트리거 자체는 00029 에서 이미 attach 되어 있어 재선언 불필요.

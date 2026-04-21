-- Move gathering-related notifications from client-side inserts to DB
-- triggers. Mirrors the post-level (00004) and collection-level (00034)
-- patterns. Pairs with 00036 which blocks direct client inserts entirely.
--
-- Apply via `supabase db push`.

-- =========================================================
-- 1. gathering_members INSERT (pending) → notify host
-- =========================================================
create or replace function notify_on_gathering_member_insert() returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_host  uuid;
  v_title text;
begin
  if NEW.status <> 'pending' then return null; end if;

  select host_id, title into v_host, v_title
    from gatherings where id = NEW.gathering_id;

  if v_host is null or v_host = NEW.user_id then return null; end if;

  insert into notifications (user_id, type, actor_id, reference_id, reference_type, body)
  values (v_host, 'gathering_invite', NEW.user_id, NEW.gathering_id::text, 'gathering',
          format('wants to join "%s"', coalesce(v_title, '')));
  return null;
end;
$$;

drop trigger if exists trg_notify_gathering_member_insert on gathering_members;
create trigger trg_notify_gathering_member_insert
after insert on gathering_members
for each row execute function notify_on_gathering_member_insert();

-- =========================================================
-- 2. gathering_members UPDATE (pending → approved/rejected) → notify applicant
-- =========================================================
create or replace function notify_on_gathering_member_status_change() returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_title text;
  v_host  uuid;
  v_type  notification_type;
  v_body  text;
begin
  if OLD.status is not distinct from NEW.status then return null; end if;
  if NEW.status not in ('approved', 'rejected') then return null; end if;

  select host_id, title into v_host, v_title
    from gatherings where id = NEW.gathering_id;

  if NEW.status = 'approved' then
    v_type := 'gathering_approved';
    v_body := format('approved your request to join "%s"', coalesce(v_title, ''));
  else
    v_type := 'gathering_rejected';
    v_body := format('declined your request to join "%s"', coalesce(v_title, ''));
  end if;

  insert into notifications (user_id, type, actor_id, reference_id, reference_type, body)
  values (NEW.user_id, v_type, v_host, NEW.gathering_id::text, 'gathering', v_body);
  return null;
end;
$$;

drop trigger if exists trg_notify_gathering_member_status_change on gathering_members;
create trigger trg_notify_gathering_member_status_change
after update on gathering_members
for each row execute function notify_on_gathering_member_status_change();

-- =========================================================
-- 3. gathering_approvals INSERT → notify host + approved members
-- =========================================================
create or replace function notify_on_gathering_approval_insert() returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_title text;
  v_host  uuid;
  v_body  text;
begin
  if NEW.status <> 'pending' then return null; end if;

  select host_id, title into v_host, v_title
    from gatherings where id = NEW.gathering_id;
  if v_host is null then return null; end if;

  if NEW.request_type = 'wine_change' then
    v_body := format('requested a wine change in "%s"', coalesce(v_title, ''));
  elsif NEW.request_type = 'no_wine_apply' then
    v_body := format('wants to join "%s" without a wine', coalesce(v_title, ''));
  else
    v_body := format('started a vote in "%s"', coalesce(v_title, ''));
  end if;

  -- Fan out to every eligible voter (host + approved members) except the
  -- requester themselves.
  insert into notifications (user_id, type, actor_id, reference_id, reference_type, body)
  select target_uid, 'gathering_vote_request', NEW.requester_id,
         NEW.gathering_id::text, 'gathering', v_body
  from (
    select v_host as target_uid
    union
    select m.user_id
      from gathering_members m
     where m.gathering_id = NEW.gathering_id and m.status = 'approved'
  ) eligible
  where target_uid <> NEW.requester_id;

  return null;
end;
$$;

drop trigger if exists trg_notify_gathering_approval_insert on gathering_approvals;
create trigger trg_notify_gathering_approval_insert
after insert on gathering_approvals
for each row execute function notify_on_gathering_approval_insert();

-- =========================================================
-- 4. gathering_approval_votes INSERT → notify requester
--    Trigger name MUST come alphabetically after
--    trg_apply_unanimous_approval so by the time we read the approval
--    status it reflects the post-vote resolution.
-- =========================================================
create or replace function notify_on_gathering_vote_cast() returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_app   gathering_approvals%rowtype;
  v_title text;
  v_type  notification_type;
  v_body  text;
begin
  select * into v_app from gathering_approvals where id = NEW.approval_id;
  if v_app.requester_id = NEW.voter_id then return null; end if;

  select title into v_title from gatherings where id = v_app.gathering_id;

  if v_app.status = 'approved' then
    v_type := 'gathering_vote_approved';
    v_body := format('Your request in "%s" was approved', coalesce(v_title, ''));
  elsif v_app.status = 'rejected' then
    v_type := 'gathering_vote_rejected';
    v_body := format('Your request in "%s" was rejected', coalesce(v_title, ''));
  else
    v_type := 'gathering_vote_cast';
    if NEW.vote = 'approve' then
      v_body := format('approved your request in "%s"', coalesce(v_title, ''));
    else
      v_body := format('voted against your request in "%s"', coalesce(v_title, ''));
    end if;
  end if;

  insert into notifications (user_id, type, actor_id, reference_id, reference_type, body)
  values (v_app.requester_id, v_type, NEW.voter_id,
          v_app.gathering_id::text, 'gathering', v_body);

  return null;
end;
$$;

-- `trg_apply_unanimous_approval` < `trg_notify_vote_cast` (alphabetical)
drop trigger if exists trg_notify_vote_cast on gathering_approval_votes;
create trigger trg_notify_vote_cast
after insert on gathering_approval_votes
for each row execute function notify_on_gathering_vote_cast();

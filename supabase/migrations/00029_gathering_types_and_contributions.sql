-- Gathering type + participant-contributed wines + approval voting.
-- Covers the whole "host prepares some wines, attendees bring their own,
-- changes require group vote" flow specced today.
--
-- Apply via `supabase db push`.

-- =========================================================
-- 1. gatherings.gathering_type
--    cost_share : host prepares wines (some may be blind/surprise)
--    byob       : everyone brings their own
--    donation   : host optionally provides; attendees just show up
-- =========================================================
alter table gatherings add column if not exists gathering_type text default 'cost_share';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'gatherings_type_valid') then
    alter table gatherings add constraint gatherings_type_valid
      check (gathering_type in ('cost_share', 'byob', 'donation'));
  end if;
end $$;

-- =========================================================
-- 2. gathering_contributions
--    One row per wine committed to a gathering. Host rows land on create;
--    attendee rows land on apply (pending) and move to committed on approve.
--    `collection_id is null` encodes the "blind" host slot OR a no-wine
--    attendance request.
-- =========================================================
create table if not exists gathering_contributions (
  id              bigint generated always as identity primary key,
  gathering_id    bigint not null references gatherings(id) on delete cascade,
  user_id         uuid   not null references profiles(id)   on delete cascade,
  collection_id   bigint references collections(id) on delete set null,
  is_blind        boolean not null default false,
  slot_order      smallint not null default 0,
  note            text,
  status          text not null default 'pending'
    check (status in ('pending','committed','canceled')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- Same bottle can't be double-booked to the same gathering.
  unique (gathering_id, collection_id),
  -- Blind slots always have collection_id null (placeholder until reveal).
  check (not is_blind or collection_id is null)
);

create index if not exists gathering_contributions_gathering_idx
  on gathering_contributions (gathering_id, status, slot_order);
create index if not exists gathering_contributions_user_idx
  on gathering_contributions (user_id, created_at desc);

-- Ownership guard: a user can only pledge wines from their own cellar.
-- FK alone isn't enough (FK just requires the row exists anywhere), so we
-- assert in a trigger on insert/update.
create or replace function assert_contribution_owner() returns trigger
language plpgsql as $$
declare
  owner uuid;
begin
  if new.collection_id is not null then
    select user_id into owner from collections where id = new.collection_id;
    if owner is null or owner <> new.user_id then
      raise exception 'collection_id % does not belong to user %', new.collection_id, new.user_id;
    end if;
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_contribution_owner on gathering_contributions;
create trigger trg_contribution_owner
  before insert or update on gathering_contributions
  for each row execute function assert_contribution_owner();

alter table gathering_contributions enable row level security;

-- Read: host of the gathering + anyone with an approved membership + the
-- contributor themselves (while pending).
drop policy if exists "contributions_read" on gathering_contributions;
create policy "contributions_read" on gathering_contributions
  for select to authenticated using (
    user_id = auth.uid()
    or exists (
      select 1 from gatherings g
      where g.id = gathering_contributions.gathering_id and g.host_id = auth.uid()
    )
    or exists (
      select 1 from gathering_members m
      where m.gathering_id = gathering_contributions.gathering_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
    )
  );

drop policy if exists "contributions_insert_self" on gathering_contributions;
create policy "contributions_insert_self" on gathering_contributions
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "contributions_update_self_or_host" on gathering_contributions;
create policy "contributions_update_self_or_host" on gathering_contributions
  for update to authenticated using (
    user_id = auth.uid()
    or exists (
      select 1 from gatherings g
      where g.id = gathering_contributions.gathering_id and g.host_id = auth.uid()
    )
  );

drop policy if exists "contributions_delete_self" on gathering_contributions;
create policy "contributions_delete_self" on gathering_contributions
  for delete to authenticated using (user_id = auth.uid());

-- =========================================================
-- 3. gathering_approvals
--    Captures wine-change or no-wine-apply requests that require unanimous
--    vote from the current membership (host + approved members only —
--    pending applicants don't vote).
-- =========================================================
create table if not exists gathering_approvals (
  id                      bigint generated always as identity primary key,
  gathering_id            bigint not null references gatherings(id) on delete cascade,
  requester_id            uuid   not null references profiles(id)   on delete cascade,
  request_type            text   not null
    check (request_type in ('wine_change','no_wine_apply')),
  target_contribution_id  bigint references gathering_contributions(id) on delete set null,
  new_collection_id       bigint references collections(id) on delete set null,
  note                    text,
  status                  text   not null default 'pending'
    check (status in ('pending','approved','rejected','canceled')),
  created_at              timestamptz not null default now(),
  resolved_at             timestamptz
);

-- Only one pending approval per contribution at a time (prevents duplicate
-- change requests layering). Enforced via partial unique index.
create unique index if not exists gathering_approvals_one_pending_per_contribution
  on gathering_approvals (target_contribution_id)
  where status = 'pending' and target_contribution_id is not null;

create index if not exists gathering_approvals_gathering_idx
  on gathering_approvals (gathering_id, status, created_at desc);

alter table gathering_approvals enable row level security;

drop policy if exists "approvals_read" on gathering_approvals;
create policy "approvals_read" on gathering_approvals
  for select to authenticated using (
    requester_id = auth.uid()
    or exists (
      select 1 from gatherings g
      where g.id = gathering_approvals.gathering_id and g.host_id = auth.uid()
    )
    or exists (
      select 1 from gathering_members m
      where m.gathering_id = gathering_approvals.gathering_id
        and m.user_id = auth.uid()
        and m.status = 'approved'
    )
  );

drop policy if exists "approvals_insert_self" on gathering_approvals;
create policy "approvals_insert_self" on gathering_approvals
  for insert to authenticated with check (auth.uid() = requester_id);

-- =========================================================
-- 4. gathering_approval_votes
-- =========================================================
create table if not exists gathering_approval_votes (
  approval_id bigint not null references gathering_approvals(id) on delete cascade,
  voter_id    uuid   not null references profiles(id)            on delete cascade,
  vote        text   not null check (vote in ('approve','reject')),
  created_at  timestamptz not null default now(),
  primary key (approval_id, voter_id)
);

alter table gathering_approval_votes enable row level security;

drop policy if exists "votes_read" on gathering_approval_votes;
create policy "votes_read" on gathering_approval_votes
  for select to authenticated using (
    exists (
      select 1 from gathering_approvals a
      join gatherings g on g.id = a.gathering_id
      where a.id = gathering_approval_votes.approval_id
        and (
          g.host_id = auth.uid()
          or exists (
            select 1 from gathering_members m
            where m.gathering_id = g.id
              and m.user_id = auth.uid()
              and m.status = 'approved'
          )
        )
    )
  );

-- Voters: only host or approved members (pending applicants excluded).
drop policy if exists "votes_insert_member_or_host" on gathering_approval_votes;
create policy "votes_insert_member_or_host" on gathering_approval_votes
  for insert to authenticated with check (
    auth.uid() = voter_id
    and exists (
      select 1 from gathering_approvals a
      join gatherings g on g.id = a.gathering_id
      where a.id = gathering_approval_votes.approval_id
        and (
          g.host_id = auth.uid()
          or exists (
            select 1 from gathering_members m
            where m.gathering_id = g.id
              and m.user_id = auth.uid()
              and m.status = 'approved'
          )
        )
    )
  );

-- =========================================================
-- 5. Unanimous-vote auto-commit trigger
--    After each vote insert, check:
--      - any reject   → mark approval rejected
--      - all members voted approve (count matches host+approved members)
--                     → apply the change (wine swap or membership approve)
-- =========================================================
create or replace function apply_unanimous_approval() returns trigger
language plpgsql as $$
declare
  app gathering_approvals%rowtype;
  host_id uuid;
  eligible_count int;
  approve_count int;
  reject_count int;
begin
  select * into app from gathering_approvals where id = new.approval_id;
  if app.status <> 'pending' then
    return new; -- already resolved, ignore late votes
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

  -- Eligible voters = host + approved members.
  select g.host_id into host_id from gatherings g where g.id = app.gathering_id;
  select 1 + count(*) into eligible_count
    from gathering_members m
    where m.gathering_id = app.gathering_id and m.status = 'approved';

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

drop trigger if exists trg_apply_unanimous_approval on gathering_approval_votes;
create trigger trg_apply_unanimous_approval
  after insert on gathering_approval_votes
  for each row execute function apply_unanimous_approval();

-- =========================================================
-- 6. Grants
-- =========================================================
grant select, insert, update, delete on gathering_contributions    to authenticated;
grant select, insert, update         on gathering_approvals        to authenticated;
grant select, insert                 on gathering_approval_votes   to authenticated;

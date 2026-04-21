-- Expose approved gathering memberships to any authenticated user.
--
-- Problem:
--   The 00001 gathering_members_read policy limits SELECT to:
--     - The member themselves (own row)
--     - The gathering host
--   Everyone else sees zero rows. The Members tab on the gathering detail
--   page therefore appears empty for non-host prospective attendees — they
--   can't tell if the gathering has any approved members before applying.
--
-- Fix:
--   Split the policy into two:
--     1. approved rows → visible to any authenticated user (public roster)
--     2. pending/rejected rows → stay private (self or host only)
--
-- Mirrors the gathering_contributions treatment in migration 00032.
--
-- Apply via `supabase db push`.

drop policy if exists "gathering_members_read" on gathering_members;
drop policy if exists "gathering_members_read_approved" on gathering_members;
drop policy if exists "gathering_members_read_private" on gathering_members;

create policy "gathering_members_read_approved" on gathering_members
  for select to authenticated using (status = 'approved');

create policy "gathering_members_read_private" on gathering_members
  for select to authenticated using (
    status <> 'approved'
    and (
      auth.uid() = user_id
      or exists (
        select 1 from gatherings g
        where g.id = gathering_members.gathering_id and g.host_id = auth.uid()
      )
    )
  );

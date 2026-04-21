-- Expose committed contributions to any authenticated user.
--
-- Problem:
--   The 00029 contributions_read policy only allows the contributor, host,
--   or approved member to see rows. A prospective attendee (not yet
--   applied) opening the gathering detail page therefore sees an empty
--   Wine Lineup — the host's prepared bottles are invisible until they
--   join. That defeats the whole point of the lineup (deciding whether
--   the gathering is worth applying to).
--
-- Fix:
--   Split the policy into two:
--     1. "contributions_read_committed" — any authenticated user can see
--        rows with status = 'committed'. These are the "advertised" wines.
--     2. "contributions_read_private" — contributor / host / approved
--        member can additionally see pending + canceled rows (their own
--        draft applications, rejected swaps, etc.).
--
-- Apply via `supabase db push`.

-- Drop the monolithic policy.
drop policy if exists "contributions_read" on gathering_contributions;

-- Public committed wines — advertised lineup.
drop policy if exists "contributions_read_committed" on gathering_contributions;
create policy "contributions_read_committed" on gathering_contributions
  for select to authenticated using (status = 'committed');

-- Private (pending / canceled) rows — same audience as before.
drop policy if exists "contributions_read_private" on gathering_contributions;
create policy "contributions_read_private" on gathering_contributions
  for select to authenticated using (
    status <> 'committed'
    and (
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
    )
  );

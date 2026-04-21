-- Close the client-side notification spam vector.
--
-- Prior policy:
--   for insert with check (auth.uid() = actor_id and user_id <> actor_id)
-- allowed any authenticated user to POST /rest/v1/notifications with an
-- arbitrary `user_id` recipient. Phase 3/5 added four client-side
-- notifications.insert() callsites, expanding the attack surface.
--
-- With 00004 (posts), 00034 (collections), and 00035 (gatherings)
-- covering every current notification origin via SECURITY DEFINER
-- triggers, there is no legitimate need for clients to INSERT directly.
-- Switch the policy to `with check (false)` — the DB is now the sole
-- producer. SECURITY DEFINER triggers bypass RLS so they're unaffected.
--
-- Apply via `supabase db push`.

drop policy if exists "notifications_insert" on notifications;
drop policy if exists "notifications_insert_blocked" on notifications;
create policy "notifications_insert_blocked" on notifications
  for insert with check (false);

-- Mux upload ownership tracking
-- Supports: (a) mux-status ownership verification (prevent cross-user upload_id polling)
--          (b) per-user rate limiting for mux-upload (count recent rows)
--          (c) audit trail for which user created which Mux asset
--
-- Apply via `supabase db push` or SQL editor.

-- =========================================================
-- Table: mux_uploads
-- =========================================================
create table if not exists mux_uploads (
  upload_id   text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  asset_id    text,
  playback_id text,
  created_at  timestamptz not null default now()
);

-- Rate-limit query path: WHERE user_id = ? AND created_at > now() - interval '1 hour'
create index if not exists mux_uploads_user_created_idx
  on mux_uploads (user_id, created_at desc);

-- =========================================================
-- RLS: owner-only read. Writes happen from Edge Functions
-- using the service role key, so no insert/update policies
-- for clients are defined (default-deny).
-- =========================================================
alter table mux_uploads enable row level security;

drop policy if exists "mux_uploads_read_own" on mux_uploads;
create policy "mux_uploads_read_own" on mux_uploads
  for select using (auth.uid() = user_id);

-- No client-side insert/update/delete policies: only service role writes.

-- =========================================================
-- Grants: authenticated can SELECT their own rows via RLS.
-- Service role always has full access; no extra grant needed.
-- =========================================================
grant select on mux_uploads to authenticated;

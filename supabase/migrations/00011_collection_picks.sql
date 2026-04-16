create table collection_picks (
  id            bigint generated always as identity primary key,
  user_id       uuid references profiles(id) on delete cascade,
  wine_id       bigint references wines(id),
  photo_url     text,
  memo          text,
  display_order smallint default 0,
  created_at    timestamptz default now()
);

create index idx_picks_user on collection_picks (user_id, display_order);

alter table collection_picks enable row level security;

create policy "picks_read" on collection_picks for select using (true);
create policy "picks_insert" on collection_picks for insert with check (auth.uid() = user_id);
create policy "picks_update" on collection_picks for update using (auth.uid() = user_id);
create policy "picks_delete" on collection_picks for delete using (auth.uid() = user_id);

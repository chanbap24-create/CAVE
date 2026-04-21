-- Memory photos attached to a single cellar bottle.
--
-- Paired with the tasting_note field on collections (00040), this holds
-- the "when I drank it" images surfaced on the /wine/[id] page. Photos
-- are stored in the post-images bucket under {user.id}/memories/... so
-- the existing storage RLS (00028) already protects uploads/reads.
--
-- Apply via `supabase db push`.

create table if not exists collection_photos (
  id           bigint generated always as identity primary key,
  collection_id bigint not null references collections(id) on delete cascade,
  user_id      uuid   not null references profiles(id)   on delete cascade,
  photo_url    text   not null,
  caption      text,
  created_at   timestamptz not null default now()
);

create index if not exists collection_photos_collection_idx
  on collection_photos (collection_id, created_at desc);

alter table collection_photos enable row level security;

-- Reads: owner sees their own; anyone with public access to the parent
-- collection can see the memory photos too.
drop policy if exists "collection_photos_read" on collection_photos;
create policy "collection_photos_read" on collection_photos
  for select to authenticated using (
    user_id = auth.uid()
    or exists (
      select 1 from collections c
      where c.id = collection_photos.collection_id
        and (c.is_public = true or c.user_id = auth.uid())
    )
  );

-- Only the collection owner can attach / remove memory photos.
drop policy if exists "collection_photos_insert_owner" on collection_photos;
create policy "collection_photos_insert_owner" on collection_photos
  for insert to authenticated with check (
    auth.uid() = user_id
    and exists (
      select 1 from collections c
      where c.id = collection_photos.collection_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "collection_photos_update_owner" on collection_photos;
create policy "collection_photos_update_owner" on collection_photos
  for update to authenticated using (auth.uid() = user_id);

drop policy if exists "collection_photos_delete_owner" on collection_photos;
create policy "collection_photos_delete_owner" on collection_photos
  for delete to authenticated using (auth.uid() = user_id);

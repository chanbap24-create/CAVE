-- Friend tags on memory photos + notification trigger.
--
-- Separate from the posts-level `photo_tags` table: that one keys on
-- post_id and supports wine tags too, which doesn't apply here (the
-- parent bottle is already the collection). Keeping them independent
-- avoids a muddled polymorphic FK.
--
-- Depends on 00042 for the notification_type enum value. Apply via
-- `supabase db push`.

create table if not exists collection_photo_tags (
  photo_id          bigint not null references collection_photos(id) on delete cascade,
  tagged_user_id    uuid   not null references profiles(id)           on delete cascade,
  tagged_by_user_id uuid   references profiles(id)                    on delete set null,
  x                 numeric(5,4) not null,  -- 0.0000 ~ 1.0000 of photo width
  y                 numeric(5,4) not null,  -- 0.0000 ~ 1.0000 of photo height
  created_at        timestamptz not null default now(),
  primary key (photo_id, tagged_user_id)
);

create index if not exists collection_photo_tags_user_idx
  on collection_photo_tags (tagged_user_id, created_at desc);

alter table collection_photo_tags enable row level security;

-- Anyone who can read the parent photo can read its tags.
drop policy if exists "collection_photo_tags_read" on collection_photo_tags;
create policy "collection_photo_tags_read" on collection_photo_tags
  for select to authenticated using (
    exists (select 1 from collection_photos cp where cp.id = collection_photo_tags.photo_id)
  );

-- Only the photo owner (= collection owner) can add or remove tags.
drop policy if exists "collection_photo_tags_insert_owner" on collection_photo_tags;
create policy "collection_photo_tags_insert_owner" on collection_photo_tags
  for insert to authenticated with check (
    auth.uid() = tagged_by_user_id
    and exists (
      select 1 from collection_photos cp
      where cp.id = collection_photo_tags.photo_id
        and cp.user_id = auth.uid()
    )
  );

drop policy if exists "collection_photo_tags_delete_owner" on collection_photo_tags;
create policy "collection_photo_tags_delete_owner" on collection_photo_tags
  for delete to authenticated using (
    exists (
      select 1 from collection_photos cp
      where cp.id = collection_photo_tags.photo_id
        and cp.user_id = auth.uid()
    )
  );

-- =========================================================
-- Tag → notify tagged user (SECURITY DEFINER, bypasses notif RLS)
-- =========================================================
create or replace function notify_on_collection_photo_tag() returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_collection_id bigint;
begin
  -- Skip self-tag.
  if NEW.tagged_by_user_id is not null and NEW.tagged_by_user_id = NEW.tagged_user_id then
    return null;
  end if;

  -- Walk up to the owning collection so the notification can deep-link
  -- straight into /wine/[collectionId].
  select cp.collection_id into v_collection_id
    from collection_photos cp where cp.id = NEW.photo_id;
  if v_collection_id is null then return null; end if;

  insert into notifications (user_id, type, actor_id, reference_id, reference_type, body)
  values (
    NEW.tagged_user_id, 'collection_photo_tag', NEW.tagged_by_user_id,
    v_collection_id::text, 'collection',
    'tagged you in a wine memory'
  );
  return null;
end;
$$;

drop trigger if exists trg_notify_collection_photo_tag on collection_photo_tags;
create trigger trg_notify_collection_photo_tag
after insert on collection_photo_tags
for each row execute function notify_on_collection_photo_tag();

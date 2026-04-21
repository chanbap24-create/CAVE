-- Auto-notify the wine owner when someone else likes or comments on
-- their cellar bottle. Mirrors the post-level pattern in 00004.
--
-- Depends on migration 00033 for the enum values.
-- Apply via `supabase db push`.

-- =========================================================
-- Collection like → notification
-- =========================================================
create or replace function notify_on_collection_like()
returns trigger as $$
declare
  owner uuid;
begin
  select user_id into owner from collections where id = NEW.collection_id;
  if owner is not null and owner <> NEW.user_id then
    insert into notifications (user_id, type, actor_id, reference_id, reference_type)
    values (owner, 'collection_like', NEW.user_id, NEW.collection_id::text, 'collection');
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_collection_like on collection_likes;
create trigger trg_notify_collection_like
after insert on collection_likes
for each row execute function notify_on_collection_like();

-- =========================================================
-- Collection comment → notification
-- =========================================================
create or replace function notify_on_collection_comment()
returns trigger as $$
declare
  owner uuid;
begin
  select user_id into owner from collections where id = NEW.collection_id;
  if owner is not null and owner <> NEW.user_id then
    insert into notifications (user_id, type, actor_id, reference_id, reference_type, body)
    values (owner, 'collection_comment', NEW.user_id, NEW.collection_id::text, 'collection', left(NEW.body, 100));
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_collection_comment on collection_comments;
create trigger trg_notify_collection_comment
after insert on collection_comments
for each row execute function notify_on_collection_comment();

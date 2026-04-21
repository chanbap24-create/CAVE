-- Enable threaded replies on both comment tables.
--
-- `comments` (posts) already had parent_id from the initial schema but
-- its notify trigger always pointed the notification at the post owner
-- — replies to a comment thread never reached the comment author.
-- This migration:
--   1. Adds parent_id to collection_comments (previously missing).
--   2. Rewrites notify_on_comment + notify_on_collection_comment so
--      replies notify the parent comment author; top-level comments
--      still notify the post/wine owner.
--
-- Apply via `supabase db push`.

alter table collection_comments add column if not exists parent_id bigint
  references collection_comments(id) on delete cascade;

create index if not exists collection_comments_parent_idx
  on collection_comments (parent_id);

-- =========================================================
-- Post comment trigger (replaces 00004's notify_on_comment)
-- =========================================================
create or replace function notify_on_comment()
returns trigger as $$
declare
  target_user uuid;
begin
  if NEW.parent_id is not null then
    -- Reply → notify the parent comment author.
    select user_id into target_user from comments where id = NEW.parent_id;
  else
    -- Top-level comment → notify the post owner.
    select user_id into target_user from posts where id = NEW.post_id;
  end if;

  if target_user is not null and target_user <> NEW.user_id then
    insert into notifications (user_id, type, actor_id, reference_id, reference_type, body)
    values (target_user, 'comment', NEW.user_id, NEW.post_id::text, 'post',
            left(NEW.content, 100));
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- =========================================================
-- Collection comment trigger (replaces 00034's version)
-- =========================================================
create or replace function notify_on_collection_comment() returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  target_user uuid;
begin
  if NEW.parent_id is not null then
    select user_id into target_user from collection_comments where id = NEW.parent_id;
  else
    select user_id into target_user from collections where id = NEW.collection_id;
  end if;

  if target_user is not null and target_user <> NEW.user_id then
    insert into notifications (user_id, type, actor_id, reference_id, reference_type, body)
    values (target_user, 'collection_comment', NEW.user_id,
            NEW.collection_id::text, 'collection', left(NEW.body, 100));
  end if;
  return null;
end;
$$;

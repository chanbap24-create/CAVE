-- Auto-create notifications on like, follow, comment

-- Like notification
create or replace function notify_on_like()
returns trigger as $$
declare
  post_owner uuid;
begin
  select user_id into post_owner from posts where id = NEW.post_id;
  if post_owner is not null and post_owner != NEW.user_id then
    insert into notifications (user_id, type, actor_id, reference_id, reference_type)
    values (post_owner, 'like', NEW.user_id, NEW.post_id::text, 'post');
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_like on likes;
create trigger trg_notify_like
after insert on likes
for each row execute function notify_on_like();

-- Follow notification
create or replace function notify_on_follow()
returns trigger as $$
begin
  insert into notifications (user_id, type, actor_id, reference_id, reference_type)
  values (NEW.following_id, 'follow', NEW.follower_id, NEW.follower_id::text, 'user');
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_follow on follows;
create trigger trg_notify_follow
after insert on follows
for each row execute function notify_on_follow();

-- Comment notification
create or replace function notify_on_comment()
returns trigger as $$
declare
  post_owner uuid;
begin
  select user_id into post_owner from posts where id = NEW.post_id;
  if post_owner is not null and post_owner != NEW.user_id then
    insert into notifications (user_id, type, actor_id, reference_id, reference_type, body)
    values (post_owner, 'comment', NEW.user_id, NEW.post_id::text, 'post', left(NEW.content, 100));
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_comment on comments;
create trigger trg_notify_comment
after insert on comments
for each row execute function notify_on_comment();

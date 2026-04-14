-- Delete like notification when unliked
create or replace function remove_like_notification()
returns trigger as $$
begin
  delete from notifications
  where type = 'like'
    and actor_id = OLD.user_id
    and reference_id = OLD.post_id::text
    and reference_type = 'post';
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_remove_like_notification on likes;
create trigger trg_remove_like_notification
after delete on likes
for each row execute function remove_like_notification();

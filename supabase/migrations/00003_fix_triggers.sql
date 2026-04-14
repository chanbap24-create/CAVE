-- Fix triggers to bypass RLS using SECURITY DEFINER

create or replace function update_follow_counts()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update profiles set follower_count = follower_count + 1 where id = NEW.following_id;
    update profiles set following_count = following_count + 1 where id = NEW.follower_id;
  elsif TG_OP = 'DELETE' then
    update profiles set follower_count = follower_count - 1 where id = OLD.following_id;
    update profiles set following_count = following_count - 1 where id = OLD.follower_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create or replace function update_like_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update posts set like_count = like_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update posts set like_count = like_count - 1 where id = OLD.post_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create or replace function update_comment_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update posts set comment_count = comment_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update posts set comment_count = comment_count - 1 where id = OLD.post_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create or replace function update_collection_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update profiles set collection_count = collection_count + 1 where id = NEW.user_id;
  elsif TG_OP = 'DELETE' then
    update profiles set collection_count = collection_count - 1 where id = OLD.user_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create or replace function update_post_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update profiles set post_count = post_count + 1 where id = NEW.user_id;
  elsif TG_OP = 'DELETE' then
    update profiles set post_count = post_count - 1 where id = OLD.user_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create or replace function update_gathering_member_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' and NEW.status = 'approved' then
    update gatherings set current_members = current_members + 1 where id = NEW.gathering_id;
  elsif TG_OP = 'DELETE' and OLD.status = 'approved' then
    update gatherings set current_members = current_members - 1 where id = OLD.gathering_id;
  elsif TG_OP = 'UPDATE' then
    if OLD.status != 'approved' and NEW.status = 'approved' then
      update gatherings set current_members = current_members + 1 where id = NEW.gathering_id;
    elsif OLD.status = 'approved' and NEW.status != 'approved' then
      update gatherings set current_members = current_members - 1 where id = NEW.gathering_id;
    end if;
  end if;
  return null;
end;
$$ language plpgsql security definer;

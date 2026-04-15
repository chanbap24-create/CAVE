-- Add video support to posts
alter table posts add column if not exists video_playback_id text;
alter table posts add column if not exists media_type text default 'image' check (media_type in ('image', 'video'));

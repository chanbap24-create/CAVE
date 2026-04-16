-- Photo tags: user tags and wine tags on post images
create table photo_tags (
  id            bigint generated always as identity primary key,
  post_id       bigint references posts(id) on delete cascade,
  tag_type      text not null check (tag_type in ('user', 'wine')),
  user_id       uuid references profiles(id) on delete cascade,
  wine_id       bigint references wines(id),
  x_position    real not null,  -- 0.0 ~ 1.0 (percentage from left)
  y_position    real not null,  -- 0.0 ~ 1.0 (percentage from top)
  created_at    timestamptz default now()
);

create index idx_photo_tags_post on photo_tags (post_id);

alter table photo_tags enable row level security;

create policy "photo_tags_read" on photo_tags for select using (true);
create policy "photo_tags_insert" on photo_tags for insert with check (auth.uid() is not null);
create policy "photo_tags_delete" on photo_tags for delete using (
  exists (select 1 from posts where posts.id = photo_tags.post_id and posts.user_id = auth.uid())
);

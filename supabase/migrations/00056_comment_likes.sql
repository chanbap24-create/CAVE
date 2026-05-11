-- ============================================================
-- 댓글 좋아요 ("공감") — collection_comments 단위.
--
-- 와인 카탈로그 페이지에서 "대표 댓글" (좋아요 상위 3개) 노출의 데이터 베이스.
-- 향후 다른 댓글 도메인(cellar_comments 등) 으로 확장 가능 — 별 변형 없이.
--
-- 구조: comment_likes (user × comment unique) + collection_comments.like_count
-- 컬럼 (denormalized, 트리거로 유지). 카운트 read 가 흔하므로 매 read 마다
-- COUNT(*) 하지 않도록 컬럼화.
-- ============================================================

create table if not exists comment_likes (
  id bigint generated always as identity primary key,
  comment_id bigint not null references collection_comments(id) on delete cascade,
  user_id    uuid   not null references profiles(id)            on delete cascade,
  created_at timestamptz not null default now(),
  unique (comment_id, user_id)
);

create index if not exists comment_likes_comment_idx on comment_likes (comment_id);
create index if not exists comment_likes_user_idx    on comment_likes (user_id);

alter table collection_comments
  add column if not exists like_count int not null default 0;

create index if not exists collection_comments_like_count_idx
  on collection_comments (like_count desc)
  where like_count > 0;

-- 카운트 유지 트리거
create or replace function _maintain_comment_like_count() returns trigger
language plpgsql
as $$
begin
  if (TG_OP = 'INSERT') then
    update collection_comments
       set like_count = like_count + 1
     where id = NEW.comment_id;
  elsif (TG_OP = 'DELETE') then
    update collection_comments
       set like_count = greatest(0, like_count - 1)
     where id = OLD.comment_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_comment_like_count on comment_likes;
create trigger trg_comment_like_count
  after insert or delete on comment_likes
  for each row execute function _maintain_comment_like_count();

-- RLS
alter table comment_likes enable row level security;

-- Read: 인증된 사용자 누구나 (대표 댓글 표시용 + 본인 좋아요 여부 확인용)
drop policy if exists "comment_likes_read" on comment_likes;
create policy "comment_likes_read" on comment_likes
  for select to authenticated using (true);

-- Insert: 본인 row 만
drop policy if exists "comment_likes_insert" on comment_likes;
create policy "comment_likes_insert" on comment_likes
  for insert to authenticated
  with check (auth.uid() = user_id);

-- Delete: 본인 row 만
drop policy if exists "comment_likes_delete" on comment_likes;
create policy "comment_likes_delete" on comment_likes
  for delete to authenticated using (auth.uid() = user_id);

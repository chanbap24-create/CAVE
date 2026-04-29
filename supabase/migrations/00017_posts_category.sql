-- Add drink category to posts so users can label posts even without tagging a specific wine.
-- Nullable (existing posts stay NULL; users can skip the selector).
-- Apply via `supabase db push` or SQL editor.

alter table posts add column if not exists category text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'posts_category_valid') then
    alter table posts add constraint posts_category_valid
      check (category is null or category in ('wine','whiskey','sake','cognac','other'));
  end if;
end $$;

-- Partial index for filtered queries (e.g., "only wine posts"). Skip NULLs.
create index if not exists idx_posts_category on posts(category) where category is not null;

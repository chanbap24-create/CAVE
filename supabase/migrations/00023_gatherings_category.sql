-- Drink category on gatherings, mirroring the posts.category pattern from
-- 00017. Lets hosts label a gathering ("Bordeaux blind", "Whisky tasting")
-- and lets viewers filter by type on the gatherings tab.
--
-- Nullable (existing gatherings keep NULL). CHECK constraint mirrors the
-- posts one so the same five enum keys apply everywhere.
--
-- Apply via `supabase db push` or Dashboard SQL editor.

alter table gatherings add column if not exists category text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'gatherings_category_valid') then
    alter table gatherings add constraint gatherings_category_valid
      check (category is null or category in ('wine','whiskey','sake','cognac','other'));
  end if;
end $$;

create index if not exists idx_gatherings_category
  on gatherings(category) where category is not null;

-- Add owner-editable tasting note to each cellar bottle.
--
-- The `/wine/[id]` detail page pairs this text with the existing
-- collection_comments / collection_likes social layer so one bottle has
-- both a private-authored note and a public thread. Null = no note yet.
--
-- Apply via `supabase db push`.

alter table collections add column if not exists tasting_note text;
alter table collections add column if not exists tasting_note_updated_at timestamptz;

-- Auto-touch the timestamp whenever the note changes so the UI can show
-- "edited 3d ago" without a second round-trip.
create or replace function touch_collection_tasting_note() returns trigger
language plpgsql
as $$
begin
  if NEW.tasting_note is distinct from OLD.tasting_note then
    NEW.tasting_note_updated_at = now();
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_touch_collection_tasting_note on collections;
create trigger trg_touch_collection_tasting_note
  before update on collections
  for each row execute function touch_collection_tasting_note();

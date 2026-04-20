-- Per-user bottle photo on collections
-- The `wines` table carries a shared `image_url` that represents the
-- canonical product image (often null). When a user scans their own bottle
-- we want to keep their personal photo alongside the collection entry so it
-- can be reused in MyPicks, profile cards, post composition, etc., without
-- overwriting the shared wine image or exposing it to other users.
--
-- Column is nullable (existing rows stay as-is) and has no RLS changes
-- because collections is already scoped owner-only.
--
-- Apply via `supabase db push`.

alter table collections
  add column if not exists photo_url text;

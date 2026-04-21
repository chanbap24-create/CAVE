-- Add notification enum values that the app has been inserting without
-- a matching enum entry. Silent failures were likely happening for the
-- gathering_vote_* types introduced in Phase 5 since the enum was still
-- the tight 00001 list.
--
-- Must run in its own migration because Postgres won't let the same
-- transaction both ADD VALUE and reference the new value in a later
-- function body. 00034 installs the triggers that use these values.
--
-- Apply via `supabase db push`.

alter type notification_type add value if not exists 'collection_like';
alter type notification_type add value if not exists 'collection_comment';
alter type notification_type add value if not exists 'gathering_vote_request';
alter type notification_type add value if not exists 'gathering_vote_cast';
alter type notification_type add value if not exists 'gathering_vote_approved';
alter type notification_type add value if not exists 'gathering_vote_rejected';

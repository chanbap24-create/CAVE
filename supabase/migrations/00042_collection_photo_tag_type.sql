-- Add the notification_type enum value first so the trigger in 00043 can
-- safely reference it. Split-file because Postgres doesn't allow a newly
-- added enum value to be used in the same transaction that created it.

alter type notification_type add value if not exists 'collection_photo_tag';

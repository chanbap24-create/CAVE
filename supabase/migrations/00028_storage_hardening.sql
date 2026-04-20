-- Tighten Supabase Storage access for the post-images bucket.
--
-- Threat model:
--   1. Anonymous users have no legitimate reason to upload. Restricting
--      insert to `authenticated` closes a silent abuse vector.
--   2. A user uploading to someone else's folder (e.g. `other_user/...`)
--      would be a path-traversal attack. The policy enforces that the
--      first path segment matches the authenticated user's UUID.
--   3. File type filtering happens client-side today (ALLOWED_IMAGE_EXTS
--      in lib/utils/imageUpload.ts); the bucket itself doesn't restrict
--      MIME types, so a crafted PUT could upload anything. Supabase
--      buckets support a file_size_limit + allowed_mime_types config
--      via `storage.buckets` UPDATE.
--
-- Reads stay public so shared-URL images work in the feed.
-- Apply via `supabase db push`.

-- ============================================
-- Bucket config — size + MIME filter at the bucket level
-- ============================================
-- 10 MB per file (Expo's ImagePicker quality:0.8 produces ≪10MB jpegs).
-- MIME allowlist matches imageUpload.ts extension set.
update storage.buckets
   set file_size_limit = 10 * 1024 * 1024,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
 where id = 'post-images';

-- ============================================
-- Object-level policies
-- ============================================
-- Reads remain public (needed for CDN-served feed images).
drop policy if exists "post-images public read" on storage.objects;
drop policy if exists "post_images_public_read" on storage.objects;
create policy "post_images_public_read" on storage.objects
  for select using (bucket_id = 'post-images');

-- Writes require auth + the first path segment must equal the user's UUID.
-- uploadImage() follows `{user.id}/...` convention so legitimate clients
-- pass. Prevents user A writing to user B's folder.
drop policy if exists "post_images_owner_insert" on storage.objects;
create policy "post_images_owner_insert" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'post-images'
    and auth.uid()::text = split_part(name, '/', 1)
  );

-- Self-update (replace own file) and self-delete only.
drop policy if exists "post_images_owner_update" on storage.objects;
create policy "post_images_owner_update" on storage.objects
  for update to authenticated using (
    bucket_id = 'post-images'
    and auth.uid()::text = split_part(name, '/', 1)
  );

drop policy if exists "post_images_owner_delete" on storage.objects;
create policy "post_images_owner_delete" on storage.objects
  for delete to authenticated using (
    bucket_id = 'post-images'
    and auth.uid()::text = split_part(name, '/', 1)
  );

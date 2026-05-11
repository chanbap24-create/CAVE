-- ============================================================
-- wines.image_url 첫 기여자 채움 정책 + storage 업로드 권한.
--
-- 흐름: 라벨 스캔 → wine row 매칭/생성 → image_url 이 NULL 이면 사용자
-- 스캔 사진을 (가능하면 누끼 적용해서) post-images 버킷의 wines/ 폴더에
-- 업로드 → wines.image_url 갱신.
--
-- 정책 핵심
--  1. wines UPDATE: image_url 이 NULL 일 때만 허용 → 한 번 채워지면 잠금.
--     향후 admin/품질 검증 흐름에서 별도 권한으로 교체 가능.
--  2. storage post-images 버킷의 wines/ 경로: 인증 사용자 upsert 가능.
--     첫 업로드 winner. 동일 경로 재업로드는 race 상황에서 자연 차단.
--
-- 이 정책은 "낙관적 자동 기여" 방식 — 신뢰 기반. v2 에서 spam 발견 시
-- 신고/롤백 흐름 추가.
-- ============================================================

drop policy if exists "wines_image_contribute" on wines;
create policy "wines_image_contribute" on wines
  for update to authenticated
  using (image_url is null)
  with check (true);

-- Storage: post-images 버킷의 wines/ 폴더 업로드 권한.
-- 기존 post_images_owner_insert 는 {user_id}/ 패턴이라 wines/ 는 막힘 → 별도.
drop policy if exists "wines_image_upload" on storage.objects;
create policy "wines_image_upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'post-images'
    and name like 'wines/%'
  );

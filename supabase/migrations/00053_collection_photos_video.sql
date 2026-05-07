-- ============================================================
-- collection_photos 에 비디오(Mux) 첨부 가능하도록 확장.
--
-- SNS 포스트 흐름이 사라지면서 사용자가 비디오를 업로드할 자리가
-- 사라졌음. 와인 상세 페이지의 메모리 그리드(MemoryPhotoGrid)에
-- 사진과 함께 비디오도 첨부 가능하게 함.
--
-- video_playback_id : Mux 비디오 playback id (signed playback policy).
--                     mux-playback-token EF 가 collection_photos 권한도
--                     발급 가능하도록 동시에 확장 (별도 EF 패치).
--
-- photo_url 은 비디오 row 일 때 null 허용. CHECK 으로 둘 중 하나는 보장.
-- ============================================================

alter table collection_photos
  add column if not exists video_playback_id text;

alter table collection_photos
  alter column photo_url drop not null;

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'collection_photos_media_required'
  ) then
    alter table collection_photos
      add constraint collection_photos_media_required
      check (photo_url is not null or video_playback_id is not null);
  end if;
end $$;

-- 비디오 검색/조회 인덱스 — mux-playback-token EF 의 RLS 점검 쿼리에서 사용.
create index if not exists collection_photos_video_idx
  on collection_photos (video_playback_id)
  where video_playback_id is not null;

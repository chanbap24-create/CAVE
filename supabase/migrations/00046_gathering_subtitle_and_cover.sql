-- ============================================================
-- 모임 카드 hero 안에 노출될 부제목 + 커버 이미지.
-- 호스트가 모임 만들 때 직접 입력 → 라이브 프리뷰로 즉시 반영.
--
-- subtitle        : 제목 아래 한 줄 카피 (예: "부르고뉴 1er Cru 4종 블라인드")
-- cover_image_url : 카드 hero 에 들어갈 사진. variant 별 위치/크기 다름.
-- ============================================================

alter table gatherings
  add column if not exists subtitle text,
  add column if not exists cover_image_url text;

-- 길이 제한 (CHECK). NULL 허용 (선택 입력).
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'gathering_subtitle_length') then
    alter table gatherings
      add constraint gathering_subtitle_length
      check (subtitle is null or char_length(subtitle) <= 200);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'gathering_cover_image_url_length') then
    alter table gatherings
      add constraint gathering_cover_image_url_length
      check (cover_image_url is null or char_length(cover_image_url) <= 1000);
  end if;
end $$;

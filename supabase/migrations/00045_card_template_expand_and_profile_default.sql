-- ============================================================
-- 모임 카드 템플릿 확장 + 프로필 기본 템플릿.
--
-- 1) gatherings.card_template CHECK 를 12개 키로 확장
--    (기본 6 + mood 3 + season 3)
-- 2) profiles.default_card_template 추가 — 호스트가 자주 쓰는 디자인.
--    모임 개설 시 기본값으로 자동 적용 (앱 단에서 prefill, 변경 가능).
-- ============================================================

-- 12개 통합 키 셋 (cardTemplates.ts 와 동기화)
-- basic   : classic_navy, warm_salmon, lavender_dawn, forest_sage,
--           sunset_mustard, cool_sky
-- mood    : deep_burgundy, crisp_white, sparkling_rose
-- season  : autumn_cognac, winter_evergreen, midnight_velvet

-- 1) gatherings.card_template CHECK 재정의
alter table gatherings
  drop constraint if exists gathering_card_template_valid;

alter table gatherings
  add constraint gathering_card_template_valid
  check (
    card_template in (
      'classic_navy', 'warm_salmon', 'lavender_dawn',
      'forest_sage', 'sunset_mustard', 'cool_sky',
      'deep_burgundy', 'crisp_white', 'sparkling_rose',
      'autumn_cognac', 'winter_evergreen', 'midnight_velvet'
    )
  );

-- 2) profiles.default_card_template — 호스트의 "내 기본 디자인"
alter table profiles
  add column if not exists default_card_template text default 'classic_navy';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profile_default_card_template_valid') then
    alter table profiles
      add constraint profile_default_card_template_valid
      check (
        default_card_template in (
          'classic_navy', 'warm_salmon', 'lavender_dawn',
          'forest_sage', 'sunset_mustard', 'cool_sky',
          'deep_burgundy', 'crisp_white', 'sparkling_rose',
          'autumn_cognac', 'winter_evergreen', 'midnight_velvet'
        )
      );
  end if;
end $$;

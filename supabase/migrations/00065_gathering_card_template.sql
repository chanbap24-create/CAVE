-- ============================================================
-- 모임 카드 디자인 템플릿 키 — 트레바리 패턴.
-- 호스트가 모임 만들 때 6개 샘플 중 하나 선택.
-- ============================================================

alter table gatherings
  add column if not exists card_template text default 'classic_navy';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'gathering_card_template_valid') then
    alter table gatherings
      add constraint gathering_card_template_valid
      check (
        card_template in (
          'classic_navy', 'warm_salmon', 'lavender_dawn',
          'forest_sage', 'sunset_mustard', 'cool_sky'
        )
      );
  end if;
end $$;

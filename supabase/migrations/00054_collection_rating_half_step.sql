-- ============================================================
-- collections.rating 0.5 단위 별점 허용.
--
-- 기존: smallint check (rating between 1 and 5) — 1~5 정수만.
-- 변경: numeric(2,1) check (rating in {0.5, 1.0, ..., 5.0}).
--
-- TastingNoteEditor 의 별점 UI 가 좌/우 절반 탭으로 0.5 단위 입력을
-- 받도록 확장된 데 따른 데이터 모델 정합화.
-- ============================================================

-- 인라인 check 는 자동 생성 이름. drop if exists 로 안전.
alter table collections drop constraint if exists collections_rating_check;

alter table collections
  alter column rating type numeric(2,1) using rating::numeric(2,1);

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'collections_rating_half_step'
  ) then
    alter table collections
      add constraint collections_rating_half_step
      check (
        rating is null
        or (rating >= 0.5 and rating <= 5 and (rating * 2)::int = rating * 2)
      );
  end if;
end $$;

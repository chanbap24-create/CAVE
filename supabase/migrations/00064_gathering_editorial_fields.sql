-- ============================================================
-- 모임 상세 페이지 에디토리얼 필드 — 트레바리 스타일.
--
-- description 은 이미 5000자 (00015) → long-form 마크다운 그대로 사용 가능.
-- 추가:
--   pitch_bullets: '이런 분께 추천' 3~5줄. 인용구 스타일로 강조 노출.
--   agreement:     '이 모임의 약속' (참여 규칙·준비물). 트러스트 신호.
-- ============================================================

alter table gatherings
  add column if not exists pitch_bullets text[],
  add column if not exists agreement text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'gathering_pitch_bullets_count') then
    -- 최대 8개. 각 항목 길이는 application 측 검증.
    alter table gatherings
      add constraint gathering_pitch_bullets_count
      check (
        pitch_bullets is null
        or array_length(pitch_bullets, 1) <= 8
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'gathering_agreement_length') then
    alter table gatherings
      add constraint gathering_agreement_length
      check (agreement is null or char_length(agreement) <= 2000);
  end if;
end $$;

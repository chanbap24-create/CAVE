-- ============================================================
-- 파트너 프로필 확장: 자기소개/경력/전문분야/대표사진.
--
-- 트레바리 클럽 리더 소개 패턴 참고 — 모임 상세 카드에 호스트 인트로가
-- 자연스럽게 노출되도록 데이터 모델 확장.
-- ============================================================

alter table profiles
  add column if not exists partner_bio          text,
  add column if not exists partner_career       text,
  add column if not exists partner_specialties  text[],
  add column if not exists partner_photo_url    text;

-- 길이 제한 (CHECK constraint). NULL 허용 (선택적 입력).
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'partner_bio_len') then
    alter table profiles
      add constraint partner_bio_len
      check (partner_bio is null or char_length(partner_bio) <= 2000);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'partner_career_len') then
    alter table profiles
      add constraint partner_career_len
      check (partner_career is null or char_length(partner_career) <= 3000);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'partner_specialties_count') then
    -- 전문분야 태그 최대 8개. 각 항목 길이는 application 측 검증 (CHECK 에서 서브쿼리 불가).
    alter table profiles
      add constraint partner_specialties_count
      check (
        partner_specialties is null
        or array_length(partner_specialties, 1) <= 8
      );
  end if;
end $$;

-- partner_bio / partner_career / partner_specialties / partner_photo_url 는
-- 파트너 본인이 자유롭게 수정 가능 (lock_partner_columns 에 포함 X).
-- is_partner / partner_label 만 service_role 이 잠금.
